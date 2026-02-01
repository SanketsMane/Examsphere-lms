"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendNotificationEmail } from "@/lib/email-notifications";
import { requireAdmin } from "@/lib/action-security";

export async function approveTeacher(profileId: string) {
    try {
        const session = await requireAdmin();
        const adminId = (session.user as any).id;

        const teacher = await prisma.teacherProfile.update({
            where: { id: profileId },
            data: {
                isVerified: true,
                isApproved: true
            },
            include: { user: true, verification: true }
        });

        // Update verification record
        if (teacher.verification) {
            await prisma.teacherVerification.update({
                where: { id: teacher.verification.id },
                data: {
                    status: 'Approved',
                    reviewedAt: new Date(),
                    reviewedById: adminId
                }
            });
        }

        if (teacher.user.email) {
            await sendNotificationEmail(
                teacher.user.email,
                teacher.user.name || "Teacher",
                "Profile Approved",
                "Your teacher profile has been approved!",
                "You can now create courses and start teaching on our platform."
            );
        }

        // Create database notification for the teacher
        await prisma.notification.create({
            data: {
                userId: teacher.userId,
                title: "Profile Approved",
                message: "Congratulations! Your teacher profile has been approved. You can now start teaching.",
                type: "System"
            }
        });

        revalidatePath("/admin/team");
        revalidatePath("/admin/verification");
        return { success: true };
    } catch (error) {
        console.error("Failed to approve teacher:", error);
        return { error: "Failed to approve teacher" };
    }
}

export async function rejectTeacher(profileId: string, userId: string) {
    try {
        const session = await requireAdmin();
        const adminId = session?.user?.id;

        // Do NOT delete profile, just set approved=false and verification status = Rejected
        const teacher = await prisma.teacherProfile.update({
            where: { id: profileId },
            data: {
                isVerified: false,
                isApproved: false
            },
            include: { user: true, verification: true }
        });

        if (teacher.verification) {
            await prisma.teacherVerification.update({
                where: { id: teacher.verification.id },
                data: {
                    status: 'Rejected',
                    reviewedAt: new Date(),
                    reviewedById: adminId
                }
            });
        }

        // Ideally we don't revert role to student if we want them to re-apply using same profile?
        // But if we want to "reset" them, we might left role as is (teacher) but unapproved.
        // User asked to "reject", usually implies sending back to drawing board.
        // If we keep role 'teacher' but unapproved, they will see verification page again (based on my dashboard check).

        // Let's NOT revert role to student, as that disconnects them from TeacherProfile logically in some flows potentially,
        // or just makes them a student who happens to have a (now hidden) teacher profile.
        // Actually, if we keep them as teacher, they can login and see "Not Approved" message or Verification page.
        // The dashboard check I added:
        // if (!teacherProfile.isApproved) redirect("/teacher/verification");
        // So keeping role 'teacher' is correct. They will be redirected to verification to re-submit.

        if (teacher.user.email) {
            await sendNotificationEmail(
                teacher.user.email,
                teacher.user.name || "User",
                "Profile Rejected",
                "Your teacher application was not approved.",
                "Please review your documents and profile information, then submit again."
            );
        }

        // Create database notification for the teacher
        await prisma.notification.create({
            data: {
                userId: teacher.userId,
                title: "Application Status Update",
                message: "Your teacher application was not approved. Please check your email for details and re-submit your profile.",
                type: "System"
            }
        });

        revalidatePath("/admin/team");
        revalidatePath("/admin/verification");
        return { success: true };
    } catch (error) {
        console.error("Failed to reject teacher:", error);
        return { error: "Failed to reject teacher" };
    }
}
