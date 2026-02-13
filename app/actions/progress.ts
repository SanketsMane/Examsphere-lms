"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function updateLessonProgress(lessonId: string, completed: boolean) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) {
            return { error: "Unauthorized" };
        }

        // IDOR Protection: Verify user is enrolled in the course containing this lesson
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                Chapter: {
                    select: { courseId: true }
                }
            }
        });

        if (!lesson?.Chapter?.courseId) {
            return { error: "Lesson not found" };
        }

        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: (session.user as any).id,
                    courseId: lesson.Chapter.courseId
                }
            }
        });

        if (!enrollment) {
            return { error: "You must be enrolled in the course to update progress" };
        }

        const progress = await prisma.lessonProgress.upsert({
            where: {
                userId_lessonId: {
                    userId: session.user.id,
                    lessonId: lessonId
                }
            },
            create: {
                userId: session.user.id,
                lessonId: lessonId,
                completed: completed
            },
            update: {
                completed: completed
            }
        });

        revalidatePath("/courses");

        // Check for Course Completion
        if (completed) {
            const lesson = await prisma.lesson.findUnique({
                where: { id: lessonId },
                select: {
                    Chapter: {
                        select: {
                            courseId: true
                        }
                    }
                }
            });

            if (lesson?.Chapter?.courseId) {
                const courseId = lesson.Chapter.courseId;

                // Tolal Lessons in Course
                const totalLessons = await prisma.lesson.count({
                    where: {
                        Chapter: {
                            courseId: courseId
                        }
                    }
                });

                // Completed Lessons in Course
                const completedLessons = await prisma.lessonProgress.count({
                    where: {
                        userId: session.user.id,
                        completed: true,
                        Lesson: {
                            Chapter: {
                                courseId: courseId
                            }
                        }
                    }
                });

                if (completedLessons === totalLessons) {
                    // QA-092: Atomic Certificate Generation (Author: Sanket)
                    await prisma.$transaction(async (tx) => {
                        // Double-check existence inside transaction (locked row if possible, or just atomic sequence)
                        const existingCert = await tx.certificate.findFirst({
                            where: {
                                userId: session.user.id,
                                courseId: courseId
                            }
                        });

                        if (!existingCert) {
                            // Fetch details for certificate
                            const course = await tx.course.findUnique({
                                where: { id: courseId },
                                select: {
                                    title: true,
                                    user: {
                                        select: { name: true }
                                    }
                                }
                            });

                            if (course && course.user?.name && session.user.name) {
                                await tx.certificate.create({
                                    data: {
                                        userId: session.user.id,
                                        courseId: courseId,
                                        certificateNumber: `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                                        studentName: session.user.name,
                                        courseName: course.title,
                                        teacherName: course.user.name,
                                        completionDate: new Date()
                                    }
                                });
                            }
                        }
                    });
                }
            }
        }

        return { success: true, progress };
    } catch (error: any) {
        console.error("Error updating progress:", error);
        return { error: error.message || "Failed to update progress" };
    }
}

