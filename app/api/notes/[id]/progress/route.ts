import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authorizeReader } from "@/lib/notes/request";

export const dynamic = "force-dynamic";

/** Remember the last page read, so the reader can continue where they left off. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const page = Number(body?.page);
  if (!Number.isInteger(page) || page < 1 || page > 100_000) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }

  const auth = await authorizeReader(req, id, "progress", 120);
  if (!auth.ok) return auth.response;
  if (!auth.entitlement) return NextResponse.json({ ok: true }); // admin preview

  const lastPage = Math.min(page, auth.version.pageCount);
  await prisma.noteEntitlement.update({
    where: { id: auth.entitlement.id },
    data: { lastReadPage: lastPage, lastReadAt: new Date() },
  });
  return NextResponse.json({ ok: true, lastReadPage: lastPage });
}
