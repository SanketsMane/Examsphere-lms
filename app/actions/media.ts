"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { requireTeacher } from "@/lib/action-security";

export async function getTeacherMedia() {
    try {
        await requireTeacher(); // Standard guard - Author: Sanket
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) return [];

        // Find all courses by this teacher
        const courses = await prisma.course.findMany({
            where: { userId: session.user.id },
            select: { id: true }
        });

        const courseIds = courses.map(c => c.id);

        // Find all lessons in these courses that have a videoKey
        const lessons = await prisma.lesson.findMany({
            where: {
                Chapter: {
                    courseId: { in: courseIds }
                },
                videoKey: { not: null }
            },
            select: {
                id: true,
                title: true,
                videoKey: true,
                createdAt: true,
                Chapter: {
                    select: {
                        Course: {
                            select: { title: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Deduplicate by videoKey if needed, but showing context is nice.
        // Let's filter out null videoKeys (already done in query)

        return lessons.map(l => ({
            id: l.id,
            title: l.title,
            videoKey: l.videoKey!,
            createdAt: l.createdAt,
            courseName: l.Chapter.Course.title
        }));

    } catch (error) {
        console.error("Failed to fetch media:", error);
        return [];
    }
}
