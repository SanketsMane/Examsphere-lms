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
        /*
        const securityCheck = await protectAdminAction(session.user.id);
        if (!securityCheck.success) {
            return {
                status: "error",
                message: securityCheck.error || "Security check failed",
            };
        }
        */

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
