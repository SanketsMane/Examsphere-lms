import { adminGuard } from "@/app/api/admin/_lib/guard";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Spreadsheet apps execute cells starting with = + - @ as formulas; neutralise them. */
function cell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** CSV of everyone with access to notes (all notes, or ?noteId=...). */
export async function GET(req: Request) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const noteId = new URL(req.url).searchParams.get("noteId") || undefined;
  const rows = await prisma.noteEntitlement.findMany({
    where: { noteId, status: { not: "PENDING" } },
    orderBy: { createdAt: "desc" },
    take: 50_000,
    include: {
      note: { select: { title: true } },
      user: { select: { name: true, email: true, phoneNumber: true } },
    },
  });

  const header = ["Date", "Note", "Name", "Email", "Phone", "Access", "Status", "Amount (INR)", "Order ID", "Payment ID", "Last page read", "Downloads"];
  const lines = rows.map((r) =>
    [
      (r.activatedAt ?? r.createdAt).toISOString(),
      r.note.title,
      r.user.name,
      r.user.email,
      r.user.phoneNumber,
      r.source,
      r.status,
      (r.amountPaise / 100).toFixed(2),
      r.razorpayOrderId,
      r.razorpayPaymentId,
      r.lastReadPage,
      r.downloadCount,
    ]
      .map(cell)
      .join(",")
  );

  const csv = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="notes-sales-${stamp}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
