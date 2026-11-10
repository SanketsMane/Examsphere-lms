import "server-only";

import sharp from "sharp";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getPrivateStorage } from "@/lib/storage/private-storage";
import { buildPreviewPdf, inspectPdf, NotePdfError } from "@/lib/notes/pdf";
import { noteKeys } from "@/lib/notes/content";
import { MAX_COVER_BYTES, type NoteFormValues } from "@/lib/notes/validation";

/** Admin-side operations on notes. Callers must already have checked requireAdmin(). */

export class NoteAdminError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
  }
}

function toData(v: NoteFormValues) {
  const isPaid = v.accessType === "PAID";
  return {
    title: v.title,
    slug: v.slug,
    shortDescription: v.shortDescription || null,
    description: v.description || null,
    program: v.program || null,
    subject: v.subject || null,
    chapter: v.chapter || null,
    language: v.language,
    accessType: v.accessType,
    pricePaise: isPaid ? v.priceRupees * 100 : 0,
    discountPricePaise: isPaid && v.discountPriceRupees ? v.discountPriceRupees * 100 : null,
    previewPages: v.previewPages,
    allowDownload: v.allowDownload,
    maxDownloads: v.maxDownloads,
    isFeatured: v.isFeatured,
  };
}

function rethrowSlug(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    throw new NoteAdminError("That URL slug is already used by another note.", "slug");
  }
  throw err;
}

export async function createNote(authorId: string, values: NoteFormValues) {
  try {
    return await prisma.note.create({ data: { ...toData(values), authorId, status: "DRAFT" } });
  } catch (err) {
    rethrowSlug(err);
  }
}

export async function updateNote(noteId: string, values: NoteFormValues) {
  const before = await prisma.note.findUnique({ where: { id: noteId }, include: { currentVersion: true } });
  if (!before) throw new NoteAdminError("Note not found.");

  const data = toData(values);
  if (before.status === "PUBLISHED") assertPublishable(data, !!before.currentVersion);

  let note;
  try {
    note = await prisma.note.update({ where: { id: noteId }, data });
  } catch (err) {
    rethrowSlug(err);
  }

  // The preview is a cut of the current PDF, so rebuild it when the page count changes.
  if (before.currentVersion && before.previewPages !== values.previewPages) {
    await rebuildPreview(before.currentVersion.id);
  }
  return note;
}

async function rebuildPreview(versionId: string) {
  const version = await prisma.noteVersion.findUniqueOrThrow({ where: { id: versionId }, include: { note: true } });
  const storage = getPrivateStorage();
  const master = await storage.get(version.fileKey);
  const preview = await buildPreviewPdf(master, version.note.previewPages);
  const previewKey = noteKeys.preview(version.noteId, version.version);
  if (preview) await storage.put(previewKey, preview, "application/pdf");
  else await storage.delete(previewKey);
  await prisma.noteVersion.update({ where: { id: versionId }, data: { previewKey: preview ? previewKey : null } });
}

/** Store a new PDF as the next version and make it current. */
export async function uploadNoteVersion(
  noteId: string,
  adminId: string,
  bytes: Buffer,
  changelog?: string,
  extra: { origin?: "UPLOAD" | "AI"; contentJson?: unknown } = {}
) {
  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note) throw new NoteAdminError("Note not found.");

  let info;
  try {
    info = await inspectPdf(bytes);
  } catch (err) {
    if (err instanceof NotePdfError) throw new NoteAdminError(err.message, "file");
    throw err;
  }

  const last = await prisma.noteVersion.findFirst({ where: { noteId }, orderBy: { version: "desc" }, select: { version: true } });
  const version = (last?.version ?? 0) + 1;
  const storage = getPrivateStorage();
  const fileKey = noteKeys.master(noteId, version, info.sha256);
  await storage.put(fileKey, bytes, "application/pdf");

  const preview = await buildPreviewPdf(bytes, note.previewPages);
  const previewKey = preview ? noteKeys.preview(noteId, version) : null;
  if (preview && previewKey) await storage.put(previewKey, preview, "application/pdf");

  return prisma.$transaction(async (tx) => {
    const created = await tx.noteVersion.create({
      data: {
        noteId,
        version,
        fileKey,
        previewKey,
        fileSize: info.size,
        pageCount: info.pageCount,
        sha256: info.sha256,
        origin: extra.origin ?? "UPLOAD",
        contentJson: extra.contentJson === undefined ? undefined : (extra.contentJson as Prisma.InputJsonValue),
        changelog: changelog?.slice(0, 1000) || null,
        createdById: adminId,
      },
    });
    await tx.note.update({ where: { id: noteId }, data: { currentVersionId: created.id } });
    return created;
  });
}

/** Re-encode to WebP: normalises the image and strips metadata or anything hidden in it. */
export async function setNoteCover(noteId: string, bytes: Buffer) {
  if (bytes.length === 0 || bytes.length > MAX_COVER_BYTES) {
    throw new NoteAdminError("Cover must be an image under 5 MB.", "cover");
  }
  let webp: Buffer;
  try {
    webp = await sharp(bytes, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 1200, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new NoteAdminError("Cover must be a JPEG, PNG or WebP image.", "cover");
  }

  const note = await prisma.note.findUnique({ where: { id: noteId }, select: { coverKey: true } });
  if (!note) throw new NoteAdminError("Note not found.");
  const storage = getPrivateStorage();
  const key = noteKeys.cover(noteId, "webp");
  await storage.put(key, webp, "image/webp");
  await prisma.note.update({ where: { id: noteId }, data: { coverKey: key } });
  if (note.coverKey) await storage.delete(note.coverKey).catch(() => {});
  return key;
}

function assertPublishable(
  note: { accessType: string; pricePaise: number },
  hasFile: boolean
) {
  if (!hasFile) throw new NoteAdminError("Upload the notes PDF before publishing.", "file");
  if (note.accessType === "PAID" && note.pricePaise < 100) {
    throw new NoteAdminError("A paid note needs a price of at least ₹1.", "priceRupees");
  }
}

export async function setNoteStatus(noteId: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note) throw new NoteAdminError("Note not found.");
  if (status === "PUBLISHED") {
    assertPublishable(note, !!note.currentVersionId);
    if (note.accessType === "COURSE_ONLY") {
      const links = await prisma.courseNote.count({ where: { noteId, includedWithCourse: true } });
      if (links === 0) throw new NoteAdminError("Link at least one course before publishing course-only notes.");
    }
  }
  return prisma.note.update({
    where: { id: noteId },
    data: { status, publishedAt: status === "PUBLISHED" ? note.publishedAt ?? new Date() : note.publishedAt },
  });
}

export async function setCourseLinks(noteId: string, links: { courseId: string; includedWithCourse: boolean }[]) {
  const unique = Array.from(new Map(links.map((l) => [l.courseId, l])).values());
  await prisma.$transaction(async (tx) => {
    await tx.courseNote.deleteMany({ where: { noteId, courseId: { notIn: unique.map((l) => l.courseId) } } });
    for (const [i, l] of unique.entries()) {
      await tx.courseNote.upsert({
        where: { courseId_noteId: { courseId: l.courseId, noteId } },
        update: { includedWithCourse: l.includedWithCourse, sortOrder: i },
        create: { courseId: l.courseId, noteId, includedWithCourse: l.includedWithCourse, sortOrder: i },
      });
    }
  });
}

/** Delete only notes nobody has paid for; anything sold must be archived instead. */
export async function deleteNote(noteId: string) {
  const paid = await prisma.noteEntitlement.count({ where: { noteId, source: { in: ["PURCHASE", "WALLET"] } } });
  if (paid > 0) throw new NoteAdminError("These notes have been sold. Archive them instead of deleting.");

  const note = await prisma.note.findUnique({ where: { id: noteId }, include: { versions: true } });
  if (!note) return;
  const storage = getPrivateStorage();
  const keys = [note.coverKey, ...note.versions.flatMap((v) => [v.fileKey, v.previewKey])].filter(Boolean) as string[];
  await prisma.note.update({ where: { id: noteId }, data: { currentVersionId: null } });
  await prisma.note.delete({ where: { id: noteId } });
  await Promise.all(keys.map((k) => storage.delete(k).catch(() => {})));
}
