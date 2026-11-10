import "server-only";

import type { NotesSettings } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Single-row settings for the notes module (refund policy, AI). Created with defaults on first read. */
export async function getNotesSettings(): Promise<NotesSettings> {
  return prisma.notesSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
}

export async function updateNotesSettings(data: Partial<Omit<NotesSettings, "id" | "updatedAt">>) {
  return prisma.notesSettings.upsert({ where: { id: "default" }, update: data, create: { id: "default", ...data } });
}

/** Plain-language refund policy shown to students before and after purchase. */
export function describeRefundPolicy(s: Pick<NotesSettings, "refundWindowHours" | "refundMaxReadPercent" | "refundRequiresNoDownload">) {
  if (s.refundWindowHours <= 0) return "Digital notes are non-refundable once purchased.";
  const window = s.refundWindowHours % 24 === 0 ? `${s.refundWindowHours / 24} day${s.refundWindowHours === 24 ? "" : "s"}` : `${s.refundWindowHours} hours`;
  const conditions = [`you've read no more than ${s.refundMaxReadPercent}% of the pages`];
  if (s.refundRequiresNoDownload) conditions.push("haven't downloaded the PDF");
  return `Refund available within ${window} of purchase if ${conditions.join(" and ")}.`;
}

export type RefundEligibility =
  | { eligible: true; deadline: Date }
  | { eligible: false; reason: string };

export function refundEligibility(
  ent: {
    status: string;
    source: string;
    amountPaise: number;
    activatedAt: Date | null;
    maxReadPage: number | null;
    downloadCount: number;
    refundRequest?: { status: string } | null;
  },
  pageCount: number,
  s: Pick<NotesSettings, "refundWindowHours" | "refundMaxReadPercent" | "refundRequiresNoDownload">,
  now = new Date()
): RefundEligibility {
  if (ent.refundRequest?.status === "PENDING") return { eligible: false, reason: "Your refund request is being reviewed." };
  if (ent.refundRequest?.status === "REJECTED") return { eligible: false, reason: "Your refund request was declined." };
  if (s.refundWindowHours <= 0) return { eligible: false, reason: "These notes are non-refundable." };
  if (ent.status !== "ACTIVE" || (ent.source !== "PURCHASE" && ent.source !== "WALLET") || ent.amountPaise <= 0) {
    return { eligible: false, reason: "Only paid purchases can be refunded." };
  }
  const start = ent.activatedAt ?? now;
  const deadline = new Date(start.getTime() + s.refundWindowHours * 3_600_000);
  if (now > deadline) return { eligible: false, reason: "The refund window has ended." };
  const readPercent = ent.maxReadPage ? (ent.maxReadPage / Math.max(1, pageCount)) * 100 : 0;
  if (readPercent > s.refundMaxReadPercent) {
    return { eligible: false, reason: `More than ${s.refundMaxReadPercent}% of the notes have been read.` };
  }
  if (s.refundRequiresNoDownload && ent.downloadCount > 0) {
    return { eligible: false, reason: "The PDF has been downloaded." };
  }
  return { eligible: true, deadline };
}

/** Estimated AI spend so far this calendar month (UTC), in US dollars. */
export async function aiSpendThisMonthUsd(): Promise<number> {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const r = await prisma.noteGenerationJob.aggregate({ where: { createdAt: { gte: start } }, _sum: { costUsdMicros: true } });
  return (r._sum.costUsdMicros ?? 0) / 1_000_000;
}
