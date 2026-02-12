"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendTemplatedEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/action-security";
import { logger } from "@/lib/logger";

// --- User Management ---

export async function suspendUser(userId: string, reason?: string) {
    try {
        await requireAdmin();
        await prisma.user.update({
            where: { id: userId },
            data: {
                banned: true,
                banReason: reason || "Suspended by admin",
            },
        });
        revalidatePath("/admin/users");
        return { success: true, message: "User suspended successfully" };
    } catch (error) {
        logger.error("Failed to suspend user", error as Error, userId);
        return { success: false, message: "Failed to suspend user" };
    }
}

export async function unsuspendUser(userId: string) {
    try {
        await requireAdmin();
        await prisma.user.update({
            where: { id: userId },
            data: {
                banned: false,
                banReason: null,
            },
        });
        revalidatePath("/admin/users");
        return { success: true, message: "User unsuspended successfully" };
    } catch (error) {
        logger.error("Failed to unsuspend user", error as Error, userId);
        return { success: false, message: "Failed to unsuspend user" };
    }
}

export async function updateUserRole(userId: string, role: string) {
    try {
        await requireAdmin();
        await prisma.user.update({
            where: { id: userId },
            data: { role },
        });
        revalidatePath("/admin/users");
        return { success: true, message: "User role updated successfully" };
    } catch (error) {
        logger.error("Failed to update role", error as Error, userId);
        return { success: false, message: "Failed to update role" };
    }
}

export async function updateUserAndTeacherProfile(userId: string, data: {
    name?: string;
    email?: string;
    role?: string;
    bio?: string;
    teacherProfile?: {
        bio?: string;
        expertise?: string[];
        languages?: string[];
        hourlyRate?: number | null;
        experience?: number | null;
        isVerified?: boolean;
        isApproved?: boolean;
    }
}) {
    try {
        await requireAdmin();
        
        // Update User
        await prisma.user.update({
            where: { id: userId },
            data: {
                name: data.name,
                email: data.email,
                role: data.role,
                bio: data.bio,
            },
        });

        // Update TeacherProfile if data provided
        if (data.teacherProfile) {
            await prisma.teacherProfile.upsert({
                where: { userId },
                create: {
                    userId,
                    ...data.teacherProfile,
                },
                update: {
                    ...data.teacherProfile,
                },
            });
        }

        revalidatePath("/admin/users");
        revalidatePath("/admin/teachers");
        revalidatePath(`/admin/teachers/${userId}`);

        return { success: true, message: "Profile updated successfully" };
    } catch (error) {
        logger.error("Failed to update profile", error as Error, userId);
        return { success: false, message: "Failed to update profile" };
    }
}

export async function deleteUser(userId: string) {
    try {
        await requireAdmin();
        // Delete related data first to avoid constraint errors if cascade isn't perfect
        // Though schema has onDelete: Cascade, explicit cleanup is safer for major entities
        await prisma.user.delete({
            where: { id: userId },
        });
        revalidatePath("/admin/users");
        return { success: true, message: "User deleted successfully" };
    } catch (error) {
        logger.error("Failed to delete user", error as Error, userId);
        return { success: false, message: "Failed to delete user" };
    }
}

export async function deleteCourse(courseId: string) {
    try {
        await requireAdmin();
        // Check if course has enrollments? Maybe prevent delete?
        // For now, allow delete (schema handles cascade)
        await prisma.course.delete({
            where: { id: courseId }
        });
        revalidatePath("/admin/courses");
        return { success: true, message: "Course deleted successfully" };
    } catch (error) {
        logger.error("Failed to delete course", error as Error, courseId);
        return { success: false, message: "Failed to delete course" };
    }
}

// --- Teacher Management ---

export async function approveTeacher(teacherId: string) {
    try {
        await requireAdmin();
        const user = await prisma.user.findUnique({
             where: { id: teacherId }
        });

        if (!user) {
            throw new Error("User not found");
        }

        // Update Teacher Profile (Upsert to handle missing profiles for imported users)
        await prisma.teacherProfile.upsert({
            where: { userId: teacherId },
            create: {
                userId: teacherId,
                isApproved: true,
                isVerified: true,
            },
            update: {
                isApproved: true,
                isVerified: true
            }
        });

        // Send Email
        await sendTemplatedEmail(
            "teacherVerificationApproved", // Updated slug
            user.email,
            "Congratulations! Your Teacher Profile is Approved",
            {
                userName: user.name || "Teacher",
                dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/teacher/dashboard`
            }
        );

        revalidatePath("/admin/teachers");
        return { success: true, message: "Teacher approved & email sent" };
    } catch (error: any) {
        logger.error("Failed to approve teacher", error as Error, teacherId);
        return { success: false, message: error.message || "Failed to approve teacher" };
    }
}

export async function rejectTeacher(teacherUserId: string, reason: string) {
    try {
        await requireAdmin();
        const user = await prisma.user.findUnique({
             where: { id: teacherUserId }
        });

        if (!user) {
             throw new Error("User not found");
        }

        // Use upsert for TeacherProfile
        const profile = await prisma.teacherProfile.upsert({
            where: { userId: teacherUserId },
            create: {
                userId: teacherUserId,
                isApproved: false,
            },
            update: {
                isApproved: false
            }
        });

        // Also update or create TeacherVerification
        await prisma.teacherVerification.upsert({
            where: { teacherId: profile.id },
            create: {
                teacherId: profile.id,
                status: 'Rejected',
                rejectionReason: reason,
                rejectedAt: new Date(),
            },
            update: {
                status: 'Rejected',
                rejectionReason: reason,
                rejectedAt: new Date(),
            }
        });

        // Send Email
        await sendTemplatedEmail(
            "teacherVerificationRejected", // Updated slug
            user.email,
            "Update regarding your Teacher Application",
            {
                userName: user.name || "Applicant",
                reason: reason
            }
        );

        revalidatePath("/admin/teachers");
        return { success: true, message: "Teacher application rejected & email sent" };
    } catch (error: any) {
        logger.error("Failed to reject teacher", { error, reason }, teacherUserId);
        return { success: false, message: error.message || "Failed to reject teacher" };
    }
}
