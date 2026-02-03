import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Student Progress API
 * Author: Sanket
 */

export async function GET() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = (session.user as any).id;

        // Fetch basic progress
        let progress = await prisma.studentProgress.findUnique({
            where: { studentId: userId }
        });

        // If no progress entry, create one (or calculate on the fly for first time)
        if (!progress) {
            progress = await prisma.studentProgress.create({
                data: { studentId: userId }
            });
        }

        // Fetch learning goals
        const goals = await prisma.learningGoal.findMany({
            where: { studentId: userId },
            include: { milestones: true },
            orderBy: { createdAt: 'desc' }
        });

        // Fetch recent session history for chart (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentSessions = await prisma.liveSession.findMany({
            where: {
                studentId: userId,
                scheduledAt: { gte: thirtyDaysAgo },
                status: 'completed'
            },
            select: {
                scheduledAt: true,
                duration: true
            },
            orderBy: { scheduledAt: 'asc' }
        });

        // Fetch achievements
        const userAchievements = await prisma.userAchievement.findMany({
            where: { userId },
            include: { achievement: true },
            orderBy: { unlockedAt: 'desc' }
        });

        return NextResponse.json({
            progress,
            goals,
            recentSessions,
            userAchievements,
            userName: session.user.name
        });
    } catch (error: any) {
        console.error("Progress fetch error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
