import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { courseId } = await req.json();

        const course = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // --- Feature Gating: Subscription Enrollment Limit ---
        // Author: Sanket - Hardened for expiration
        const { checkEnrollmentLimit } = await import("@/lib/subscription-limits");
        const limitCheck = await checkEnrollmentLimit(session.user.id);
        if (!limitCheck.allowed) {
            return NextResponse.json({ 
                error: `You have reached your limit of ${limitCheck.limit} active course/group enrollments or your subscription has expired. Please upgrade your plan.` 
            }, { status: 403 });
        }
        // -----------------------------------------------------

        // Direct Access Mode: Enforce strict price check - author: Sanket
        if (course.price !== 0) {
            return NextResponse.json({ error: "Course is not free" }, { status: 400 });
        }

        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: session.user.id,
                    courseId: courseId,
                },
            },
        });

        if (existingEnrollment) {
            return NextResponse.json({ message: "Already enrolled" }, { status: 200 });
        }

        const enrollment = await prisma.enrollment.create({
            data: {
                userId: session.user.id,
                courseId: courseId,
                amount: 0,
                status: "Active", // Directly active for free courses
            },
        });

        // Create system notification
        await prisma.notification.create({
            data: {
                userId: session.user.id,
                title: "Course Enrollment Successful",
                message: `You've successfully enrolled in "${course.title}". Start learning now!`,
                type: "Course",
                data: { courseId: course.id, action: "enrolled" }
            }
        });

        return NextResponse.json({ message: "Enrolled successfully" });

    } catch (error) {
        console.error("[ENROLL_FREE]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
