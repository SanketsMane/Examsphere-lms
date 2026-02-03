"use server";

import { prisma } from "@/lib/db";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

/**
 * Teacher Session Management Actions
 * Author: Sanket
 */

export async function updateSessionStatus(sessionId: string, status: "completed" | "no_show") {
    try {
        const authSession = await getSessionWithRole();
        if (!authSession || authSession.user.role !== "teacher") {
            return { success: false, error: "Unauthorized" };
        }

        const session = await prisma.liveSession.findUnique({
            where: { id: sessionId },
            include: { teacher: true }
        });

        if (!session) return { success: false, error: "Session not found" };
        if (session.teacher.userId !== authSession.user.id) {
            return { success: false, error: "Forbidden" };
        }

        await prisma.liveSession.update({
            where: { id: sessionId },
            data: { 
                status,
                // If completed, set end time if not set
                ...(status === "completed" && !session.actualEndTime && { actualEndTime: new Date() })
            }
        });

        revalidatePath("/teacher/sessions");
        revalidatePath(`/teacher/sessions/${sessionId}`);
        return { success: true };
    } catch (error) {
        logger.error("Update Session Status Error", { error, sessionId });
        return { success: false, error: "Failed to update status" };
    }
}
