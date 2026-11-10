import { NextResponse } from "next/server";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { logger } from "@/lib/logger";
import {
  getRazorpayInstance,
  PAYMENTS_UNAVAILABLE_MESSAGE,
  RazorpayNotConfiguredError,
  verifyRazorpayPaymentSignature,
} from "@/lib/razorpay";
import { activateNoteEntitlement, findEntitlementForPayment } from "@/lib/notes/purchase";

export const dynamic = "force-dynamic";

/**
 * Called by the checkout success handler so access is immediate. The webhook runs the
 * same idempotent activation; whichever arrives first wins.
 */
export async function POST(req: Request) {
  let userId: string | undefined;
  try {
    const session = await getSessionWithRole();
    userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    const razorpay = await getRazorpayInstance();
    const [order, payment] = await Promise.all([razorpay.orders.fetch(orderId), razorpay.payments.fetch(paymentId)]);
    const notes = (order.notes ?? {}) as Record<string, string>;
    if (notes.type !== "NOTE_PURCHASE") return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const entitlement = await findEntitlementForPayment(orderId, notes.entitlementId);
    if (!entitlement || entitlement.userId !== userId) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (payment.status !== "captured") {
      return NextResponse.json({ error: "Payment has not completed yet" }, { status: 409 });
    }

    const result = await activateNoteEntitlement({
      orderId,
      paymentId,
      amountPaise: Number(payment.amount),
      currency: payment.currency,
      method: payment.method,
      email: payment.email || session?.user?.email,
      contact: payment.contact ? String(payment.contact) : null,
      entitlementId: notes.entitlementId,
    });
    if (!result.found) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (result.underpaid) {
      return NextResponse.json({ error: "Payment amount does not match the order. Please contact support." }, { status: 400 });
    }
    return NextResponse.json({ success: true, slug: result.note?.slug ?? null });
  } catch (error) {
    if (error instanceof RazorpayNotConfiguredError) {
      return NextResponse.json({ error: PAYMENTS_UNAVAILABLE_MESSAGE }, { status: 503 });
    }
    logger.error("NOTE_PAYMENT_VERIFY_ERROR", error as Error, userId);
    return NextResponse.json({ error: "Could not confirm the payment. If you were charged, access will be granted shortly." }, { status: 500 });
  }
}
