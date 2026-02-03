"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Learning Goal Actions
 * Author: Sanket
 */

export async function createLearningGoal(data: { title: string; description?: string; targetDate?: Date }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const userId = (session.user as any).id;

        const goal = await prisma.learningGoal.create({
            data: {
                studentId: userId,
                title: data.title,
                description: data.description,
                targetDate: data.targetDate,
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
