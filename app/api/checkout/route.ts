import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { protectGeneral, getClientIP } from "@/lib/security";
import { getCurrencyData } from "@/lib/currency";
import { logger } from "@/lib/logger";
import { getRazorpayInstance } from "@/lib/razorpay";

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

        const { courseId, couponCode } = await req.json();

        if (!courseId) {
            return new NextResponse("Missing Course ID", { status: 400 });
        }

        const course = await prisma.course.findUnique({
            where: {
                id: courseId,
            },
        });

        if (!course) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // Check if already purchased
        const purchase = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: courseId,
                },
            },
        });

        if (purchase) {
            // Check if status is completed, if pending we might want to allow retry or resume
            if (purchase.status === "Active") {
                return new NextResponse("Already purchased", { status: 400 });
            }
        }

        // Coupon Logic
        let finalPrice = course.price;
        let couponId: string | undefined;

        if (couponCode) {
            const coupon = await prisma.coupon.findUnique({
                where: { code: couponCode, isActive: true }
            });

            if (coupon) {
                const now = new Date();
                const isValid = 
                    (!coupon.expiryDate || now <= coupon.expiryDate) &&
                    (coupon.usedCount < coupon.usageLimit);
                
                // Check if global or teacher-specific
                const isApplicableForTeacher = !coupon.teacherId || coupon.teacherId === course.userId;
                // Check if applicable on FULL course
                const isApplicableOnType = coupon.applicableOn.includes("FULL");

                if (isValid && isApplicableForTeacher && isApplicableOnType) {
                    let discount = 0;
                    if (coupon.type === "PERCENTAGE") {
                        discount = Math.round((course.price * coupon.value) / 100);
                    } else {
                        discount = coupon.value;
                    }
                    finalPrice = Math.max(0, course.price - discount);
                    couponId = coupon.id;
                }
            }
        }

        // 1. Initialize Razorpay
        const razorpay = await getRazorpayInstance();

        // 2. Resolve Currency
        // Force INR for Razorpay if using Indian account, or dynamic if supported. 
        // For simpler integration consistent with "INR" default plan, we use INR.
        const currencyCode = "INR"; 
        
        // Since we updated default factor to 1 for INR in lib/currency, finalPrice is already in INR unit.
        // Razorpay expects amount in PAISA (smallest currency unit), so multiply by 100.
        const amountInPaisa = Math.round(finalPrice * 100);

        // 3. Create Pending Enrollment (or update existing pending)
        // We'll upsert to handle retries cleanly
        const enrollment = await prisma.enrollment.upsert({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: courseId,
                }
            },
            update: {
                amount: amountInPaisa,
                status: "Pending",
            },
            create: {
                userId: user.id,
                courseId: courseId,
                amount: amountInPaisa,
                status: "Pending",
            }
        });

        // 4. Create Razorpay Order
        const options = {
            amount: amountInPaisa.toString(),
            currency: currencyCode,
            receipt: enrollment.id,
            notes: {
                courseId: course.id,
                userId: user.id,
                enrollmentId: enrollment.id,
                couponId: couponId || "",
            }
        };

        const order = await razorpay.orders.create(options);

        // Update enrollment with Razorpay Order ID for tracking
        await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: { razorpayOrderId: order.id }
        });

        return NextResponse.json({
            orderId: order.id,
            amount: amountInPaisa,
            currency: currencyCode,
            keyId: await import("@/lib/razorpay").then(m => m.getRazorpayKeyId()),
            courseName: course.title,
            courseDescription: course.smallDescription,
            user: {
                name: user.name,
                email: user.email,
                contact: "", // If we had phone number we'd pass it here
            }
        });

    } catch (error) {
        // If razorpay credentials missing
        if (error instanceof Error && error.message.includes("Razorpay credentials")) {
             return new NextResponse("Payment Gateway Configuration Error", { status: 503 });
        }
        logger.error("COURSE_CHECKOUT_ERROR", error as Error, userId);
        console.error(error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
