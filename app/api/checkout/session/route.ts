import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { env } from "@/lib/env";
import { protectGeneral, getClientIP } from "@/lib/security";
import { logger } from "@/lib/logger";
import { getRazorpayInstance } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    let userId: string | undefined;

    try {
        const session = await getSessionWithRole();
        const user = session?.user;
        userId = user?.id;

        console.log("[Checkout] User:", user?.id, user?.email);

        if (!user || !user.id || !user.email) {
            console.warn("[Checkout] Unauthorized access attempt");
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        console.log("[Checkout] Request Body:", JSON.stringify(body));
        const { teacherProfileId, dateTime, couponCode } = body;

        if (!teacherProfileId || !dateTime) {
            console.warn("[Checkout] Missing details:", { teacherProfileId, dateTime });
            return new NextResponse("Missing Details", { status: 400 });
        }

        const teacher = await prisma.teacherProfile.findUnique({
             where: { id: teacherProfileId },
             include: { user: true }
        });

        if (!teacher) {
            console.warn("[Checkout] Teacher not found:", teacherProfileId);
            return new NextResponse("Teacher Not Found", { status: 404 });
        }

        const scheduledAt = new Date(dateTime);
        const hourlyRate = teacher.hourlyRate || 0;
        
        console.log("[Checkout] Teacher:", teacher.id, "Rate:", hourlyRate, "Time:", scheduledAt);

        // Coupon Logic (Simplified duplication of bookSessionAction logic)
        let finalPrice = hourlyRate;
        let couponId: string | undefined;

        if (couponCode) {
             // ... existing coupon logic ...
             // For debugging, just log if coupon is present
             console.log("[Checkout] Validating coupon:", couponCode);
             const coupon = await prisma.coupon.findUnique({
                where: { code: couponCode, isActive: true }
            });
             if (coupon) {
                 const now = new Date();
                const isValid = (!coupon.expiryDate || now <= coupon.expiryDate) && (coupon.usedCount < coupon.usageLimit);
                 if (isValid) {
                      if (coupon.type === "PERCENTAGE") {
                        finalPrice = Math.round((hourlyRate * (100 - coupon.value)) / 100);
                    } else {
                        finalPrice = Math.max(0, hourlyRate - coupon.value);
                    }
                    couponId = coupon.id;
                    console.log("[Checkout] Coupon applied. Final Price:", finalPrice);
                 }
             }
        }

        // Razorpay Initialization
        console.log("[Checkout] Initializing Razorpay...");
        const razorpay = await getRazorpayInstance();
        if (!razorpay) throw new Error("Razorpay Failed to Initialize");

        const currencyCode = "INR";
        const amountInPaisa = Math.round(finalPrice * 100);

        const isFree = amountInPaisa === 0;

        console.log("[Checkout] Creating LiveSession in DB...");
        
        const liveSession = await prisma.liveSession.create({
            data: {
                teacherId: teacherProfileId,
                studentId: user.id,
                title: "1-on-1 Mentorship Session",
                description: "Private Live Session",
                scheduledAt: scheduledAt,
                duration: 60,
                price: amountInPaisa, 
                status: "scheduled", 
                meetingUrl: `/video-call/${crypto.randomUUID()}`,
                bookings: {
                    create: {
                        studentId: user.id,
                        amount: amountInPaisa,
                        status: isFree ? "confirmed" : "pending", 
                    }
                }
            },
            include: { bookings: true }
        });
        
        console.log("[Checkout] LiveSession Created:", liveSession.id);

        const bookingId = liveSession.bookings[0].id;
        
        if (isFree) {
            console.log("[Checkout] Free session confirmed (skipping Razorpay):", bookingId);
            return NextResponse.json({
                orderId: "free_" + bookingId,
                amount: 0,
                currency: currencyCode,
                keyId: null,
                courseName: `Session with ${teacher.user.name}`,
                courseDescription: `1-hour session on ${scheduledAt.toDateString()}`,
                bookingId: bookingId,
                isFree: true,
                user: {
                    name: user.name,
                    email: user.email,
                    contact: "",
                }
            });
        }

        // Create Razorpay Order
        const options = {
            amount: amountInPaisa.toString(),
            currency: currencyCode,
            receipt: bookingId,
            notes: {
                type: "SESSION_BOOKING",
                sessionId: liveSession.id,
                bookingId: bookingId,
                userId: user.id,
                couponId: couponId || "",
            }
        };

        console.log("[Checkout] Creating Razorpay Order with options:", options);
        const order = await razorpay.orders.create(options);
        console.log("[Checkout] Razorpay Order Created:", order.id);

        return NextResponse.json({
            orderId: order.id,
            amount: amountInPaisa,
            currency: currencyCode,
            keyId: await import("@/lib/razorpay").then(m => m.getRazorpayKeyId()),
            courseName: `Session with ${teacher.user.name}`,
            courseDescription: `1-hour session on ${scheduledAt.toDateString()}`,
            isFree: false,
            user: {
                name: user.name,
                email: user.email,
                contact: "",
            }
        });

    } catch (error) {
        console.error("Session Checkout Error Full Stack:", error);
        return new NextResponse("Internal Error: " + (error instanceof Error ? error.message : "Unknown"), { status: 500 });
    }
}
