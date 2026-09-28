import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/auth/require-roles";
import { INQUIRY_STATUSES } from "../constants";

export const dynamic = "force-dynamic";

// Inquiry fields are visitor-supplied. A leading = + - @ (or tab/CR) makes Excel and
// Sheets evaluate the cell as a formula, so prefix a quote to force plain text.
const cell = (v: unknown) => {
  let text = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const q = (searchParams.get("q") || "").trim();
  const where: any = {};
  if (INQUIRY_STATUSES.includes(status as any)) where.status = status;
  // Same filter as the list page, so the export matches what the admin is looking at.
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
    ];
  }

  const items = await prisma.chatInquiry.findMany({ where, orderBy: { createdAt: "desc" } });

  const header = [
    "Name",
    "Email",
    "Phone",
    "Status",
    "Source",
    "Messages",
    "Received",
    "Last Activity",
    "IP",
    "Notes",
  ];
  const rows = items.map((i) =>
    [
      i.name,
      i.email,
      i.phone,
      i.status,
      i.source,
      i.messageCount,
      i.createdAt.toISOString(),
      i.lastMessageAt?.toISOString() || "",
      i.ipAddress || "",
      i.notes || "",
    ]
      .map(cell)
      .join(",")
  );

  // Prepend BOM so Excel opens UTF-8 correctly.
  const csv = "﻿" + [header.map(cell).join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
