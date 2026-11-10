import { NextResponse } from "next/server";
import { authorizeReader, logNoteEvent } from "@/lib/notes/request";
import { getWatermarkedPdf, pdfResponse } from "@/lib/notes/content";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/** The reader's personal, watermarked copy, shown in the in-app viewer. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const auth = await authorizeReader(req, id, "read", 30);
    if (!auth.ok) return auth.response;

    const reference = auth.entitlement ? auth.entitlement.id.slice(-8).toUpperCase() : "ADMIN";
    const bytes = await getWatermarkedPdf(auth.version, { userId: auth.user.id, email: auth.user.email, reference }, auth.note.title);
    await logNoteEvent(auth.note.id, auth.user.id, "VIEW");
    return pdfResponse(bytes, { filename: `${auth.note.slug}.pdf`, download: false, cache: "private" });
  } catch (err) {
    logger.error("NOTE_READ_ERROR", err as Error);
    return NextResponse.json({ error: "Could not open these notes. Please try again." }, { status: 500 });
  }
}
