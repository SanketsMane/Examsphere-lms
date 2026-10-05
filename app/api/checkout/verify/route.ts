import { NextResponse } from "next/server";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
    getRazorpayInstance,
    PAYMENTS_UNAVAILABLE_MESSAGE,
    RazorpayNotConfiguredError,
    verifyRazorpayPaymentSignature,
} from "@/lib/razorpay";
import { activatePaidEnrollment } from "@/lib/course-purchase";

export const dynamic = "force-dynamic";

/**
 * Called by the checkout success handler so the student gets access immediately
 * instead of waiting on (or depending on) the webhook. The webhook runs the same
 * idempotent activation, so whichever arrives first wins and the other is a no-op.
 */
export async function POST(req: Request) {
    let userId: string | undefined;
    try {
        const session = await getSessionWithRole();
        userId = session?.user?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(() => null);
        const orderId = body?.razorpay_order_id;
        const paymentId = body?.razorpay_payment_id;
        const signature = body?.razorpay_signature;

        if (typeof orderId !== "string" || typeof paymentId !== "string" || typeof signature !== "string") {
            return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
        }

        if (!(await verifyRazorpayPaymentSignature(orderId, paymentId, signature))) {
            return NextResponse.json({ error: "Payment could not be verified" }, { status: 400 });
        }

        const enrollment = await prisma.enrollment.findFirst({
            where: { razorpayOrderId: orderId },
            select: { userId: true },
        });
        if (!enrollment || enrollment.userId !== userId) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // The signature proves the payment belongs to this order; the order
        // (created by us) carries the authoritative amount and coupon.
        const razorpay = await getRazorpayInstance();
        const [order, payment] = await Promise.all([
            razorpay.orders.fetch(orderId),
            razorpay.payments.fetch(paymentId),
        ]);

        if (payment.status !== "captured") {
            return NextResponse.json({ error: "Payment has not completed yet" }, { status: 409 });
        }

        const result = await activatePaidEnrollment({
            orderId,
            paymentId,
            amountPaise: Number(payment.amount),
            currency: payment.currency,
            method: payment.method,
            email: payment.email || session?.user?.email,
            contact: payment.contact ? String(payment.contact) : null,
            couponId: (order.notes as Record<string, string> | undefined)?.couponId || null,
        });

        if (!result.found) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
        if (result.underpaid) {
            return NextResponse.json({ error: "Payment amount does not match the order. Please contact support." }, { status: 400 });
        }

        return NextResponse.json({ success: true, courseSlug: result.course?.slug ?? null });
    } catch (error) {
        if (error instanceof RazorpayNotConfiguredError) {
            return NextResponse.json({ error: PAYMENTS_UNAVAILABLE_MESSAGE }, { status: 503 });
        }
        logger.error("COURSE_PAYMENT_VERIFY_ERROR", error as Error, userId);
        return NextResponse.json({ error: "Could not confirm the payment. If you were charged, access will be granted shortly." }, { status: 500 });
    }
}
