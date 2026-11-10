import { NextResponse } from "next/server";
import { adminGuard } from "@/app/api/admin/_lib/guard";
import { renderStyleSchema } from "@/lib/notes/ai/doc-schema";
import { createRenderJob } from "@/lib/notes/ai/jobs";
import { aiErrorResponse, jobView, loadNoteJob } from "@/lib/notes/ai/route-helpers";

export const dynamic = "force-dynamic";

/** Queue "turn this draft into a PDF version of the note". */
export async function POST(req: Request, { params }: { params: Promise<{ id: string; jobId: string }> }) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;
  const { id, jobId } = await params;
  const job = await loadNoteJob(id, jobId);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const style = renderStyleSchema.safeParse(body?.style ?? {});
  if (!style.success) return NextResponse.json({ error: "Invalid style" }, { status: 400 });
  try {
    const render = await createRenderJob({ sourceJobId: jobId, adminId: guard.userId, style: style.data });
    return NextResponse.json({ job: jobView(render) });
  } catch (err) {
    return aiErrorResponse(err, "NOTES_AI_RENDER_ERROR");
  }
}
