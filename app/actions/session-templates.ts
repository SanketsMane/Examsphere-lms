"use server";

import { prisma } from "@/lib/db";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { requireTeacher } from "@/lib/action-security";

/**
 * Session Template Server Actions
 * Author: Sanket
 */

export async function getSessionTemplates() {
    try {
        const session = await getSessionWithRole();
        if (!session || session.user.role !== "teacher") {
            return { success: false, error: "Unauthorized" };
        }

        const teacherProfile = await prisma.teacherProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!teacherProfile) return { success: false, error: "Teacher profile not found" };

        const templates = await prisma.sessionTemplate.findMany({
            where: { teacherId: teacherProfile.id },
            orderBy: { createdAt: "desc" }
        });

        return { success: true, templates };
    } catch (error) {
        logger.error("Get Templates Error", { error });
        return { success: false, error: "Failed to fetch templates" };
    }
}

export async function createSessionTemplate(data: {
    title: string;
    description?: string;
    subject: string;
    duration: number;
    price: number;
    recurrenceType: string;
    dayOfWeek?: number;
    startTime: string;
}) {
    try {
        const session = await getSessionWithRole();
        if (!session || session.user.role !== "teacher") {
            return { success: false, error: "Unauthorized" };
        }

        const teacherProfile = await prisma.teacherProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!teacherProfile) return { success: false, error: "Teacher profile not found" };

        const template = await prisma.sessionTemplate.create({
            data: {
                teacherId: teacherProfile.id,
                ...data
            }
        });

        revalidatePath("/teacher/sessions");
        return { success: true, template };
    } catch (error) {
        logger.error("Create Template Error", { error });
        return { success: false, error: "Failed to create template" };
    }
}

export async function deleteSessionTemplate(id: string) {
    try {
        await requireTeacher(); // Enhanced role check - Author: Sanket
        const session = await getSessionWithRole();
        if (!session || session.user.role !== "teacher") {
            return { success: false, error: "Unauthorized" };
        }

        const teacherProfile = await prisma.teacherProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!teacherProfile) return { success: false, error: "Teacher profile not found" };

        // Verify ownership (Author: Sanket)
        const template = await prisma.sessionTemplate.findUnique({
            where: { id }
        });

        if (!template || template.teacherId !== teacherProfile.id) {
            return { success: false, error: "Unauthorized: Template not found or access denied" };
        }

        await prisma.sessionTemplate.delete({
            where: { id }
        });

        revalidatePath("/teacher/sessions");
        return { success: true };
    } catch (error) {
        logger.error("Delete Template Error", { error });
        return { success: false, error: "Failed to delete template" };
    }
}

/**
 * Applies a template to a set of dates
 */
export async function applyTemplateBatch(templateId: string, dates: Date[]) {
    try {
        await requireTeacher(); // Enhanced role check - Author: Sanket
        const session = await getSessionWithRole();
        if (!session || session.user.role !== "teacher") {
            return { success: false, error: "Unauthorized" };
        }

        const teacherProfile = await prisma.teacherProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!teacherProfile) return { success: false, error: "Teacher profile not found" };

        const template = await prisma.sessionTemplate.findUnique({
            where: { id: templateId }
        });

        // Verify ownership (Author: Sanket)
        if (!template || template.teacherId !== teacherProfile.id) {
            return { success: false, error: "Unauthorized: Template not found or access denied" };
        }

        // Generate sessions for each date
        const createdSessions = await prisma.$transaction(
            dates.map(date => {
                const [hours, minutes] = template.startTime.split(":").map(Number);
                const scheduledAt = new Date(date);
                scheduledAt.setHours(hours, minutes, 0, 0);

                return prisma.liveSession.create({
                    data: {
                        teacherId: template.teacherId,
                        title: template.title,
                        description: template.description,
                        subject: template.subject,
                        scheduledAt,
                        duration: template.duration,
                        price: template.price,
                        status: "scheduled"
                    }
                });
            })
        );

        revalidatePath("/teacher/sessions");
        return { success: true, count: createdSessions.length };
    } catch (error) {
        logger.error("Apply Template Error", { error });
        return { success: false, error: "Failed to apply template" };
    }
}
