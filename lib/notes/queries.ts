import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Read-side queries for notes pages. */

export const noteCardSelect = {
  id: true,
  slug: true,
  title: true,
  shortDescription: true,
  program: true,
  subject: true,
  chapter: true,
  language: true,
  coverKey: true,
  accessType: true,
  pricePaise: true,
  discountPricePaise: true,
  isFeatured: true,
  currentVersion: { select: { pageCount: true } },
} satisfies Prisma.NoteSelect;

export type NoteCardData = Prisma.NoteGetPayload<{ select: typeof noteCardSelect }>;

export function coverUrl(note: { id: string; coverKey: string | null }) {
  if (!note.coverKey) return null;
  // The key changes with every new cover, so it doubles as a cache-buster.
  return `/api/notes/${note.id}/cover?v=${encodeURIComponent(note.coverKey.slice(-12))}`;
}

export interface CatalogFilters {
  q?: string;
  program?: string;
  subject?: string;
  price?: "free" | "paid";
}

/** Published notes for the public catalog. Course-only notes are listed too, labelled. */
export async function listPublishedNotes(f: CatalogFilters) {
  const q = f.q?.trim().slice(0, 100);
  const where: Prisma.NoteWhereInput = {
    status: "PUBLISHED",
    ...(f.program ? { program: f.program } : {}),
    ...(f.subject ? { subject: f.subject } : {}),
    ...(f.price === "free" ? { accessType: "FREE" } : f.price === "paid" ? { accessType: "PAID" } : {}),
    ...(q
      ? { OR: [{ title: { contains: q } }, { shortDescription: { contains: q } }, { chapter: { contains: q } }, { subject: { contains: q } }] }
      : {}),
  };
  return prisma.note.findMany({
    where,
    select: noteCardSelect,
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    take: 200,
  });
}

export async function catalogFacets() {
  const rows = await prisma.note.findMany({
    where: { status: "PUBLISHED" },
    select: { program: true, subject: true },
    distinct: ["program", "subject"],
  });
  const programs = [...new Set(rows.map((r) => r.program).filter(Boolean))] as string[];
  const subjects = [...new Set(rows.map((r) => r.subject).filter(Boolean))] as string[];
  return { programs: programs.sort(), subjects: subjects.sort() };
}

export async function getNoteBySlug(slug: string) {
  return prisma.note.findUnique({
    where: { slug },
    include: {
      currentVersion: { select: { id: true, pageCount: true, previewKey: true, version: true, createdAt: true } },
      courses: {
        where: { course: { status: "Published" } },
        orderBy: { sortOrder: "asc" },
        select: { includedWithCourse: true, course: { select: { id: true, title: true, slug: true } } },
      },
    },
  });
}

/** Everything the user can read: purchases, grants, free claims, and course-included notes. */
export async function getMyNotes(userId: string) {
  const [entitled, viaCourses] = await Promise.all([
    prisma.noteEntitlement.findMany({
      where: { userId, status: "ACTIVE", note: { status: "PUBLISHED" } },
      select: { source: true, lastReadPage: true, lastReadAt: true, activatedAt: true, note: { select: noteCardSelect } },
      orderBy: [{ lastReadAt: "desc" }, { activatedAt: "desc" }],
    }),
    prisma.courseNote.findMany({
      where: {
        includedWithCourse: true,
        note: { status: "PUBLISHED" },
        course: { enrollment: { some: { userId, status: "Active" } } },
      },
      select: { course: { select: { title: true } }, note: { select: noteCardSelect } },
    }),
  ]);

  const seen = new Map<string, { note: NoteCardData; source: string; lastReadPage: number | null; courseTitle?: string }>();
  for (const e of entitled) {
    // Course-sourced rows are re-derived below so a cancelled enrollment drops them.
    if (e.source === "COURSE") continue;
    seen.set(e.note.id, { note: e.note, source: e.source, lastReadPage: e.lastReadPage });
  }
  for (const c of viaCourses) {
    if (seen.has(c.note.id)) continue;
    const progress = entitled.find((e) => e.note.id === c.note.id);
    seen.set(c.note.id, { note: c.note, source: "COURSE", lastReadPage: progress?.lastReadPage ?? null, courseTitle: c.course.title });
  }
  return [...seen.values()];
}

/** Admin list with per-note sales figures. */
export async function adminListNotes() {
  const [notes, sales] = await Promise.all([
    prisma.note.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        accessType: true,
        pricePaise: true,
        discountPricePaise: true,
        updatedAt: true,
        coverKey: true,
        currentVersion: { select: { pageCount: true, version: true } },
        _count: { select: { courses: true } },
      },
    }),
    prisma.noteEntitlement.groupBy({
      by: ["noteId"],
      where: { status: "ACTIVE", source: { in: ["PURCHASE", "WALLET"] } },
      _count: { _all: true },
      _sum: { amountPaise: true },
    }),
  ]);
  const readers = await prisma.noteEntitlement.groupBy({ by: ["noteId"], where: { status: "ACTIVE" }, _count: { _all: true } });
  const byNote = new Map(sales.map((s) => [s.noteId, s]));
  const readersByNote = new Map(readers.map((r) => [r.noteId, r._count._all]));
  return notes.map((n) => ({
    ...n,
    sales: byNote.get(n.id)?._count._all ?? 0,
    revenuePaise: byNote.get(n.id)?._sum.amountPaise ?? 0,
    readers: readersByNote.get(n.id) ?? 0,
  }));
}

/** Notes sales dashboard figures. Revenue counts only ACTIVE paid access (refunds excluded). */
export async function notesSalesSummary(days = 30) {
  const since = new Date(Date.now() - days * 86_400_000);
  const paid = { status: "ACTIVE" as const, source: { in: ["PURCHASE", "WALLET"] as ("PURCHASE" | "WALLET")[] } };

  const [allTime, recent, refunds, readers, freeClaims, views, downloads, recentSales, top] = await Promise.all([
    prisma.noteEntitlement.aggregate({ where: paid, _sum: { amountPaise: true }, _count: { _all: true } }),
    prisma.noteEntitlement.aggregate({ where: { ...paid, activatedAt: { gte: since } }, _sum: { amountPaise: true }, _count: { _all: true } }),
    prisma.noteEntitlement.aggregate({ where: { status: "REFUNDED" }, _sum: { amountPaise: true }, _count: { _all: true } }),
    prisma.noteEntitlement.count({ where: { status: "ACTIVE" } }),
    prisma.noteEntitlement.count({ where: { status: "ACTIVE", source: "FREE" } }),
    prisma.noteEvent.count({ where: { type: "VIEW", createdAt: { gte: since } } }),
    prisma.noteEvent.count({ where: { type: "DOWNLOAD", createdAt: { gte: since } } }),
    prisma.noteEntitlement.findMany({
      where: { ...paid, activatedAt: { gte: since } },
      select: { activatedAt: true, amountPaise: true },
    }),
    prisma.noteEntitlement.groupBy({
      by: ["noteId"],
      where: paid,
      _count: { _all: true },
      _sum: { amountPaise: true },
      orderBy: { _sum: { amountPaise: "desc" } },
      take: 5,
    }),
  ]);

  const titles = await prisma.note.findMany({ where: { id: { in: top.map((t) => t.noteId) } }, select: { id: true, title: true } });
  const titleById = new Map(titles.map((t) => [t.id, t.title]));

  // Daily revenue for the chart (IST calendar days).
  const daily = new Map<string, { date: string; revenue: number; sales: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000 + 5.5 * 3_600_000).toISOString().slice(0, 10);
    daily.set(d, { date: d, revenue: 0, sales: 0 });
  }
  for (const s of recentSales) {
    const d = new Date((s.activatedAt ?? new Date()).getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);
    const row = daily.get(d);
    if (row) {
      row.revenue += s.amountPaise / 100;
      row.sales += 1;
    }
  }

  return {
    allTime: { revenuePaise: allTime._sum.amountPaise ?? 0, sales: allTime._count._all },
    recent: { revenuePaise: recent._sum.amountPaise ?? 0, sales: recent._count._all },
    refunds: { amountPaise: refunds._sum.amountPaise ?? 0, count: refunds._count._all },
    readers,
    freeClaims,
    views,
    downloads,
    daily: [...daily.values()],
    top: top.map((t) => ({
      noteId: t.noteId,
      title: titleById.get(t.noteId) ?? "(deleted)",
      sales: t._count._all,
      revenuePaise: t._sum.amountPaise ?? 0,
    })),
  };
}
