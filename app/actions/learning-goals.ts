"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod"; // author: Sanket

const goalSchema = z.object({
    title: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
    targetDate: z.date().optional(),
});

const milestoneSchema = z.string().min(3).max(100);

/**
 * Learning Goal Actions
 * Author: Sanket
 */

export async function createLearningGoal(data: { title: string; description?: string; targetDate?: Date }) {
    try {
        const validated = goalSchema.safeParse(data);
        if (!validated.success) {
            return { success: false, error: "Invalid title or description" };
        }

        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const userId = (session.user as any).id;

        // QA-082: Goal Cap (Author: Sanket)
        const goalCount = await prisma.learningGoal.count({
            where: { studentId: userId }
        });

        if (goalCount >= 20) {
            return { success: false, error: "You have reached the maximum limit of 20 learning goals. Please complete or remove existing ones." };
        }

        const goal = await prisma.learningGoal.create({
            data: {
                studentId: userId,
                ...validated.data
            }
        });

        revalidatePath("/dashboard/progress");
        return { success: true, goal };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function addMilestone(goalId: string, title: string) {
    try {
        if (!milestoneSchema.safeParse(title).success) {
            return { success: false, error: "Invalid milestone title" };
        }

        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const userId = (session.user as any).id;

        // Verify ownership
        const goal = await prisma.learningGoal.findUnique({ where: { id: goalId } });
        if (!goal || goal.studentId !== userId) return { success: false, error: "Not authorized" };

        const milestone = await prisma.milestone.create({
            data: {
                goalId,
                title
            }
        });

        revalidatePath("/dashboard/progress");
        return { success: true, milestone };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function toggleMilestone(milestoneId: string, isCompleted: boolean) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const userId = (session.user as any).id;

        // Verify Milestone Ownership via LearningGoal (Author: Sanket)
        const milestoneData = await prisma.milestone.findUnique({
            where: { id: milestoneId },
            include: { goal: { select: { studentId: true } } }
        });

        if (!milestoneData || milestoneData.goal.studentId !== userId) {
            return { success: false, error: "Unauthorized: Access denied to this milestone" };
        }

        const milestone = await prisma.milestone.update({
            where: { id: milestoneId },
            data: { 
                isCompleted,
                completedAt: isCompleted ? new Date() : null
            }
        });

        revalidatePath("/dashboard/progress");
        return { success: true, milestone };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
