import { NextResponse } from "next/server";
import { adminGuard } from "@/app/api/admin/_lib/guard";
import { generationOptionsSchema } from "@/lib/notes/ai/doc-schema";
import { createGenerateJob, createRerunJob } from "@/lib/notes/ai/jobs";
import { aiErrorResponse, jobView } from "@/lib/notes/ai/route-helpers";

export const dynamic = "force-dynamic";

/**
 * Start AI generation.
 *  - multipart/form-data: files (one or more), options (JSON), rights ("yes")
 *  - application/json: { fromJobId, options } to re-run on the same sources with new options
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;
  const { id } = await params;

  try {
    if ((req.headers.get("content-type") || "").includes("application/json")) {
      const body = await req.json().catch(() => null);
      const options = generationOptionsSchema.safeParse(body?.options ?? {});
      if (!options.success || typeof body?.fromJobId !== "string") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      const job = await createRerunJob({ fromJobId: body.fromJobId, adminId: guard.userId, options: options.data });
      if (job.noteId !== id) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      return NextResponse.json({ job: jobView(job) });
    }

    const form = await req.formData();
    if (form.get("rights") !== "yes") {
      return NextResponse.json({ error: "Confirm you have the right to use this material." }, { status: 400 });
    }
    let rawOptions: unknown = {};
    try {
      rawOptions = JSON.parse(String(form.get("options") ?? "{}"));
    } catch {
      return NextResponse.json({ error: "Invalid options" }, { status: 400 });
    }
    const options = generationOptionsSchema.safeParse(rawOptions);
    if (!options.success) return NextResponse.json({ error: "Invalid options" }, { status: 400 });

    const files = [];
    for (const f of form.getAll("files")) {
      if (f instanceof File) files.push({ name: f.name || "upload", bytes: Buffer.from(await f.arrayBuffer()) });
    }
    const { job, pages } = await createGenerateJob({ noteId: id, adminId: guard.userId, files, options: options.data });
    return NextResponse.json({ job: jobView(job), pages });
  } catch (err) {
    return aiErrorResponse(err, "NOTES_AI_START_ERROR");
  }
}
