"use server";

import { prisma } from "@/lib/db";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { z } from "zod";

/**
 * Bulk Session Scheduling Server Actions
 * Author: Sanket
 */

const bulkSessionSchema = z.array(z.object({
    title: z.string().min(5),
    description: z.string().optional(),
    subject: z.string().min(2),
    scheduledAt: z.string(), // ISO string
    duration: z.number().min(15).max(180),
    price: z.number().min(100), // In INR
    isFreeTrialEligible: z.boolean().default(false),
}));

export async function validateSessionsBatch(sessions: any[]) {
    try {
        const authSession = await getSessionWithRole();
        if (!authSession || authSession.user.role !== "teacher") {
            return { success: false, error: "Unauthorized" };
        }

        const teacherProfile = await prisma.teacherProfile.findUnique({
            where: { userId: authSession.user.id }
        });

        if (!teacherProfile) return { success: false, error: "Teacher profile not found" };

        const validationResults = [];
        
        for (const sessionData of sessions) {
            const errors: string[] = [];
            const scheduledDate = new Date(sessionData.scheduledAt);
            
            // 1. Basic Schema Validation
            if (!sessionData.title || sessionData.title.length < 5) errors.push("Title too short");
            if (scheduledDate < new Date()) errors.push("Date is in the past");
            
            // 2. Conflict Detection
            const conflict = await prisma.liveSession.findFirst({
                where: {
                    teacherId: teacherProfile.id,
                    status: { in: ['scheduled', 'in_progress'] },
                    OR: [
                        {
                            AND: [
                                { scheduledAt: { lte: scheduledDate } },
                                { scheduledAt: { gte: new Date(scheduledDate.getTime() - (sessionData.duration || 60) * 60000) } }
                            ]
                        },
                        {
                            scheduledAt: {
                                gte: scheduledDate,
                                lt: new Date(scheduledDate.getTime() + (sessionData.duration || 60) * 60000)
                            }
                        }
                    ]
                }
            });

            if (conflict) errors.push("Scheduling conflict at this time");

            validationResults.push({
                ...sessionData,
                isValid: errors.length === 0,
                errors
            });
        }

        return { success: true, results: validationResults };
    } catch (error) {
        logger.error("Batch Validation Error", { error });
        return { success: false, error: "Failed to validate sessions" };
    }
}

export async function createSessionsBatch(sessions: any[]) {
    try {
        const authSession = await getSessionWithRole();
        if (!authSession || authSession.user.role !== "teacher") {
            return { success: false, error: "Unauthorized" };
        }

        const teacherProfile = await prisma.teacherProfile.findUnique({
            where: { userId: authSession.user.id }
        });

        if (!teacherProfile) return { success: false, error: "Teacher profile not found" };

        // Process sessions in a transaction
        const createdSessions = await prisma.$transaction(
            sessions.map(s => prisma.liveSession.create({
                data: {
                    teacherId: teacherProfile.id,
                    title: s.title,
                    description: s.description,
                    subject: s.subject,
                    scheduledAt: new Date(s.scheduledAt),
                    duration: s.duration,
                    price: s.price,
                    isFreeTrialEligible: s.isFreeTrialEligible || false,
                    status: 'scheduled',
                    timezone: 'UTC' // Default
                }
            }))
        );

        revalidatePath("/teacher/sessions");
        return { success: true, count: createdSessions.length };
    } catch (error) {
        logger.error("Batch Creation Error", { error });
        return { success: false, error: "Failed to create sessions" };
    }
}
