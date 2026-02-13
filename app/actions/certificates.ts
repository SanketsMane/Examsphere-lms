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

        // CRITICAL SECURITY FIX: Verify Enrollment (Author: Sanket)
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: session.id,
                    courseId: courseId
                }
            }
        });
        if (!enrollment) throw new Error("Unauthorized: Enrollment not found");

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

        // 2. Check if already exists & Create (Atomic)
        const cert = await prisma.$transaction(async (tx) => {
            const existingCert = await tx.certificate.findFirst({
                where: {
                    userId: session.id,
                    courseId: courseId,
                },
            });

            if (existingCert) {
                return existingCert;
            }

            // 3. Create Certificate
            const certNumber = `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            return await tx.certificate.create({
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
        });

        if (cert.createdAt && new Date().getTime() - new Date(cert.createdAt).getTime() < 1000) {
             // New certificate created
             revalidatePath("/dashboard/courses");
             return {
                status: "success",
                message: "Certificate generated successfully!",
                id: cert.id,
            };
        }

        return {
            status: "success",
            message: "Certificate already exists",
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
