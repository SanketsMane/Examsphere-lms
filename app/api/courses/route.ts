import { NextRequest, NextResponse } from "next/server";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { checkCourseLimit } from "@/lib/subscription-limits";

export const dynamic = "force-dynamic";

const createCourseSchema = z.object({
    title: z.string().min(3),
    slug: z.string().min(3),
    price: z.string().transform(val => parseInt(val)),
    category: z.string(),
    smallDescription: z.string().max(200),
    level: z.enum(["Beginner", "Intermediate", "Advanced"]),
});

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionWithRole();
        if (!session || (session.user.role !== "teacher" && session.user.role !== "admin")) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Check if teacher is approved
        if (session.user.role === "teacher") {
            const teacherProfile = await prisma.teacherProfile.findUnique({
                where: { userId: session.user.id }
            });

            if (!teacherProfile?.isApproved) {
                return new NextResponse("Teacher profile not approved. Please complete verification.", { status: 403 });
            }
        }

        const body = await req.json();
        const validatedData = createCourseSchema.parse(body);

        // [STRICT ENFORCEMENT] Check Subscription Limits
        const limitCheck = await checkCourseLimit(session.user.id);
        if (!limitCheck.allowed) {
            return new NextResponse(
                `You have reached your limit of ${limitCheck.limit} courses. Please upgrade your plan.`, 
                { status: 403 }
            );
        }

        const course = await prisma.course.create({
            data: {
                title: validatedData.title,
                slug: validatedData.slug,
                price: validatedData.price,
                category: validatedData.category,
                smallDescription: validatedData.smallDescription,
                level: validatedData.level,
                description: JSON.stringify({ type: "doc", content: [] }), // Init empty rich text
                userId: session.user.id,
                duration: 0,
                fileKey: "", // Placeholder image, teacher should upload later

                status: "Draft",
                tags: [],
                learningOutcomes: []
            }
        });

        return NextResponse.json(course);
    } catch (error) {
        console.error("[COURSES_POST]", error);
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid data", { status: 400 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}
