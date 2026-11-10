import { NextResponse } from "next/server";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { loadNote } from "@/lib/notes/request";
import { getPrivateStorage } from "@/lib/storage/private-storage";

export const dynamic = "force-dynamic";

/** Cover image. Public for published notes; admins can see drafts. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = await loadNote(id);
  if (!note?.coverKey) return new NextResponse(null, { status: 404 });

  if (note.status !== "PUBLISHED") {
    const session = await getSessionWithRole();
    if (session?.user?.role !== "admin") return new NextResponse(null, { status: 404 });
  }

  const bytes = await getPrivateStorage().get(note.coverKey);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "image/webp",
      // The key changes whenever the cover changes, and the URL carries it as ?v=.
      "Cache-Control": note.status === "PUBLISHED" ? "public, max-age=86400" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
