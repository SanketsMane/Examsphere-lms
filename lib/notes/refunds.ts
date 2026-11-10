import "server-only";

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getNotesSettings, refundEligibility } from "@/lib/notes/settings";
import { NotePurchaseError, refundNotePurchase } from "@/lib/notes/purchase";

/** Student asks for a refund. Checked against the refund policy; may be auto-approved. */
export async function requestNoteRefund(userId: string, noteId: string, reason: string) {
  const ent = await prisma.noteEntitlement.findUnique({
    where: { userId_noteId: { userId, noteId } },
    include: { refundRequest: true, note: { select: { title: true, currentVersion: { select: { pageCount: true } } } } },
  });
  if (!ent) throw new NotePurchaseError("You haven't bought these notes.");

  const settings = await getNotesSettings();
  const check = refundEligibility(ent, ent.note.currentVersion?.pageCount ?? 1, settings);
  if (!check.eligible) throw new NotePurchaseError(check.reason);

  const cleanReason = reason.trim().slice(0, 1000) || "No reason given";
  const request = await prisma.noteRefundRequest.upsert({
    where: { entitlementId: ent.id },
    update: { status: "PENDING", reason: cleanReason, adminNote: null, decidedAt: null, decidedById: null },
    create: { entitlementId: ent.id, userId, noteId, reason: cleanReason },
  });

  if (settings.autoApproveRefunds) {
    await decideNoteRefund(request.id, true, null, "Approved automatically (within refund policy)");
    return { status: "APPROVED" as const };
  }

  await notifyAdmin(ent.note.title, cleanReason).catch((e) => logger.warn("Refund request email failed", { error: String(e) }));
  return { status: "PENDING" as const };
}

/** Admin (or auto-approval) decides a refund request. Approval refunds the money and removes access. */
export async function decideNoteRefund(requestId: string, approve: boolean, adminId: string | null, adminNote?: string) {
  const req = await prisma.noteRefundRequest.findUnique({ where: { id: requestId }, include: { note: { select: { title: true } } } });
  if (!req) throw new NotePurchaseError("Refund request not found.");
  if (req.status !== "PENDING") throw new NotePurchaseError("This request has already been decided.");

  if (approve) {
    await refundNotePurchase(req.entitlementId, `Refund request: ${req.reason}`.slice(0, 500));
  }
  await prisma.noteRefundRequest.update({
    where: { id: requestId },
    data: { status: approve ? "APPROVED" : "REJECTED", adminNote: adminNote?.slice(0, 1000) ?? null, decidedById: adminId, decidedAt: new Date() },
  });
  await prisma.notification.create({
    data: {
      userId: req.userId,
      title: approve ? "Refund approved" : "Refund request declined",
      message: approve
        ? `Your refund for "${req.note.title}" has been processed.`
        : `Your refund request for "${req.note.title}" was declined.${adminNote ? ` ${adminNote}` : ""}`,
      type: "Course",
      data: { noteId: req.noteId, action: approve ? "note_refunded" : "note_refund_declined" },
    },
  });
}

async function notifyAdmin(title: string, reason: string) {
  const to = process.env.ADMIN_EMAIL;
  if (!to) return;
  const { sendEmail } = await import("@/lib/email");
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  await sendEmail({
    to,
    subject: `Notes refund request: ${title}`,
    html: `<p>A student asked for a refund on <strong>${esc(title)}</strong>.</p><p>Reason: ${esc(reason)}</p><p>Review it under Admin &rarr; Notes &rarr; Refund requests.</p>`,
  });
}
