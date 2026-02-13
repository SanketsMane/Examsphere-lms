"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

import { z } from "zod";

/**
 * Session Feedback & Rating Actions
 * Author: Sanket
 */

const feedbackSchema = z.object({
    sessionId: z.string().uuid(),
    rating: z.number().min(1).max(5),
    comment: z.string().max(1000).optional(),
});

interface SubmitFeedbackInput {
    sessionId: string;
    rating: number;
    comment?: string;
}

export async function submitSessionFeedback(data: SubmitFeedbackInput) {
    try {
        // Formal Validation (Author: Sanket)
        const validated = feedbackSchema.safeParse(data);
        if (!validated.success) {
            return { success: false, error: "Invalid feedback data" };
        }

        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const userId = (session.user as any).id;

        // Verify the session exists and the user is the student
        const liveSession = await prisma.liveSession.findUnique({
            where: { id: data.sessionId },
            include: { teacher: true }
        });

        if (!liveSession) return { success: false, error: "Session not found" };
        if (liveSession.studentId !== userId) return { success: false, error: "Not authorized to rate this session" };

        // Post-session cleanup: only allow rating after scheduled time or if completed
        const now = new Date();
        if (liveSession.scheduledAt > now && liveSession.status !== "completed") {
            return { success: false, error: "Can only rate sessions that have finished" };
        }

        // Create or update the rating
        const rating = await prisma.sessionRating.upsert({
            where: {
                id: (await prisma.sessionRating.findFirst({
                    where: { sessionId: data.sessionId, studentId: userId, type: "student_to_teacher" }
                }))?.id || 'new-rating'
            },
            update: {
                rating: data.rating,
                comment: data.comment,
            },
            create: {
                sessionId: data.sessionId,
                studentId: userId,
                teacherId: liveSession.teacherId,
                rating: data.rating,
                comment: data.comment,
                type: "student_to_teacher"
            }
        });

        // Update the LiveSession denormalized field
        await prisma.liveSession.update({
            where: { id: data.sessionId },
            data: { studentRating: data.rating }
        });

        // Update teacher's aggregate rating
        await updateTeacherRating(liveSession.teacherId);

        revalidatePath(`/student/sessions`);
        revalidatePath(`/teacher/sessions`);
        revalidatePath(`/find-teacher/${liveSession.teacherId}`);

        return { success: true, rating };
    } catch (error: any) {
        console.error("Feedback submission error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Aggregates all ratings for a teacher and updates their profile
 */
async function updateTeacherRating(teacherId: string) {
    const aggregations = await prisma.sessionRating.aggregate({
        where: { teacherId, type: "student_to_teacher" },
        _avg: { rating: true },
        _count: { rating: true }
    });

    await prisma.teacherProfile.update({
        where: { id: teacherId },
        data: {
            rating: aggregations._avg.rating || 0,
            totalReviews: aggregations._count.rating || 0
        }
    });
}
