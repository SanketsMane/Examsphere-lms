"use server";

import { requireTeacher } from "@/lib/action-security";
import { prisma } from "@/lib/db";
import DOMPurify from "isomorphic-dompurify";
import { ApiResponse } from "@/lib/types";
import { courseSchema, CourseSchemaType } from "@/lib/zodSchemas";

export async function CreateCourse(
    values: CourseSchemaType
): Promise<ApiResponse> {
    const session = await requireTeacher();

    try {
        // Rate limiting logic can be re-integrated here if protectAdminAction is restored
        // Previous security check removed

        // --- Feature Gating: Course Creation Limit ---
        const [existingCount, subscription] = await Promise.all([
            prisma.course.count({
                where: { userId: (session.user as any).id }
            }),
            prisma.userSubscription.findUnique({
                where: { userId: (session.user as any).id },
                include: { plan: true }
            })
        ]);

        let maxCourses = 3; // Default limit for free/non-subscribed users
        
        if (subscription && subscription.status === 'active' && (subscription.plan as any).metadata) {
             const meta = (subscription.plan as any).metadata;
             if (typeof meta.maxCourses === 'number') {
                 maxCourses = meta.maxCourses;
             }
        }

        if (existingCount >= maxCourses) {
            return {
                status: "error",
                message: `You have reached the limit of ${maxCourses} courses for your current plan. Please upgrade to create more.`
            };
        }
        // ---------------------------------------------

        const validation = courseSchema.safeParse(values);

        if (!validation.success) {
            return {
                status: "error",
                message: "Invalid Form Data",
            };
        }

        const course = await prisma.course.create({
            data: {
                ...validation.data,
                description: validation.data.description ? DOMPurify.sanitize(validation.data.description) : validation.data.description,
                user: {
                    connect: {
                        id: (session.user as any).id,
                    },
                },
            },
        });

        return {
            status: "success",
            message: "Course created succesfully",
            data: { id: course.id }
        };
    } catch (error: any) {
        console.error("Course creation error:", error);
        return {
            status: "error",
            message: error.message || "Failed to create course",
        };
    }
}
