import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { adminGuard } from "@/app/api/admin/_lib/guard";
import { prisma } from "@/lib/db";
import { noteDocSchema } from "@/lib/notes/ai/doc-schema";
import { jobView, loadNoteJob } from "@/lib/notes/ai/route-helpers";

export const dynamic = "force-dynamic";

/** Job status (polled by the admin UI); includes the draft once it is ready. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; jobId: string }> }) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;
  const { id, jobId } = await params;
  const job = await loadNoteJob(id, jobId);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sources = await prisma.noteSource.findMany({
    where: { jobId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, originalName: true, kind: true, pageCount: true, size: true },
  });
  return NextResponse.json({
    job: jobView(job),
    draft: job.status === "REVIEW" || job.status === "DONE" ? job.draftDoc : null,
    issues: job.reviewIssues ?? [],
    sources,
  });
}

/** Save the edited draft. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string; jobId: string }> }) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;
  const { id, jobId } = await params;
  const job = await loadNoteJob(id, jobId);
  if (!job || job.type !== "GENERATE" || !["REVIEW", "DONE"].includes(job.status)) {
    return NextResponse.json({ error: "This draft can't be edited now." }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const doc = noteDocSchema.safeParse(body?.doc);
  if (!doc.success) return NextResponse.json({ error: "The draft is not valid." }, { status: 400 });
  if (JSON.stringify(doc.data).length > 2_000_000) return NextResponse.json({ error: "The draft is too large." }, { status: 413 });

  await prisma.noteGenerationJob.update({
    where: { id: jobId },
    data: {
      draftDoc: doc.data as unknown as Prisma.InputJsonValue,
      ...(Array.isArray(body?.issues) ? { reviewIssues: body.issues.slice(0, 500) as Prisma.InputJsonValue } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}
