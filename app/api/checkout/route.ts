import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "@/lib/env";
import { protectGeneral, getClientIP } from "@/lib/security";

export const dynamic = "force-dynamic";

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-08-27.basil",
    typescript: true,
});

export async function POST(req: Request) {
    /**
     * Handles course checkout with coupon validation and Stripe session creation.
     * Author: Sanket
     */
    try {
        const stripe = getStripe();
        const session = await getSessionWithRole();
        const user = session?.user;

        if (!user || !user.id || !user.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const clientIP = getClientIP(req) || "unknown";
        const startCheck = await protectGeneral(req, `${clientIP}:checkout`, { maxRequests: 50, windowMs: 60000 });
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
            include: {
                chapter: {
                    include: {
                        lessons: {
                            orderBy: {
                                position: "asc",
                            }
                        }
                    }
                }
            }
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
            return new NextResponse("Already purchased", { status: 400 });
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

        // Create Stripe Session
        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
            {
                quantity: 1,
                price_data: {
                    currency: "USD",
                    product_data: {
                        name: course.title,
                        description: course.smallDescription || undefined,
                        images: course.fileKey ? [`https://utfs.io/f/${course.fileKey}`] : [],
                    },
                    unit_amount: Math.round(finalPrice * 100), // Stripe expects cents
                },
            },
        ];

        let stripeCustomer = await prisma.user.findUnique({
            where: {
                id: user.id,
            },
            select: {
                stripeCustomerId: true,
            }
        });

        if (!stripeCustomer?.stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
            });

            await prisma.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    stripeCustomerId: customer.id,
                }
            });

            stripeCustomer = { stripeCustomerId: customer.id };
        }

        // Create Pending Enrollment
        const enrollment = await prisma.enrollment.create({
            data: {
                userId: user.id,
                courseId: courseId,
                amount: Math.round(finalPrice * 100),
                status: "Pending", // Important: Initial status
            }
        });

        const checkoutSession = await stripe.checkout.sessions.create({
            customer: stripeCustomer.stripeCustomerId || undefined,
            line_items,
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${course.slug}?success=1`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${course.slug}?canceled=1`,
            metadata: {
                courseId: course.id,
                userId: user.id,
                enrollmentId: enrollment.id, // Pass to Webhook
                couponId: couponId || "",
            },
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
        console.log("[COURSE_CHECKOUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
