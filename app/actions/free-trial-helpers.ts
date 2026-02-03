"use server";

import { prisma } from "@/lib/db";

/**
 * Free Trial Helper Functions
 * Author: Sanket
 * 
 * Provides utilities to check and record free trial usage per teacher.
 * Email-based tracking prevents multi-account abuse.
 */

export async function checkFreeTrialEligibility(params: {
    studentId: string;
    studentEmail: string;
    teacherId: string;
}): Promise<boolean> {
    /**
     * Check if student has already used their free trial with this teacher
     * Returns true if eligible (hasn't used trial yet)
     */
    const existingUsage = await prisma.freeTrialUsage.findUnique({
        where: {
            studentEmail_teacherId: {
                studentEmail: params.studentEmail,
                teacherId: params.teacherId
            }
        }
    });

    return !existingUsage; // Eligible if no existing usage
}

export async function recordFreeTrialUsage(params: {
    studentId: string;
    studentEmail: string;
    teacherId: string;
    sessionType: "live_session" | "group_class";
    sessionId: string;
}): Promise<void> {
    /**
     * Record that student has used their free trial with this teacher
     * Uses email-based tracking to prevent abuse
     */
    await prisma.freeTrialUsage.create({
        data: {
            studentId: params.studentId,
            studentEmail: params.studentEmail,
            teacherId: params.teacherId,
            sessionType: params.sessionType,
            sessionId: params.sessionId
        }
    });
}

export async function getFreeTrialUsageForTeacher(teacherId: string) {
    /**
     * Get all students who have used free trials with this teacher
     * Used for teacher analytics dashboard
     */
    return await prisma.freeTrialUsage.findMany({
        where: { teacherId },
        include: {
            student: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true
                }
            }
        },
        orderBy: { usedAt: 'desc' }
    });
}
