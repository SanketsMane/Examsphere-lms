"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/action-security";
import { sendTeacherVerificationSubmissionEmail } from "@/lib/email-notifications";
import { constructS3Url } from "@/lib/s3-helper";

const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export async function saveBankDetails(data: {
    bankAccountName: string;
    bankAccountNumber: string;
    // Stores the IFSC code; the column name predates the switch to Indian banking.
    bankRoutingNumber: string;
}) {
    const session = await requireTeacher();

    const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!teacher) throw new Error("Teacher profile not found");

    const ifsc = data.bankRoutingNumber.trim().toUpperCase();
    if (!IFSC_PATTERN.test(ifsc)) {
        throw new Error("Enter a valid 11-character IFSC code (e.g. SBIN0001234)");
    }
    const accountNumber = data.bankAccountNumber.replace(/\s+/g, "");
    if (!/^\d{9,18}$/.test(accountNumber)) {
        throw new Error("Enter a valid bank account number (9-18 digits)");
    }
    const payload = {
        bankAccountName: data.bankAccountName.trim(),
        bankAccountNumber: accountNumber,
        bankRoutingNumber: ifsc,
    };

    await prisma.teacherVerification.upsert({
        where: { teacherId: teacher.id },
        create: {
            teacherId: teacher.id,
            ...payload,
            status: "Pending",
            qualificationDocuments: [],
            experienceDocuments: [],
        },
        update: {
            ...payload,
            bankVerifiedAt: null,
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
        if (Array.isArray(urls)) throw new Error("Identity document must be a single file");
        updateData.identityDocumentUrl = urls;
        updateData.identityVerifiedAt = null; // Reset verification on new upload
    } else if (type === 'qualification') {
        // Uploads are appended; removal goes through removeVerificationDocument.
        const urlList = Array.isArray(urls) ? urls : [urls];
        const current = await prisma.teacherVerification.findUnique({ where: { teacherId: teacher.id } });
        const currentDocs = (current?.qualificationDocuments as string[]) || [];
        updateData.qualificationDocuments = [...currentDocs, ...urlList];
        updateData.qualificationsVerifiedAt = null;
    } else if (type === 'experience') {
        const urlList = Array.isArray(urls) ? urls : [urls];
        const current = await prisma.teacherVerification.findUnique({ where: { teacherId: teacher.id } });
        const currentDocs = (current?.experienceDocuments as string[]) || [];
        updateData.experienceDocuments = [...currentDocs, ...urlList];
        updateData.experienceVerifiedAt = null;
    }

    // Defaults go first so a freshly uploaded document list isn't wiped on create.
    await prisma.teacherVerification.upsert({
        where: { teacherId: teacher.id },
        create: {
            qualificationDocuments: [],
            experienceDocuments: [],
            ...updateData,
            teacherId: teacher.id,
            status: "Pending",
        },
        update: {
            ...updateData,
            status: "Pending", // Reset to pending on change - author: Sanket
            approvedAt: null,
            reviewedAt: null,
            // Changed documents need an explicit re-submit before admins review again.
            submittedAt: null,
        }
    });

    revalidatePath("/teacher/verification");

    // Admins are notified via submitVerification, not on every upload.
    return { success: true };
}

export async function submitVerification(): Promise<{ success: true; error?: undefined } | { error: string; success?: undefined }> {
    const session = await requireTeacher();

    const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id },
        include: { verification: true }
    });

    if (!teacher || !teacher.verification) {
        return { error: "Please upload your documents before submitting." };
    }

    const verification = teacher.verification;

    // A new record is created with status Pending, so status alone can't tell a draft from a
    // submitted application — submittedAt is the real marker.
    if (teacher.isApproved || verification.status === "Approved") {
        return { error: "Your account is already approved." };
    }
    if (verification.submittedAt && (verification.status === "Pending" || verification.status === "UnderReview")) {
        return { error: "Your application is already awaiting admin approval." };
    }

    if (!verification.identityDocumentUrl) {
        return { error: "An identity document (Aadhaar, PAN or Passport) is required." };
    }

    await prisma.teacherVerification.update({
        where: { id: verification.id },
        data: {
            status: "Pending",
            submittedAt: new Date(),
            rejectionReason: null,
            rejectedAt: null,
        }
    });

    const formatLink = (url: string) => {
        const fullUrl = constructS3Url(url);
        const name = url.split('/').pop() || "Document";
        return `<a href="${fullUrl}" class="doc-link" target="_blank">${name}</a>`;
    };

    const identityHtml = formatLink(verification.identityDocumentUrl);
    const qualDocs = (verification.qualificationDocuments as string[] | null) || [];
    const expDocs = (verification.experienceDocuments as string[] | null) || [];
    const qualHtml = qualDocs.length > 0 ? qualDocs.map(formatLink).join("<br>") : "<em>No documents provided</em>";
    const expHtml = expDocs.length > 0 ? expDocs.map(formatLink).join("<br>") : "<em>No documents provided</em>";

    const admins = await prisma.user.findMany({
        where: { role: 'admin' },
        select: { id: true, email: true }
    });

    // The submission is already recorded; a notification failure must not make the teacher retry.
    try {
        if (admins.length > 0) {
            await prisma.notification.createMany({
                data: admins.map(admin => ({
                    userId: admin.id,
                    title: "Verification Request",
                    message: `${session.user.name || "A teacher"} has submitted documents for verification.`,
                    type: "System" as const,
                    data: {
                        teacherId: teacher.id,
                        teacherName: session.user.name,
                        verificationId: verification.id
                    }
                }))
            });
        }
    } catch (e) {
        console.error("Failed to create admin verification notifications", e);
    }

    for (const admin of admins) {
        if (!admin.email) continue;
        try {
            await sendTeacherVerificationSubmissionEmail(
                admin.email,
                session.user.name || "Unknown Teacher",
                session.user.email || "No Email",
                identityHtml,
                qualHtml,
                expHtml
            );
        } catch (e) {
            console.error("Failed to email admin about verification", e);
        }
    }

    revalidatePath("/teacher/verification");
    revalidatePath("/teacher");
    return { success: true };
}

export async function removeVerificationDocument(type: 'identity' | 'qualification' | 'experience', urlToRemove: string) {
    const session = await requireTeacher();

    const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id }
    });
    if (!teacher) throw new Error("Teacher profile not found");

    const verification = await prisma.teacherVerification.findUnique({ where: { teacherId: teacher.id } });
    if (!verification) return { success: false };

    const updateData: any = {};

    if (type === 'identity') {
        if (verification.identityDocumentUrl !== urlToRemove) return { success: false };
        updateData.identityDocumentUrl = null;
        updateData.identityVerifiedAt = null;
    } else if (type === 'qualification') {
        const docs = (verification.qualificationDocuments as string[]) || [];
        updateData.qualificationDocuments = docs.filter(u => u !== urlToRemove);
    } else if (type === 'experience') {
        const docs = (verification.experienceDocuments as string[]) || [];
        updateData.experienceDocuments = docs.filter(u => u !== urlToRemove);
    }

    await prisma.teacherVerification.update({
        where: { teacherId: teacher.id },
        data: {
            ...updateData,
            // A submitted application changed underneath the reviewer, so it must be re-submitted.
            ...(verification.status !== "Approved" ? { submittedAt: null, status: "Pending" as const } : {}),
        }
    });

    revalidatePath("/teacher/verification");
    return { success: true };
}
