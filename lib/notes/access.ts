import "server-only";

import type { Note, NoteEntitlement } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * The single place that decides whether someone may read a note. Every route that
 * serves note content (reader, download, progress) goes through `getNoteAccess`.
 */

export type NoteViewer = { id: string; role?: string | null } | null | undefined;

export type NoteAccess =
  | {
      allowed: true;
      via: "ADMIN" | "ENTITLEMENT" | "COURSE" | "FREE";
      entitlement: NoteEntitlement | null;
    }
  | {
      allowed: false;
      reason: "NOT_FOUND" | "NOT_SIGNED_IN" | "NEEDS_PURCHASE" | "COURSE_ONLY" | "REVOKED";
      courses?: { id: string; title: string; slug: string }[];
    };

type AccessNote = Pick<Note, "id" | "status" | "accessType">;

/** Courses that include this note for enrolled students. */
export async function includingCourses(noteId: string) {
  const rows = await prisma.courseNote.findMany({
    where: { noteId, includedWithCourse: true, course: { status: "Published" } },
    select: { course: { select: { id: true, title: true, slug: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((r) => r.course);
}

async function hasCourseAccess(userId: string, noteId: string): Promise<boolean> {
  const hit = await prisma.enrollment.findFirst({
    where: {
      userId,
      status: "Active",
      Course: { notes: { some: { noteId, includedWithCourse: true } } },
    },
    select: { id: true },
  });
  return !!hit;
}

export async function getNoteAccess(viewer: NoteViewer, note: AccessNote | null): Promise<NoteAccess> {
  if (!note) return { allowed: false, reason: "NOT_FOUND" };
  if (viewer?.role === "admin") return { allowed: true, via: "ADMIN", entitlement: null };
  if (note.status !== "PUBLISHED") return { allowed: false, reason: "NOT_FOUND" };
  if (!viewer?.id) return { allowed: false, reason: "NOT_SIGNED_IN" };

  const entitlement = await prisma.noteEntitlement.findUnique({
    where: { userId_noteId: { userId: viewer.id, noteId: note.id } },
  });

  if (entitlement?.status === "REVOKED") return { allowed: false, reason: "REVOKED" };

  if (entitlement?.status === "ACTIVE") {
    // Course-sourced access only lasts while the enrollment does.
    if (entitlement.source !== "COURSE" || (await hasCourseAccess(viewer.id, note.id))) {
      return { allowed: true, via: "ENTITLEMENT", entitlement };
    }
  }

  if (await hasCourseAccess(viewer.id, note.id)) {
    return { allowed: true, via: "COURSE", entitlement: entitlement ?? null };
  }
  if (note.accessType === "FREE") {
    return { allowed: true, via: "FREE", entitlement: entitlement ?? null };
  }
  if (note.accessType === "COURSE_ONLY") {
    return { allowed: false, reason: "COURSE_ONLY", courses: await includingCourses(note.id) };
  }
  return { allowed: false, reason: "NEEDS_PURCHASE", courses: await includingCourses(note.id) };
}

/**
 * Free and course readers get an entitlement row the first time they open a note, so
 * they appear in the reader counts and reading progress can be saved. A Pending
 * purchase row is converted (its order id is kept, so a late payment is still recorded).
 */
export async function ensureReaderEntitlement(
  userId: string,
  noteId: string,
  access: Extract<NoteAccess, { allowed: true }>
): Promise<NoteEntitlement | null> {
  if (access.via === "ADMIN") return null;
  if (access.via === "ENTITLEMENT") return access.entitlement;

  const source = access.via === "COURSE" ? "COURSE" : "FREE";
  return prisma.noteEntitlement.upsert({
    where: { userId_noteId: { userId, noteId } },
    update: { status: "ACTIVE", source, activatedAt: new Date() },
    create: { userId, noteId, source, status: "ACTIVE", activatedAt: new Date() },
  });
}
