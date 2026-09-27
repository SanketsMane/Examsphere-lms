"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { decideTeacher } from "@/app/admin/_lib/teacher-approval";
import { checkAccountChange, normaliseRole } from "@/app/admin/_lib/role-safety";
import { requireAdmin } from "@/lib/action-security";
import { logger } from "@/lib/logger";

// --- User Management ---

export async function suspendUser(userId: string, reason?: string) {
    try {
        const session = await requireAdmin();
        const blocked = await checkAccountChange(session.user.id, userId, "suspend");
        if (blocked) return { success: false, message: blocked };

        // Deleting sessions logs the user out everywhere; a ban flag alone left
        // existing sessions working until they expired.
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: {
                    banned: true,
                    banReason: reason?.trim() || "Suspended by admin",
                },
            }),
            prisma.session.deleteMany({ where: { userId } }),
        ]);
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

export async function updateUserRole(userId: string, rawRole: string) {
    try {
        const session = await requireAdmin();
        const role = normaliseRole(rawRole);
        if (!role) return { success: false, message: "Role must be student, teacher or admin" };

        const blocked = await checkAccountChange(session.user.id, userId, { role });
        if (blocked) return { success: false, message: blocked };

        await prisma.user.update({
            where: { id: userId },
            data: { role },
        });

        // Initialize TeacherProfile if promoted to teacher and profile doesn't exist
        if (role === 'teacher') {
            await prisma.teacherProfile.upsert({
                where: { userId },
                create: {
                    userId,
                    isApproved: false,
                    isVerified: false,
                    expertise: [],
                    languages: [],
                    qualifications: [],
                    certifications: []
                },
                update: {} // Don't overwrite existing profile data on role toggle
            });
        }

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
        qualifications?: string[];
        certifications?: string[];
        hourlyRate?: number | null;
        experience?: number | null;
        isVerified?: boolean;
        isApproved?: boolean;
    }
}) {
    try {
        const session = await requireAdmin();

        let role: string | undefined;
        if (data.role !== undefined) {
            const normalised = normaliseRole(data.role);
            if (!normalised) return { success: false, message: "Role must be student, teacher or admin" };
            const blocked = await checkAccountChange(session.user.id, userId, { role: normalised });
            if (blocked) return { success: false, message: blocked };
            role = normalised;
        }

        // Update User
        await prisma.user.update({
            where: { id: userId },
            data: {
                name: data.name,
                email: data.email,
                role,
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
                    expertise: data.teacherProfile.expertise || [],
                    languages: data.teacherProfile.languages || [],
                    qualifications: data.teacherProfile.qualifications || [],
                    certifications: data.teacherProfile.certifications || [],
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
        const session = await requireAdmin();
        const blocked = await checkAccountChange(session.user.id, userId, "delete");
        if (blocked) return { success: false, message: blocked };

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

export async function approveTeacher(teacherUserId: string) {
    let adminId: string;
    try {
        adminId = (await requireAdmin()).user.id;
    } catch {
        return { success: false, message: "Unauthorized" };
    }
    return decideTeacher({ userId: teacherUserId }, { decision: "approve" }, adminId);
}

export async function rejectTeacher(teacherUserId: string, reason: string) {
    let adminId: string;
    try {
        adminId = (await requireAdmin()).user.id;
    } catch {
        return { success: false, message: "Unauthorized" };
    }
    return decideTeacher({ userId: teacherUserId }, { decision: "reject", reason }, adminId);
}
