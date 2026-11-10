import { NextResponse } from "next/server";
import { adminGuard } from "@/app/api/admin/_lib/guard";
import { prisma } from "@/lib/db";
import { noteDocSchema, renderStyleSchema } from "@/lib/notes/ai/doc-schema";
import { renderNoteHtml } from "@/lib/notes/ai/render-html";

export const dynamic = "force-dynamic";

/** Live preview of a draft as handwritten notes (HTML shown in a sandboxed iframe). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const doc = noteDocSchema.safeParse(body?.doc);
  const style = renderStyleSchema.safeParse(body?.style ?? {});
  if (!doc.success || !style.success) return NextResponse.json({ error: "Invalid draft" }, { status: 400 });
  const note = await prisma.note.findUnique({ where: { id }, select: { program: true, subject: true, language: true } });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const html = renderNoteHtml(doc.data, style.data, note);
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:; sandbox",
    },
  });
}
