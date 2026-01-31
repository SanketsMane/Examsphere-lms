"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendTemplatedEmail } from "@/lib/email";

// --- User Management ---

export async function suspendUser(userId: string, reason?: string) {
    try {
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
        console.error("Failed to suspend user:", error);
        return { success: false, message: "Failed to suspend user" };
    }
}

export async function unsuspendUser(userId: string) {
    try {
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
        console.error("Failed to unsuspend user:", error);
        return { success: false, message: "Failed to unsuspend user" };
    }
}

export async function updateUserRole(userId: string, role: string) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { role },
        });
        revalidatePath("/admin/users");
        return { success: true, message: "User role updated successfully" };
    } catch (error) {
        console.error("Failed to update role:", error);
        return { success: false, message: "Failed to update role" };
    }
}

export async function deleteUser(userId: string) {
    try {
        // Delete related data first to avoid constraint errors if cascade isn't perfect
        // Though schema has onDelete: Cascade, explicit cleanup is safer for major entities
        await prisma.user.delete({
            where: { id: userId },
        });
        revalidatePath("/admin/users");
        return { success: true, message: "User deleted successfully" };
    } catch (error) {
        console.error("Failed to delete user:", error);
        return { success: false, message: "Failed to delete user" };
    }
}

export async function deleteCourse(courseId: string) {
    try {
        // Check if course has enrollments? Maybe prevent delete?
        // For now, allow delete (schema handles cascade)
        await prisma.course.delete({
            where: { id: courseId }
        });
        revalidatePath("/admin/courses");
        return { success: true, message: "Course deleted successfully" };
    } catch (error) {
        console.error("Failed to delete course:", error);
        return { success: false, message: "Failed to delete course" };
    }
}

// --- Teacher Management ---

export async function approveTeacher(teacherId: string) {
    try {
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
            "teacherApproved",
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
        console.error("Failed to approve teacher:", error);
        return { success: false, message: error.message || "Failed to approve teacher" };
    }
}

export async function rejectTeacher(teacherUserId: string, reason: string) {
    try {
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
            "teacherRejected",
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
        console.error("Failed to reject teacher:", error);
        return { success: false, message: error.message || "Failed to reject teacher" };
    }
}
