import "server-only";

import { NextResponse } from "next/server";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { prisma } from "@/lib/db";
import { getClientIP, protectGeneral } from "@/lib/security";
import { getNoteAccess, ensureReaderEntitlement, type NoteAccess } from "@/lib/notes/access";

/** Shared plumbing for the /api/notes/[id]/* content routes. */

export async function loadNote(id: string) {
  if (!/^[a-z0-9]{10,40}$/i.test(id)) return null;
  return prisma.note.findUnique({ where: { id }, include: { currentVersion: true } });
}

export type LoadedNote = NonNullable<Awaited<ReturnType<typeof loadNote>>>;

const DENIED: Record<Extract<NoteAccess, { allowed: false }>["reason"], [number, string]> = {
  NOT_FOUND: [404, "Notes not found"],
  NOT_SIGNED_IN: [401, "Please sign in"],
  NEEDS_PURCHASE: [403, "Buy these notes to read them"],
  COURSE_ONLY: [403, "These notes come with a course"],
  REVOKED: [403, "Access to these notes was removed"],
};

/**
 * Resolve the signed-in reader and check access. On success returns everything a
 * content route needs, including the reader's entitlement (created for free/course readers).
 */
export async function authorizeReader(req: Request, id: string, rateKey: string, maxPerMinute: number) {
  const session = await getSessionWithRole();
  const user = session?.user ?? null;

  const ip = getClientIP(req) || "unknown";
  const limit = await protectGeneral(req, `${user?.id ?? ip}:notes:${rateKey}`, { maxRequests: maxPerMinute, windowMs: 60_000 });
  if (!limit.success) {
    return { ok: false as const, response: NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 }) };
  }

  const note = await loadNote(id);
  const access = await getNoteAccess(user, note);
  if (!access.allowed) {
    const [status, error] = DENIED[access.reason];
    return { ok: false as const, response: NextResponse.json({ error, reason: access.reason }, { status }) };
  }
  if (!note!.currentVersion) {
    return { ok: false as const, response: NextResponse.json({ error: "No file has been uploaded yet" }, { status: 404 }) };
  }

  const entitlement = await ensureReaderEntitlement(user!.id, note!.id, access);
  return { ok: true as const, user: user!, note: note!, version: note!.currentVersion, access, entitlement };
}

export function logNoteEvent(noteId: string, userId: string | null, type: "VIEW" | "PREVIEW" | "DOWNLOAD", page?: number) {
  // Analytics must never break reading.
  return prisma.noteEvent.create({ data: { noteId, userId, type, page: page ?? null } }).catch(() => {});
}
