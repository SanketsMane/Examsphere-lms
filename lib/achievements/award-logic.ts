import { prisma } from "@/lib/db";

/**
 * Achievement Awarding Utility
 * Author: Sanket
 */

export async function checkAndAwardAchievements(userId: string) {
    try {
        // Fetch student progress
        const progress = await prisma.studentProgress.findUnique({
            where: { studentId: userId }
        });

        if (!progress) return;

        // Fetch all achievements
        const achievements = await prisma.achievement.findMany();
        
        // Fetch user's current achievements
        const userAchievements = await prisma.userAchievement.findMany({
            where: { userId },
            select: { achievementId: true }
        });
        
        const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));

        for (const achievement of achievements) {
            if (unlockedIds.has(achievement.id)) continue;

            let shouldUnlock = false;

            switch (achievement.type) {
                case "session_count":
                    if (progress.attendedSessions >= achievement.threshold) shouldUnlock = true;
                    break;
                case "hours_spent":
                    if (progress.totalHours >= achievement.threshold) shouldUnlock = true;
                    break;
                // Add more types as needed
            }

            if (shouldUnlock) {
                await prisma.userAchievement.create({
                    data: {
                        userId,
                        achievementId: achievement.id
                    }
                });
                console.log(`Achievement unlocked: ${achievement.title} for user ${userId}`);
                // In a real app, you could trigger a notification or confetti here
            }
        }
    } catch (error) {
        console.error("Error awarding achievements:", error);
    }
}
