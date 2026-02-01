"use server";

import { requireTeacher } from "@/lib/action-security";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
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

        let stripePriceId: string | null = null;
        try {
            const data = await stripe.products.create({
                name: validation.data.title,
                description: validation.data.smallDescription,
                default_price_data: {
                    currency: "usd",
                    unit_amount: validation.data.price * 100,
                },
            });
            stripePriceId = data.default_price as string;
        } catch (stripeError) {
            console.error("Stripe creation failed (continuing with dummy ID):", stripeError);
            // Proceed without stripe ID for dev/testing. Unique constraint allows multiple nulls.
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
                stripePriceId: stripePriceId,
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
