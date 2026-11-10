import { NextResponse } from "next/server";
import { authorizeReader } from "@/lib/notes/request";

export const dynamic = "force-dynamic";

/**
 * "Add to My Notes" for free (or course-included) notes. Access itself is checked the
 * same way as reading; this just records the reader so they show up in My Notes.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorizeReader(req, id, "claim", 20);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ ok: true, slug: auth.note.slug, via: auth.access.via });
}
