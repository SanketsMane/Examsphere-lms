import "server-only";

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { deductFromWallet, creditToWallet } from "@/lib/wallet-internal";
import { getNoteAccess } from "@/lib/notes/access";
import { effectiveNotePricePaise, formatRupeesFromPaise } from "@/lib/notes/validation";

/**
 * Note purchases. Mirrors lib/course-purchase.ts: Razorpay checkout → verify route and
 * webhook both call `activateNoteEntitlement`, which is idempotent; wallet purchases run
 * the debit and the grant in one transaction.
 */

export interface CapturedNotePayment {
  orderId: string;
  paymentId: string;
  amountPaise: number;
  currency?: string;
  method?: string;
  email?: string | null;
  contact?: string | null;
  /** From the order's notes: lets a payment on a superseded order still be matched. */
  entitlementId?: string | null;
}

export async function findEntitlementForPayment(orderId: string, entitlementId?: string | null) {
  const byOrder = await prisma.noteEntitlement.findUnique({ where: { razorpayOrderId: orderId } });
  if (byOrder) return byOrder;
  if (entitlementId) {
    return prisma.noteEntitlement.findUnique({ where: { id: entitlementId } });
  }
  return null;
}

/**
 * Record a captured Razorpay payment and grant access. Safe to call concurrently and
 * repeatedly: the claim is "no payment recorded yet" (razorpayPaymentId IS NULL), so
 * exactly one caller writes the transaction and notification.
 */
export async function activateNoteEntitlement(payment: CapturedNotePayment) {
  const entitlement = await findEntitlementForPayment(payment.orderId, payment.entitlementId);
  if (!entitlement) return { found: false as const };

  const note = await prisma.note.findUnique({
    where: { id: entitlement.noteId },
    select: { id: true, title: true, slug: true },
  });

  if (entitlement.amountPaise > 0 && payment.amountPaise < entitlement.amountPaise) {
    logger.error("Razorpay payment below note price", {
      entitlementId: entitlement.id,
      paid: payment.amountPaise,
      expected: entitlement.amountPaise,
    });
    return { found: true as const, activated: false, underpaid: true, entitlement, note };
  }

  const activated = await prisma.$transaction(async (tx) => {
    const claimed = await tx.noteEntitlement.updateMany({
      where: { id: entitlement.id, razorpayPaymentId: null },
      data: {
        status: "ACTIVE",
        source: "PURCHASE",
        amountPaise: payment.amountPaise,
        razorpayOrderId: payment.orderId,
        razorpayPaymentId: payment.paymentId,
        activatedAt: new Date(),
        revokedAt: null,
        revokeReason: null,
      },
    });
    if (claimed.count !== 1) return false;

    await tx.systemTransaction.create({
      data: {
        amount: payment.amountPaise,
        currency: payment.currency || "INR",
        status: "SUCCESS",
        method: payment.method,
        providerOrderId: payment.orderId,
        providerPaymentId: payment.paymentId,
        type: "NOTE_PURCHASE",
        description: `Notes: ${note?.title ?? entitlement.noteId}`,
        userId: entitlement.userId,
        metadata: {
          noteId: entitlement.noteId,
          entitlementId: entitlement.id,
          email: payment.email ?? null,
          contact: payment.contact ?? null,
        },
      },
    });

    await tx.notification.create({
      data: {
        userId: entitlement.userId,
        title: "Notes unlocked",
        message: `Payment received. "${note?.title ?? "Your notes"}" is now in My Notes.`,
        type: "Course",
        data: { noteId: entitlement.noteId, action: "note_purchased" },
      },
    });
    return true;
  });

  if (activated) {
    await sendNoteReceipt(payment, note?.title).catch(() => {});
  }
  return { found: true as const, activated, underpaid: false, entitlement, note };
}

async function sendNoteReceipt(payment: CapturedNotePayment, title?: string) {
  if (!payment.email) return;
  const { sendReceiptEmail } = await import("@/lib/email-notifications");
  await sendReceiptEmail(
    payment.email,
    "Student",
    `Notes: ${title ?? ""}`.trim(),
    formatRupeesFromPaise(payment.amountPaise),
    payment.paymentId
  );
}

export class NotePurchaseError extends Error {}

/** Buy a note with wallet balance. The debit and the grant commit together or not at all. */
export async function purchaseNoteWithWallet(user: { id: string; role?: string | null }, noteId: string) {
  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note || note.status !== "PUBLISHED" || note.accessType !== "PAID") {
    throw new NotePurchaseError("These notes are not available for purchase.");
  }

  const access = await getNoteAccess(user, note);
  if (access.allowed) throw new NotePurchaseError("You already have these notes.");
  if (access.reason === "REVOKED") throw new NotePurchaseError("Access to these notes was removed. Please contact support.");

  const pricePaise = effectiveNotePricePaise(note);
  if (pricePaise <= 0 || pricePaise % 100 !== 0) {
    throw new NotePurchaseError("This price cannot be paid from the wallet.");
  }
  const rupees = pricePaise / 100;

  return prisma.$transaction(async (tx) => {
    const debit = await deductFromWallet(
      user.id,
      rupees,
      "NOTE_PURCHASE",
      `Notes: ${note.title}`,
      { noteId: note.id },
      tx
    );

    const entitlement = await tx.noteEntitlement.upsert({
      where: { userId_noteId: { userId: user.id, noteId: note.id } },
      update: {
        status: "ACTIVE",
        source: "WALLET",
        amountPaise: pricePaise,
        activatedAt: new Date(),
        revokedAt: null,
        revokeReason: null,
      },
      create: {
        userId: user.id,
        noteId: note.id,
        status: "ACTIVE",
        source: "WALLET",
        amountPaise: pricePaise,
        activatedAt: new Date(),
      },
    });

    await tx.systemTransaction.create({
      data: {
        amount: pricePaise,
        currency: "INR",
        status: "SUCCESS",
        method: "wallet",
        providerOrderId: `wallet_${debit.transaction.id}`,
        type: "NOTE_PURCHASE",
        description: `Notes: ${note.title}`,
        userId: user.id,
        metadata: { noteId: note.id, entitlementId: entitlement.id, walletTransactionId: debit.transaction.id },
      },
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        title: "Notes unlocked",
        message: `"${note.title}" is now in My Notes.`,
        type: "Course",
        data: { noteId: note.id, action: "note_purchased" },
      },
    });

    return { entitlement, slug: note.slug };
  });
}

/** Admin: give a user access (support, scholarships, offline payments). */
export async function grantNoteAccess(adminId: string, noteId: string, email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true } });
  if (!user) throw new NotePurchaseError("No user with that email.");
  return prisma.noteEntitlement.upsert({
    where: { userId_noteId: { userId: user.id, noteId } },
    update: { status: "ACTIVE", source: "ADMIN_GRANT", grantedById: adminId, activatedAt: new Date(), revokedAt: null, revokeReason: null },
    create: { userId: user.id, noteId, status: "ACTIVE", source: "ADMIN_GRANT", grantedById: adminId, activatedAt: new Date() },
  });
}

/** Admin: remove access without moving money. */
export async function revokeNoteAccess(entitlementId: string, reason: string) {
  return prisma.noteEntitlement.update({
    where: { id: entitlementId },
    data: { status: "REVOKED", revokedAt: new Date(), revokeReason: reason.slice(0, 500) },
  });
}

/**
 * Admin: refund a purchase and remove access. Razorpay purchases are refunded to the
 * original payment method; wallet purchases go back to the wallet.
 */
export async function refundNotePurchase(entitlementId: string, reason: string) {
  const ent = await prisma.noteEntitlement.findUnique({ where: { id: entitlementId } });
  if (!ent || ent.status !== "ACTIVE") throw new NotePurchaseError("Only active purchases can be refunded.");
  if (ent.source !== "PURCHASE" && ent.source !== "WALLET") throw new NotePurchaseError("Only paid purchases can be refunded.");
  if (ent.amountPaise <= 0) throw new NotePurchaseError("Nothing was paid for this access.");

  if (ent.source === "PURCHASE") {
    if (!ent.razorpayPaymentId) throw new NotePurchaseError("No Razorpay payment is recorded for this purchase.");
    const { getRazorpayInstance } = await import("@/lib/razorpay");
    const razorpay = await getRazorpayInstance();
    // Razorpay rejects a second refund beyond the captured amount, so a retry cannot double-refund.
    await razorpay.payments.refund(ent.razorpayPaymentId, {
      amount: ent.amountPaise,
      notes: { entitlementId: ent.id, reason: reason.slice(0, 200) },
    });
  }

  await prisma.$transaction(async (tx) => {
    const claimed = await tx.noteEntitlement.updateMany({
      where: { id: ent.id, status: "ACTIVE" },
      data: { status: "REFUNDED", revokedAt: new Date(), revokeReason: reason.slice(0, 500) },
    });
    if (claimed.count !== 1) return;

    if (ent.source === "WALLET") {
      await creditToWallet(ent.userId, ent.amountPaise / 100, "REFUND", "Notes refund", { entitlementId: ent.id }, tx);
    }
    await tx.systemTransaction.updateMany({
      where: { type: "NOTE_PURCHASE", userId: ent.userId, status: "SUCCESS", metadata: { path: "$.entitlementId", equals: ent.id } },
      data: { status: "REFUNDED" },
    });
  });
}
