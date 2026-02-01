"use server";

import { prisma } from "@/lib/db";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

interface BookSessionInput {
    teacherProfileId: string;
    dateTime: string; // "2025-12-20 10:00 AM"
    price: number;
    couponCode?: string;
}

export async function bookSessionAction(data: BookSessionInput) {
    /**
     * Handles 1-on-1 session booking with coupon support.
     * Enforces lifetime free trial limits and secure checkout for paid sessions.
     * Author: Sanket
     */
    try {
        const session = await getSessionWithRole();
        if (!session || !session.user) {
            return { success: false, error: "You must be logged in to book a session" };
        }

        const scheduledAt = new Date(data.dateTime);

        // Enforce Free Trial Limits (1 Demo per student)
        if (data.price === 0) {
            const usage = await prisma.freeClassUsage.findUnique({
                where: { studentId: session.user.id }
            });
            if (usage?.demoUsed) {
                return { success: false, error: "You have already used your free demo session trial." };
            }
        }

        // Coupon Logic
        let finalPrice = data.price;
        let couponId: string | undefined;

        if (data.couponCode) {
            const coupon = await prisma.coupon.findUnique({
                where: { code: data.couponCode, isActive: true }
            });

            if (coupon) {
                const now = new Date();
                const isValid = 
                    (!coupon.expiryDate || now <= coupon.expiryDate) &&
                    (coupon.usedCount < coupon.usageLimit);
                
                // Check if global or teacher-specific
                const isApplicableForTeacher = !coupon.teacherId || coupon.teacherId === data.teacherProfileId;
                // Check if applicable on DEMO or 1-on-1 (30MIN/60MIN)
                const isApplicableOnType = coupon.applicableOn.some(type => ["DEMO", "30MIN", "60MIN"].includes(type));

                if (isValid && isApplicableForTeacher && isApplicableOnType) {
                    let discount = 0;
                    if (coupon.type === "PERCENTAGE") {
                        discount = Math.round((data.price * coupon.value) / 100);
                    } else {
                        discount = coupon.value;
                    }
                    finalPrice = Math.max(0, data.price - discount);
                    couponId = coupon.id;
                } else {
                    return { success: false, error: "Invalid or expired coupon" };
                }
            } else {
                return { success: false, error: "Coupon not found" };
            }
        }

        // Safety Check: Enforce secure checkout for paid sessions
        if (finalPrice > 0) {
             return { success: false, error: "Paid sessions must be completed via secure checkout." };
        }

        // Create Session
        const liveSession = await prisma.liveSession.create({
            data: {
                teacherId: data.teacherProfileId,
                studentId: session.user.id,
                title: "1-on-1 Mentorship Session",
                description: "Private Live Session",
                scheduledAt: scheduledAt,
                duration: 60,
                price: finalPrice,
                status: "scheduled",
                meetingUrl: `/video-call/${crypto.randomUUID()}`
            }
        });

        // Mark free trial as used if applicable
        if (data.price === 0 || finalPrice === 0) {
            await prisma.freeClassUsage.upsert({
                where: { studentId: session.user.id },
                create: { studentId: session.user.id, demoUsed: true },
                update: { demoUsed: true }
            });
        }

        // If coupon used, record usage
        if (couponId) {
             await prisma.couponUsage.create({
                data: {
                    couponId,
                    userId: session.user.id,
                    orderId: `session_${liveSession.id}`
                }
             });
             await prisma.coupon.update({
                where: { id: couponId },
                data: { usedCount: { increment: 1 } }
             });
        }

        revalidatePath("/dashboard/sessions");
        return { success: true, sessionId: liveSession.id };

    } catch (error) {
        logger.error("Booking Error", { error, data });
        return { success: false, error: "Failed to create session" };
    }
}
