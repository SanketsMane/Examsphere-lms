import { NextResponse } from "next/server";
import { adminGuard } from "@/app/api/admin/_lib/guard";
import { prisma } from "@/lib/db";
import { getPrivateStorage } from "@/lib/storage/private-storage";

export const dynamic = "force-dynamic";

/** The original uploaded page/PDF, so the admin can compare the draft with the source. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; sourceId: string }> }) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;
  const { id, sourceId } = await params;
  const source = await prisma.noteSource.findUnique({ where: { id: sourceId }, include: { job: { select: { noteId: true } } } });
  if (!source || source.job.noteId !== id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bytes = await getPrivateStorage().get(source.fileKey);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": source.mimeType,
      "Content-Disposition": `inline; filename="${source.originalName.replace(/[^A-Za-z0-9._-]+/g, "-")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; sandbox",
    },
  });
}
