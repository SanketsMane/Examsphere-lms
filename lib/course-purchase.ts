import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculatePlatformCommission } from "@/lib/finance";
import { logger } from "@/lib/logger";
import { toPaise } from "@/lib/money";

/**
 * Shared course-purchase logic for the Razorpay (checkout → verify/webhook) and
 * wallet paths, so the two cannot drift on coupons, units or commission.
 *
 * Units: Course.price, Enrollment.amount and coupon FIXED values are whole rupees
 * (lib/money.ts; the admin finance pages read Enrollment.amount as rupees).
 * Commission rows are paise, matching what teacher-payouts divides by 100.
 */

type Db = Prisma.TransactionClient | typeof prisma;

// The admin coupon form offers FULL_COURSE / CRASH_COURSE; older rows use FULL / COURSE.
const COURSE_COUPON_SCOPES = ["FULL_COURSE", "CRASH_COURSE", "FULL", "COURSE"];

export type CouponResult =
    | { ok: true; couponId: string; finalPrice: number; discount: number }
    | { ok: false; message: string };

export async function validateCourseCoupon(
    db: Db,
    params: {
        code: string;
        userId: string;
        course: { price: number; userId: string; teacherProfileId?: string | null };
    }
): Promise<CouponResult> {
    const code = params.code.trim().toUpperCase();
    if (!code) return { ok: false, message: "Enter a coupon code" };

    const coupon = await db.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) return { ok: false, message: "Invalid coupon code" };
    if (coupon.expiryDate && coupon.expiryDate.getTime() < Date.now()) {
        return { ok: false, message: "This coupon has expired" };
    }
    if (coupon.usedCount >= coupon.usageLimit) {
        return { ok: false, message: "This coupon has reached its usage limit" };
    }

    const scopes = Array.isArray(coupon.applicableOn) ? (coupon.applicableOn as string[]) : [];
    if (!scopes.some((s) => COURSE_COUPON_SCOPES.includes(String(s).toUpperCase()))) {
        return { ok: false, message: "This coupon cannot be used for courses" };
    }

    // teacherId has been populated with both User and TeacherProfile ids historically.
    const { course } = params;
    if (coupon.teacherId && coupon.teacherId !== course.userId && coupon.teacherId !== course.teacherProfileId) {
        return { ok: false, message: "This coupon is not valid for this course" };
    }

    const usedByUser = await db.couponUsage.count({
        where: { couponId: coupon.id, userId: params.userId },
    });
    if (usedByUser >= coupon.perUserLimit) {
        return { ok: false, message: "You have already used this coupon" };
    }

    const discount = coupon.type === "PERCENTAGE"
        ? Math.round((course.price * Math.min(coupon.value, 100)) / 100)
        : coupon.value;
    const finalPrice = Math.max(0, course.price - discount);

    return { ok: true, couponId: coupon.id, finalPrice, discount: course.price - finalPrice };
}

/**
 * Consume one use of a coupon. The usage limit is enforced in the UPDATE itself so
 * concurrent redemptions cannot overshoot it. Returns false if the limit was hit.
 */
export async function redeemCoupon(
    tx: Prisma.TransactionClient,
    couponId: string,
    userId: string,
    orderId?: string | null
): Promise<boolean> {
    const coupon = await tx.coupon.findUnique({ where: { id: couponId }, select: { usageLimit: true } });
    if (!coupon) return false;

    const updated = await tx.coupon.updateMany({
        where: { id: couponId, usedCount: { lt: coupon.usageLimit } },
        data: { usedCount: { increment: 1 } },
    });
    if (updated.count !== 1) return false;

    await tx.couponUsage.create({ data: { couponId, userId, orderId: orderId ?? null } });
    return true;
}

/** Teacher commission for a course sale. `amountPaise` is what the student paid. */
export async function createCourseCommission(
    tx: Prisma.TransactionClient,
    courseId: string,
    amountPaise: number,
    metadata?: Record<string, unknown>
) {
    if (amountPaise <= 0) return;

    const course = await tx.course.findUnique({
        where: { id: courseId },
        select: { title: true, user: { select: { teacherProfile: { select: { id: true } } } } },
    });
    const teacherProfileId = course?.user.teacherProfile?.id;
    if (!teacherProfileId) return;

    const { platformFee, teacherNet } = await calculatePlatformCommission(amountPaise, teacherProfileId);

    await tx.commission.create({
        data: {
            teacherId: teacherProfileId,
            courseId,
            type: "Course",
            amount: amountPaise,
            commission: platformFee,
            commissionAmount: platformFee,
            netAmount: teacherNet,
            status: "Pending",
            description: `Course sale: ${course?.title ?? courseId}`,
            metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        },
    });
}

export interface CapturedPayment {
    orderId: string;
    paymentId: string;
    /** Amount actually captured, in paise. */
    amountPaise: number;
    currency?: string;
    method?: string;
    email?: string | null;
    contact?: string | null;
    couponId?: string | null;
}

/**
 * Activate the Pending enrollment behind a Razorpay order. Safe to call from both
 * the client verify endpoint and the webhook, concurrently and repeatedly: the
 * status compare-and-set inside the transaction lets exactly one caller win, and
 * only the winner creates commission / coupon usage / notifications.
 */
export async function activatePaidEnrollment(payment: CapturedPayment) {
    const enrollment = await prisma.enrollment.findFirst({
        where: { razorpayOrderId: payment.orderId },
    });
    if (!enrollment) return { found: false as const };

    const course = await prisma.course.findUnique({
        where: { id: enrollment.courseId },
        select: { title: true, slug: true, price: true },
    });

    // Never activate on an underpayment (e.g. an order created before a price change).
    if (enrollment.amount > 0 && payment.amountPaise < toPaise(enrollment.amount)) {
        logger.error("Razorpay payment below enrollment amount", {
            enrollmentId: enrollment.id,
            paid: payment.amountPaise,
            expectedRupees: enrollment.amount,
        });
        return { found: true as const, activated: false, underpaid: true, enrollment, course };
    }

    const activated = await prisma.$transaction(async (tx) => {
        const claimed = await tx.enrollment.updateMany({
            where: { id: enrollment.id, status: { not: "Active" } },
            data: { status: "Active", razorpayPaymentId: payment.paymentId },
        });
        if (claimed.count !== 1) return false;

        await createCourseCommission(tx, enrollment.courseId, payment.amountPaise, {
            enrollmentId: enrollment.id,
            studentId: enrollment.userId,
            razorpayPaymentId: payment.paymentId,
        });

        if (payment.couponId) {
            // The student has already paid the discounted price, so a coupon that
            // ran out in the meantime is logged rather than blocking access.
            const ok = await redeemCoupon(tx, payment.couponId, enrollment.userId, payment.orderId);
            if (!ok) logger.warn("Coupon usage limit reached after payment", { couponId: payment.couponId, enrollmentId: enrollment.id });
        }

        await tx.notification.create({
            data: {
                userId: enrollment.userId,
                title: "Course Enrollment Successful",
                message: `Your payment was successful! You're now enrolled in "${course?.title || "the course"}".`,
                type: "Course",
                data: { courseId: enrollment.courseId, action: "enrolled" },
            },
        });

        await tx.systemTransaction.create({
            data: {
                amount: payment.amountPaise, // in paisa
                currency: payment.currency || "INR",
                status: "SUCCESS",
                method: payment.method,
                providerOrderId: payment.orderId,
                providerPaymentId: payment.paymentId,
                type: "COURSE_PURCHASE",
                description: `Course Enrollment: ${enrollment.courseId}`,
                userId: enrollment.userId,
                metadata: {
                    enrollmentId: enrollment.id,
                    email: payment.email ?? null,
                    contact: payment.contact ?? null,
                },
            },
        });

        return true;
    });

    if (activated) {
        await sendEnrollmentReceipt(payment, course?.title);
        const { rewardReferrer } = await import("@/lib/wallet-internal");
        await rewardReferrer(enrollment.userId);
    }

    return { found: true as const, activated, underpaid: false, enrollment, course };
}

async function sendEnrollmentReceipt(payment: CapturedPayment, courseTitle?: string) {
    if (!payment.email) return;
    const amount = (payment.amountPaise / 100).toFixed(2) + " " + (payment.currency || "INR");
    try {
        const { sendReceiptEmail } = await import("@/lib/email-notifications");
        await sendReceiptEmail(payment.email, "Student", `Course Purchase: ${courseTitle}`, amount, payment.paymentId);

        const { sendTemplatedEmail } = await import("@/lib/email");
        await sendTemplatedEmail("paymentSuccessful", payment.email, "Payment Successful", {
            userName: "Student",
            itemName: courseTitle || "Course",
            amount,
            transactionId: payment.paymentId,
        });
    } catch (e) {
        logger.error("Failed to send course receipt email", { error: e });
    }
}
