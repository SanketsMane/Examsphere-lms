import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authorizeReader, logNoteEvent } from "@/lib/notes/request";
import { getWatermarkedPdf, pdfResponse } from "@/lib/notes/content";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/** Download the watermarked PDF, if the note allows it, up to its download limit. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const auth = await authorizeReader(req, id, "download", 10);
    if (!auth.ok) return auth.response;
    const { note, user, entitlement } = auth;

    if (auth.access.via !== "ADMIN") {
      if (!note.allowDownload) {
        return NextResponse.json({ error: "These notes can be read online only." }, { status: 403 });
      }
      // Count the download atomically so parallel requests cannot exceed the limit.
      const counted = await prisma.noteEntitlement.updateMany({
        where: { id: entitlement!.id, downloadCount: { lt: note.maxDownloads } },
        data: { downloadCount: { increment: 1 } },
      });
      if (counted.count !== 1) {
        return NextResponse.json(
          { error: `You have used all ${note.maxDownloads} downloads. You can still read online.` },
          { status: 403 }
        );
      }
    }

    const reference = entitlement ? entitlement.id.slice(-8).toUpperCase() : "ADMIN";
    const bytes = await getWatermarkedPdf(auth.version, { userId: user.id, email: user.email, reference }, note.title);
    await logNoteEvent(note.id, user.id, "DOWNLOAD");
    return pdfResponse(bytes, { filename: `${note.slug}.pdf`, download: true, cache: "private" });
  } catch (err) {
    logger.error("NOTE_DOWNLOAD_ERROR", err as Error);
    return NextResponse.json({ error: "Download failed. Please try again." }, { status: 500 });
  }
}
