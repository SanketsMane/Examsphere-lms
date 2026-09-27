import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { protectGeneral, getClientIP } from "@/lib/security";
import { logger } from "@/lib/logger";
import {
    getRazorpayInstance,
    getRazorpayKeyId,
    isRazorpayConfigured,
    PAYMENTS_UNAVAILABLE_MESSAGE,
    RazorpayNotConfiguredError,
} from "@/lib/razorpay";
import { toPaise } from "@/lib/money";
import { validateCourseCoupon } from "@/lib/course-purchase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    let userId: string | undefined;

    try {
        const session = await getSessionWithRole();
        const user = session?.user;
        userId = user?.id;

        if (!user || !user.id || !user.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const clientIP = getClientIP(req) || "unknown";
        const startCheck = await protectGeneral(req, `${clientIP}:checkout`, { maxRequests: 1250, windowMs: 60000 });
        if (!startCheck.success) {
             return new NextResponse("Too many checkout attempts", { status: 429 });
        }

        if (!(await isRazorpayConfigured())) {
            return new NextResponse(PAYMENTS_UNAVAILABLE_MESSAGE, { status: 503 });
        }

        const { courseId, couponCode } = await req.json();

        if (!courseId) {
            return new NextResponse("Missing Course ID", { status: 400 });
        }

        const course = await prisma.course.findUnique({
            where: {
                id: courseId,
            },
            include: { user: { select: { teacherProfile: { select: { id: true } } } } },
        });

        if (!course || course.status !== "Published") {
            return new NextResponse("This course is not available for purchase", { status: 404 });
        }

        const purchase = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: courseId,
                },
            },
        });

        if (purchase?.status === "Active") {
            return new NextResponse("You are already enrolled in this course", { status: 400 });
        }

        let finalPrice = course.price;
        let couponId: string | undefined;

        if (couponCode) {
            const coupon = await validateCourseCoupon(prisma, {
                code: couponCode,
                userId: user.id,
                course: { price: course.price, userId: course.userId, teacherProfileId: course.user.teacherProfile?.id },
            });
            if (!coupon.ok) {
                return new NextResponse(coupon.message, { status: 400 });
            }
            finalPrice = coupon.finalPrice;
            couponId = coupon.couponId;
        }

        if (finalPrice <= 0) {
            return new NextResponse("This coupon makes the course free. Please pay with your wallet to apply it.", { status: 400 });
        }

        const razorpay = await getRazorpayInstance();
        const currencyCode = "INR";
        const amountInPaisa = toPaise(finalPrice);

        // Enrollment.amount is whole rupees (what finance pages read); only the
        // Razorpay order is in paise.
        const enrollment = await prisma.enrollment.upsert({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: courseId,
                }
            },
            update: {
                amount: finalPrice,
                status: "Pending",
            },
            create: {
                userId: user.id,
                courseId: courseId,
                amount: finalPrice,
                status: "Pending",
            }
        });

        const order = await razorpay.orders.create({
            amount: amountInPaisa,
            currency: currencyCode,
            receipt: enrollment.id,
            notes: {
                type: "COURSE_ENROLLMENT",
                courseId: course.id,
                userId: user.id,
                enrollmentId: enrollment.id,
                couponId: couponId || "",
            }
        });

        await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: { razorpayOrderId: order.id }
        });

        return NextResponse.json({
            orderId: order.id,
            amount: amountInPaisa,
            currency: currencyCode,
            keyId: await getRazorpayKeyId(),
            courseName: course.title,
            courseSlug: course.slug,
            courseDescription: course.smallDescription,
            user: {
                name: user.name,
                email: user.email,
                contact: "",
            }
        });

    } catch (error) {
        if (error instanceof RazorpayNotConfiguredError) {
            return new NextResponse(PAYMENTS_UNAVAILABLE_MESSAGE, { status: 503 });
        }
        logger.error("COURSE_CHECKOUT_ERROR", error as Error, userId);
        return new NextResponse("Could not start the payment. Please try again in a moment.", { status: 500 });
    }
}
