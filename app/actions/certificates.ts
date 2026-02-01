"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function generateCertificate(courseId: string) {
    const session = await requireUser();

    try {
        // 1. Verify 100% Completion
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                user: {
                    select: {
                        name: true,
                    },
                },
                chapter: {
                    include: {
                        lessons: true,
                    },
                },
            },
        });

        if (!course) throw new Error("Course not found");

        const totalLessons = course.chapter.reduce(
            (acc, chap) => acc + chap.lessons.length,
            0
        );

        const completedProgress = await prisma.lessonProgress.count({
            where: {
                userId: session.id,
                completed: true,
                Lesson: {
                    chapterId: {
                        in: course.chapter.map(c => c.id)
                    }
                }
            },
        });

        if (completedProgress < totalLessons || totalLessons === 0) {
            return {
                status: "error",
                message: "You must complete all lessons to get a certificate.",
            };
        }

        // 2. Check if already exists
        const existingCert = await prisma.certificate.findFirst({
            where: {
                userId: session.id,
                courseId: courseId,
            },
        });

        if (existingCert) {
            return {
                status: "success",
                message: "Certificate already exists",
                id: existingCert.id,
            };
        }

        // 3. Create Certificate
        // Simple ID generation for demo
        const certNumber = `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const cert = await prisma.certificate.create({
            data: {
                userId: session.id,
                courseId: courseId,
                certificateNumber: certNumber,
                studentName: session.name || "Student",
                courseName: course.title,
                teacherName: course.user?.name || "Kidokool Instructor",
                completionDate: new Date(),
            },
        });

        revalidatePath("/dashboard/courses");
        return {
            status: "success",
            message: "Certificate generated successfully!",
            id: cert.id,
        };
    } catch (error) {
        console.error("Certificate Error:", error);
        return {
            status: "error",
            message: "Failed to generate certificate",
        };
    }
}
