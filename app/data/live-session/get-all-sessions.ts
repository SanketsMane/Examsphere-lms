import { prisma } from "@/lib/db";


export async function getAllSessions() {
    const sessions = await prisma.groupClass.findMany({
        where: {
            status: "Scheduled",
        },
        include: {
            teacher: {
                include: {
                    user: true,
                },
            },
            _count: {
                select: {
                    enrollments: true
                }
            }
        },
        orderBy: {
            scheduledAt: 'asc',
        },
    });

    return sessions;
}
