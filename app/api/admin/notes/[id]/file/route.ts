import { NextResponse } from "next/server";
import { adminGuard } from "@/app/api/admin/_lib/guard";
import { uploadNoteVersion, NoteAdminError } from "@/lib/notes/admin";
import { MAX_NOTE_PDF_BYTES } from "@/lib/notes/validation";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/** Upload a new PDF for a note. It becomes the current version; older ones are kept. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;
  const { id } = await params;

  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > MAX_NOTE_PDF_BYTES + 1024 * 1024) {
    return NextResponse.json({ error: "The PDF is too large." }, { status: 413 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a PDF to upload." }, { status: 400 });
    }
    const changelog = typeof form.get("changelog") === "string" ? String(form.get("changelog")) : undefined;
    const bytes = Buffer.from(await file.arrayBuffer());
    const version = await uploadNoteVersion(id, guard.userId, bytes, changelog);
    return NextResponse.json({ version: version.version, pageCount: version.pageCount, fileSize: version.fileSize });
  } catch (err) {
    if (err instanceof NoteAdminError) {
      return NextResponse.json({ error: err.message, field: err.field }, { status: 400 });
    }
    logger.error("NOTE_UPLOAD_ERROR", err as Error, guard.userId);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
