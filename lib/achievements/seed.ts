import { prisma } from "@/lib/db";

/**
 * Seed initial achievements
 * Author: Sanket
 */

export async function seedAchievements() {
    const achievements = [
        {
            title: "First Step",
            description: "Complete your first live session",
            type: "session_count",
            threshold: 1,
            badgeUrl: "/badges/first-session.png"
        },
        {
            title: "Consistent Learner",
            description: "Complete 5 live sessions",
            type: "session_count",
            threshold: 5,
            badgeUrl: "/badges/5-sessions.png"
        },
        {
            title: "Dedicated Student",
            description: "Complete 10 live sessions",
            type: "session_count",
            threshold: 10,
            badgeUrl: "/badges/10-sessions.png"
        },
        {
            title: "Time Well Spent",
            description: "Accumulate 5 hours of learning",
            type: "hours_spent",
            threshold: 5,
            badgeUrl: "/badges/5-hours.png"
        }
    ];

    for (const ach of achievements) {
        await prisma.achievement.upsert({
            where: { title: ach.title },
            update: ach,
            create: ach
        });
    }
}
