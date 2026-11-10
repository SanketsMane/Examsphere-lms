import { NextResponse } from "next/server";
import { adminGuard } from "@/app/api/admin/_lib/guard";
import { setNoteCover, NoteAdminError } from "@/lib/notes/admin";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;
  const { id } = await params;

  try {
    const form = await req.formData();
    const file = form.get("cover");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose an image." }, { status: 400 });
    }
    await setNoteCover(id, Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof NoteAdminError) {
      return NextResponse.json({ error: err.message, field: err.field }, { status: 400 });
    }
    logger.error("NOTE_COVER_ERROR", err as Error, guard.userId);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
