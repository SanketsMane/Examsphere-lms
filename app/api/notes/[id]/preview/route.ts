import { NextResponse } from "next/server";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { getPrivateStorage } from "@/lib/storage/private-storage";
import { loadNote, logNoteEvent } from "@/lib/notes/request";
import { pdfResponse } from "@/lib/notes/content";

export const dynamic = "force-dynamic";

/** The free sample (first N pages, stamped PREVIEW). No sign-in needed for published notes. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = await loadNote(id);
  const previewKey = note?.currentVersion?.previewKey;
  if (!note || !previewKey) return NextResponse.json({ error: "No preview available" }, { status: 404 });

  const session = await getSessionWithRole();
  if (note.status !== "PUBLISHED" && session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No preview available" }, { status: 404 });
  }

  const bytes = await getPrivateStorage().get(previewKey);
  await logNoteEvent(note.id, session?.user?.id ?? null, "PREVIEW");
  return pdfResponse(bytes, { filename: `${note.slug}-preview.pdf`, download: false, cache: note.status === "PUBLISHED" ? "public" : "private" });
}
