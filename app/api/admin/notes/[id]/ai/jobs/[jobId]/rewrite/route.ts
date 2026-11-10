import { NextResponse } from "next/server";
import { adminGuard } from "@/app/api/admin/_lib/guard";
import { noteSectionSchema } from "@/lib/notes/ai/doc-schema";
import { rewriteDraftSection } from "@/lib/notes/ai/pipeline";
import { aiErrorResponse, loadNoteJob } from "@/lib/notes/ai/route-helpers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Ask the AI to rewrite one section of the draft. Returns the new section; the client saves it. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string; jobId: string }> }) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;
  const { id, jobId } = await params;
  const job = await loadNoteJob(id, jobId);
  if (!job || job.type !== "GENERATE" || job.status !== "REVIEW") {
    return NextResponse.json({ error: "Only drafts under review can be rewritten." }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const section = noteSectionSchema.safeParse(body?.section);
  const instruction = typeof body?.instruction === "string" ? body.instruction.trim() : "";
  if (!section.success || !instruction) return NextResponse.json({ error: "Say what to change." }, { status: 400 });

  try {
    const rewritten = await rewriteDraftSection({ jobId, sectionIndex: Number(body.sectionIndex) || 0, instruction, section: section.data });
    return NextResponse.json({ section: rewritten });
  } catch (err) {
    return aiErrorResponse(err, "NOTES_AI_REWRITE_ERROR");
  }
}
