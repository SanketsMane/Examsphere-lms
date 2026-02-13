"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod"; // author: Sanket

const reviewSchema = z.object({
    courseId: z.string().uuid(),
    rating: z.number().min(1).max(5),
    comment: z.string().min(3).max(1000),
});

export async function createReview(data: {
    courseId: string;
    rating: number;
    comment: string;
}) {
    const session = await requireUser();

    // Validation - author: Sanket
    const validated = reviewSchema.safeParse(data);
    if (!validated.success) {
        return { status: "error", message: "Invalid rating or comment length" };
    }

    try {
        // Check if user is enrolled
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: session.id,
                    courseId: data.courseId,
                },
            },
        });

        if (!enrollment) {
            return {
                status: "error",
                message: "You must be enrolled to review this course.",
            };
        }

        // Check if already reviewed
        const existingReview = await prisma.review.findFirst({
            where: {
                reviewerId: session.id,
                courseId: data.courseId,
            },
        });

        if (existingReview) {
            // Update existing
            await prisma.review.update({
                where: { id: existingReview.id },
                data: {
                    rating: data.rating,
                    comment: data.comment,
                },
            });
            await updateCourseRating(data.courseId); // sync - author: Sanket
            revalidatePath(`/courses/${data.courseId}`);
            return {
                status: "success",
                message: "Review updated successfully",
            };
        }

        // Create new
        await prisma.review.create({
            data: {
                reviewerId: session.id,
                courseId: data.courseId,
                rating: data.rating,
                comment: data.comment,
                isVerified: true, // Since we checked enrollment
            },
        });

        await updateCourseRating(data.courseId); // sync - author: Sanket
        revalidatePath(`/courses/${data.courseId}`);
        return {
            status: "success",
            message: "Review submitted successfully",
        };
    } catch (error) {
        console.error("Review Error:", error);
        return {
            status: "error",
            message: "Failed to submit review",
        };
    }
}

/**
 * Aggregates all reviews for a course and updates the course record
 * Author: Sanket
 */
async function updateCourseRating(courseId: string) {
    const aggregations = await prisma.review.aggregate({
        where: { courseId },
        _avg: { rating: true },
        _count: { rating: true }
    });

    await prisma.course.update({
        where: { id: courseId },
        data: {
            averageRating: aggregations._avg.rating || 0,
            totalReviews: aggregations._count.rating || 0
        }
    });
}
