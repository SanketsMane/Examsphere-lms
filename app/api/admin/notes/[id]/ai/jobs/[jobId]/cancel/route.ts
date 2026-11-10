import { NextResponse } from "next/server";
import { adminGuard } from "@/app/api/admin/_lib/guard";
import { prisma } from "@/lib/db";
import { cancelJob } from "@/lib/notes/ai/jobs";
import { loadNoteJob } from "@/lib/notes/ai/route-helpers";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string; jobId: string }> }) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;
  const { id, jobId } = await params;
  const job = await loadNoteJob(id, jobId);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await cancelJob(jobId);
  await prisma.note.updateMany({ where: { id, status: "PROCESSING" }, data: { status: "DRAFT" } });
  return NextResponse.json({ ok: true });
}
