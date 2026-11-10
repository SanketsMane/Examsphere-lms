import { NextResponse } from "next/server";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getClientIP, protectGeneral } from "@/lib/security";
import {
  getRazorpayInstance,
  getRazorpayKeyId,
  isRazorpayConfigured,
  PAYMENTS_UNAVAILABLE_MESSAGE,
  RazorpayNotConfiguredError,
} from "@/lib/razorpay";
import { getNoteAccess } from "@/lib/notes/access";
import { effectiveNotePricePaise } from "@/lib/notes/validation";

export const dynamic = "force-dynamic";

/** Start a Razorpay payment for a note. Access is granted only after verify / webhook. */
export async function POST(req: Request) {
  let userId: string | undefined;
  try {
    const session = await getSessionWithRole();
    const user = session?.user;
    userId = user?.id;
    if (!user?.id || !user.email) return NextResponse.json({ error: "Please sign in to buy notes." }, { status: 401 });

    const ip = getClientIP(req) || "unknown";
    const limit = await protectGeneral(req, `${ip}:notes-checkout`, { maxRequests: 30, windowMs: 60_000 });
    if (!limit.success) return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });

    const body = await req.json().catch(() => null);
    const noteId = typeof body?.noteId === "string" ? body.noteId : "";
    const note = noteId ? await prisma.note.findUnique({ where: { id: noteId } }) : null;
    if (!note || note.status !== "PUBLISHED" || note.accessType !== "PAID") {
      return NextResponse.json({ error: "These notes are not available for purchase." }, { status: 404 });
    }

    const access = await getNoteAccess(user, note);
    if (access.allowed) return NextResponse.json({ error: "You already have these notes." }, { status: 400 });
    if (access.reason === "REVOKED") {
      return NextResponse.json({ error: "Access to these notes was removed. Please contact support." }, { status: 403 });
    }

    if (!(await isRazorpayConfigured())) {
      return NextResponse.json({ error: PAYMENTS_UNAVAILABLE_MESSAGE }, { status: 503 });
    }

    const amountPaise = effectiveNotePricePaise(note);
    // One row per user+note. Reset any earlier payment reference (e.g. after a refund).
    const entitlement = await prisma.noteEntitlement.upsert({
      where: { userId_noteId: { userId: user.id, noteId: note.id } },
      update: { source: "PURCHASE", status: "PENDING", amountPaise, razorpayPaymentId: null },
      create: { userId: user.id, noteId: note.id, source: "PURCHASE", status: "PENDING", amountPaise },
    });

    const razorpay = await getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `note_${entitlement.id}`.slice(0, 40),
      notes: { type: "NOTE_PURCHASE", noteId: note.id, userId: user.id, entitlementId: entitlement.id },
    });

    await prisma.noteEntitlement.update({ where: { id: entitlement.id }, data: { razorpayOrderId: order.id } });

    return NextResponse.json({
      orderId: order.id,
      amount: amountPaise,
      currency: "INR",
      keyId: await getRazorpayKeyId(),
      name: note.title,
      description: note.shortDescription || "ExamSphere notes",
      user: { name: user.name, email: user.email, contact: "" },
    });
  } catch (error) {
    if (error instanceof RazorpayNotConfiguredError) {
      return NextResponse.json({ error: PAYMENTS_UNAVAILABLE_MESSAGE }, { status: 503 });
    }
    logger.error("NOTE_CHECKOUT_ERROR", error as Error, userId);
    return NextResponse.json({ error: "Could not start the payment. Please try again in a moment." }, { status: 500 });
  }
}
