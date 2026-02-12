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

        // Get teacher profile to check free trial eligibility
        const teacherProfile = await prisma.teacherProfile.findUnique({
            where: { id: data.teacherProfileId }
        });

        if (!teacherProfile) {
            return { success: false, error: "Teacher not found" };
        }

        // Check Free Trial Eligibility (Per-Teacher System)
        // Author: Sanket - Email-based tracking prevents multi-account abuse
        const { checkFreeTrialEligibility, recordFreeTrialUsage } = await import("./free-trial-helpers");
        
        const isEligibleForFreeTrial = await checkFreeTrialEligibility({
            studentId: session.user.id,
            studentEmail: session.user.email,
            teacherId: data.teacherProfileId
        });

        // If price is 0 and student has already used free trial with this teacher, reject
        if (data.price === 0 && !isEligibleForFreeTrial) {
            return { 
                success: false, 
                error: "You have already used your free trial session with this teacher." 
            };
        }

        // Check for Active Subscription
        // Author: Sanket - Hardened expiration and status check
        const { getActiveUserSubscription } = await import("@/lib/subscription");
        const activeSub = await getActiveUserSubscription(session.user.id);

        const hasActiveSubscription = !!activeSub;
        const isSubscriptionBooking = hasActiveSubscription && (activeSub.plan.name === "Unlimited" || activeSub.plan.name === "Pro Student Plan");

        // Coupon Logic
        let finalPrice = isSubscriptionBooking ? 0 : data.price;
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

        // Determine if this is a free trial booking
        const isFreeTrialBooking = data.price === 0 && isEligibleForFreeTrial;

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
                meetingUrl: `/video-call/${crypto.randomUUID()}`,
                isFreeTrialEligible: isFreeTrialBooking,  // Mark if this was offered as free trial
                isFreeTrialUsed: isFreeTrialBooking       // Mark as used immediately
            }
        });

        // Record free trial usage if applicable
        if (isFreeTrialBooking) {
            await recordFreeTrialUsage({
                studentId: session.user.id,
                studentEmail: session.user.email,
                teacherId: data.teacherProfileId,
                sessionType: "live_session",
                sessionId: liveSession.id
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

        // Create notifications for both parties
        const teacher = await prisma.teacherProfile.findUnique({
            where: { id: data.teacherProfileId },
            select: { userId: true, user: { select: { name: true } } }
        });

        // Notify student
        await prisma.notification.create({
            data: {
                userId: session.user.id,
                title: "Session Booked Successfully",
                message: `Your session with ${teacher?.user.name || "the teacher"} has been confirmed for ${scheduledAt.toLocaleDateString()}.`,
                type: "Session",
                data: { sessionId: liveSession.id, action: "booked" }
            }
        });

        // Notify teacher
        if (teacher) {
            await prisma.notification.create({
                data: {
                    userId: teacher.userId,
                    title: "New Session Booking",
                    message: `${session.user.name || "A student"} has booked a session with you for ${scheduledAt.toLocaleDateString()}.`,
                    type: "Session",
                    data: { sessionId: liveSession.id, action: "booked" }
                }
            });
        }

        revalidatePath("/dashboard/sessions");
        return { success: true, sessionId: liveSession.id };

    } catch (error) {
        logger.error("Booking Error", { error, data });
        return { success: false, error: "Failed to create session" };
    }
}

export async function bookSessionWithWallet(data: BookSessionInput) {
    /**
     * Handles 1-on-1 session booking via Wallet.
     * Deducts balance and confirms booking atomically.
     * Author: Sanket
     */
    try {
        const session = await getSessionWithRole();
        if (!session || !session.user) {
            return { success: false, error: "You must be logged in to book a session" };
        }

        const scheduledAt = new Date(data.dateTime);

        // Deduct from Wallet
        const { deductFromWallet } = await import("@/app/actions/wallet");
        
        const teacherProfile = await prisma.teacherProfile.findUnique({
             where: { id: data.teacherProfileId },
             include: { user: true }
        });
        if (!teacherProfile) return { success: false, error: "Teacher not found" };

        const hourlyRate = teacherProfile.hourlyRate || 0;
        let finalPrice = hourlyRate;

        if (data.couponCode) {
             const coupon = await prisma.coupon.findUnique({ where: { code: data.couponCode, isActive: true } });
             if (coupon) {
                 const now = new Date();
                 if ((!coupon.expiryDate || now <= coupon.expiryDate) && (coupon.usedCount < coupon.usageLimit)) {
                     if (coupon.type === "PERCENTAGE") {
                        finalPrice = Math.round((hourlyRate * (100 - coupon.value)) / 100);
                     } else {
                        finalPrice = Math.max(0, hourlyRate - coupon.value);
                     }
                 }
             }
        }

        if (finalPrice <= 0) return { success: false, error: "Use free booking for zero price" };

        // Transaction
        const result = await prisma.$transaction(async (tx) => {
             await deductFromWallet(
                 session.user.id,
                 finalPrice, 
                 "SESSION_BOOKING", 
                 `Session with ${teacherProfile.user?.name || "Teacher"}`,
                 { teacherId: data.teacherProfileId },
                 tx
             );

             const liveSession = await tx.liveSession.create({
                data: {
                    teacherId: data.teacherProfileId,
                    studentId: session.user.id,
                    title: "1-on-1 Mentorship Session",
                    description: "Private Live Session",
                    scheduledAt: scheduledAt,
                    duration: 60,
                    price: finalPrice,
                    status: "scheduled",
                    meetingUrl: `/video-call/${crypto.randomUUID()}`,
                    bookings: {
                        create: {
                            studentId: session.user.id,
                            amount: finalPrice, 
                            status: "confirmed"
                        }
                    }
                }
            });
            return liveSession;
        });
        
        revalidatePath("/dashboard/sessions");
        return { success: true, sessionId: result.id };

    } catch (error: any) {
        logger.error("Wallet Booking Error", { error });
        return { success: false, error: error.message || "Wallet payment failed" };
    }
}
