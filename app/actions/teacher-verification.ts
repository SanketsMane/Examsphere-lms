"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/action-security";
import { sendTeacherVerificationSubmissionEmail } from "@/lib/email-notifications";
import { env } from "@/lib/env";

export async function saveBankDetails(data: {
    bankAccountName: string;
    bankAccountNumber: string;
    bankRoutingNumber: string;
}) {
    const session = await requireTeacher();

    const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!teacher) throw new Error("Teacher profile not found");

    // Upsert verification record
    await prisma.teacherVerification.upsert({
        where: { teacherId: teacher.id },
        create: {
            teacherId: teacher.id,
            ...data,
            // status default is Pending in schema, so we can omit or explicit
        },
        update: {
            ...data
        }
    });

    revalidatePath("/teacher/verification");
    return { success: true };
}

export async function getVerificationStatus() {
    const session = await requireTeacher();

    const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id },
        include: { verification: true }
    });

    if (!teacher) return null;

    return {
        isVerified: teacher.isVerified,
        isApproved: teacher.isApproved,
        verification: teacher.verification
    };
}


export async function saveVerificationDocument(type: 'identity' | 'qualification' | 'experience', urls: string | string[]) {
    const session = await requireTeacher();

    const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!teacher) throw new Error("Teacher profile not found");

    const updateData: any = {};

    if (type === 'identity') {
        // Identity is single URL
        if (Array.isArray(urls)) throw new Error("Identity document must be a single file");
        updateData.identityDocumentUrl = urls;
        updateData.identityVerifiedAt = null; // Reset verification on new upload
    } else if (type === 'qualification') {
        // Qualification is array
        const urlList = Array.isArray(urls) ? urls : [urls];
        // We probably want to APPEND or REPLACE. For simplicity, let's say we pass the NEW list.
        // Or if the UI passes a single new URL, we append it.
        // Let's assume the UI manages the list state and sends the *newly uploaded* URL to be appended.
        // Actually, safer to just push to the array.
        // But what if we want to remove?
        // Let's make this action "addDocument".
        // But for identity it's "set".

        // Let's fetch current to append
        const current = await prisma.teacherVerification.findUnique({ where: { teacherId: teacher.id } });
        const currentDocs = current?.qualificationDocuments || [];
        updateData.qualificationDocuments = [...currentDocs, ...urlList];
        updateData.qualificationsVerifiedAt = null;
    } else if (type === 'experience') {
        const urlList = Array.isArray(urls) ? urls : [urls];
        const current = await prisma.teacherVerification.findUnique({ where: { teacherId: teacher.id } });
        const currentDocs = current?.experienceDocuments || [];
        updateData.experienceDocuments = [...currentDocs, ...urlList];
        updateData.experienceVerifiedAt = null;
    }

    await prisma.teacherVerification.upsert({
        where: { teacherId: teacher.id },
        create: {
            teacherId: teacher.id,
            ...updateData
        },
        update: updateData
    });

    revalidatePath("/teacher/verification");

    // Emails are now sent via submitVerification action, not on every save.
    // This prevents spamming admins with 3 emails for 3 uploads.

    return { success: true };
}

export async function submitVerification() {
    const session = await requireTeacher();

    const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id },
        include: { verification: true }
    });

    if (!teacher || !teacher.verification) throw new Error("Teacher profile or verification data not found");

    // Validate required fields
    if (!teacher.verification.identityDocumentUrl) {
        throw new Error("Identity document is required");
    }

    const verification = teacher.verification;

    // Update submitted status and time
    await prisma.teacherVerification.update({
        where: { id: verification.id },
        data: {
            status: 'Pending',
            submittedAt: new Date(),
        }
    });

    // Helper to format links
    const formatLink = (url: string) => {
        // Construct full URL if needed (User mock or S3)
        // If mocked, it's just a string key. If from S3, it might also be just a key.
        // Assuming we need to prepend bucket URL unless it's a full URL.
        const fullUrl = url.startsWith('http')
            ? url
            : `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.fly.storage.tigris.dev/${url}`;
        const name = url.split('/').pop() || "Document";
        return `<a href="${fullUrl}" class="doc-link" target="_blank">${name}</a>`;
    };

    const identityHtml = Array.isArray(verification.identityDocumentUrl)
        ? verification.identityDocumentUrl.map(formatLink).join("<br>")
        : formatLink(verification.identityDocumentUrl as string);

    const qualHtml = verification.qualificationDocuments && verification.qualificationDocuments.length > 0
        ? verification.qualificationDocuments.map(formatLink).join("<br>")
        : "<em>No documents provided</em>";

    const expHtml = verification.experienceDocuments && verification.experienceDocuments.length > 0
        ? verification.experienceDocuments.map(formatLink).join("<br>")
        : "<em>No documents provided</em>";


    try {
        // Notify Admins
        const admins = await prisma.user.findMany({
            where: { role: 'admin' },
            select: { email: true, name: true }
        });

        for (const admin of admins) {
            if (admin.email) {
                await sendTeacherVerificationSubmissionEmail(
                    admin.email,
                    session.user.name || "Unknown Teacher",
                    session.user.email || "No Email",
                    identityHtml,
                    qualHtml,
                    expHtml
                );
            }
        }
        return { success: true };
    } catch (e) {
        console.error("Failed to send admin notification", e);
        throw new Error("Failed to submit verification request");
    }
}

export async function removeVerificationDocument(type: 'qualification' | 'experience', urlToRemove: string) {
    const session = await requireTeacher();

    const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id }
    });
    if (!teacher) throw new Error("Teacher profile not found");

    const verification = await prisma.teacherVerification.findUnique({ where: { teacherId: teacher.id } });
    if (!verification) return { success: false };

    const updateData: any = {};

    if (type === 'qualification') {
        updateData.qualificationDocuments = verification.qualificationDocuments.filter(u => u !== urlToRemove);
    } else if (type === 'experience') {
        updateData.experienceDocuments = verification.experienceDocuments.filter(u => u !== urlToRemove);
    }

    await prisma.teacherVerification.update({
        where: { teacherId: teacher.id },
        data: updateData
    });

    revalidatePath("/teacher/verification");
    return { success: true };
}
