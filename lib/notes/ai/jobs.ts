import "server-only";

import { hostname } from "node:os";
import type { NoteGenerationJob, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getPrivateStorage } from "@/lib/storage/private-storage";
import { aiSpendThisMonthUsd, getNotesSettings } from "@/lib/notes/settings";
import { estimateGenerationUsd, usageCostMicros, type TokenUsage } from "@/lib/notes/ai/pricing";
import { checkSourceFile, MAX_SOURCE_FILES, MAX_SOURCE_PAGES, SourceError } from "@/lib/notes/ai/sources";
import type { GenerationOptions, RenderStyle } from "@/lib/notes/ai/doc-schema";

/** Note generation jobs: a MySQL-backed queue processed by scripts/notes-worker.ts. */

export const STALE_LOCK_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 3;

export class JobError extends Error {}

export async function assertBudget(extraUsd: number) {
  const [settings, spent] = await Promise.all([getNotesSettings(), aiSpendThisMonthUsd()]);
  if (spent + extraUsd > settings.aiMonthlyBudgetUsd) {
    throw new JobError(
      `Monthly AI budget reached: about $${spent.toFixed(2)} of $${settings.aiMonthlyBudgetUsd} used this month` +
        (extraUsd > 0 ? `, and this job could need up to $${extraUsd.toFixed(2)} more` : "") +
        ". Raise the budget in Notes settings or wait until next month."
    );
  }
}

/** Store uploaded sources privately and queue a generation job. */
export async function createGenerateJob(args: {
  noteId: string;
  adminId: string;
  files: { name: string; bytes: Buffer }[];
  options: GenerationOptions;
}) {
  const note = await prisma.note.findUnique({ where: { id: args.noteId }, select: { id: true, status: true } });
  if (!note) throw new JobError("Note not found.");
  const active = await prisma.noteGenerationJob.count({ where: { noteId: note.id, status: { in: ["QUEUED", "RUNNING"] } } });
  if (active > 0) throw new JobError("A generation is already running for this note.");
  if (args.files.length === 0) throw new JobError("Add at least one file.");
  if (args.files.length > MAX_SOURCE_FILES) throw new JobError(`Upload at most ${MAX_SOURCE_FILES} files at a time.`);

  const checked = [];
  for (const f of args.files) {
    try {
      checked.push({ name: f.name.slice(0, 200), ...(await checkSourceFile(f.bytes, f.name)) });
    } catch (e) {
      if (e instanceof SourceError) throw new JobError(e.message);
      throw e;
    }
  }
  const pages = checked.reduce((s, c) => s + c.pageCount, 0);
  if (pages > MAX_SOURCE_PAGES) throw new JobError(`That's ${pages} pages; the limit is ${MAX_SOURCE_PAGES} per run. Split it into chapters.`);

  const settings = await getNotesSettings();
  await assertBudget(estimateGenerationUsd(pages, settings.aiModel).high);

  const job = await prisma.noteGenerationJob.create({
    data: {
      noteId: note.id,
      type: "GENERATE",
      options: args.options as unknown as Prisma.InputJsonValue,
      model: settings.aiModel,
      createdById: args.adminId,
      message: "Waiting for the worker",
    },
  });

  const storage = getPrivateStorage();
  for (const [i, c] of checked.entries()) {
    const key = `notes/${note.id}/sources/${job.id}/${String(i).padStart(2, "0")}-${c.sha256.slice(0, 16)}.${c.ext}`;
    await storage.put(key, c.bytes, c.mimeType);
    await prisma.noteSource.create({
      data: { jobId: job.id, kind: c.kind, fileKey: key, mimeType: c.mimeType, originalName: c.name, size: c.bytes.length, pageCount: c.pageCount, sha256: c.sha256, sortOrder: i },
    });
  }

  if (note.status === "DRAFT") await prisma.note.update({ where: { id: note.id }, data: { status: "PROCESSING" } });
  return { job, pages };
}

/** Re-run writing with new options on the same sources (cached transcriptions are reused). */
export async function createRerunJob(args: { fromJobId: string; adminId: string; options: GenerationOptions }) {
  const from = await prisma.noteGenerationJob.findUnique({ where: { id: args.fromJobId }, include: { sources: true } });
  if (!from || from.type !== "GENERATE") throw new JobError("Original generation not found.");
  const active = await prisma.noteGenerationJob.count({ where: { noteId: from.noteId, status: { in: ["QUEUED", "RUNNING"] } } });
  if (active > 0) throw new JobError("A generation is already running for this note.");
  const settings = await getNotesSettings();
  const pages = from.sources.reduce((s, x) => s + x.pageCount, 0);
  await assertBudget(estimateGenerationUsd(pages, settings.aiModel).high * 0.5);

  return prisma.noteGenerationJob.create({
    data: {
      noteId: from.noteId,
      type: "GENERATE",
      options: args.options as unknown as Prisma.InputJsonValue,
      model: settings.aiModel,
      createdById: args.adminId,
      message: "Waiting for the worker",
      sources: {
        create: from.sources.map((s) => ({
          kind: s.kind,
          fileKey: s.fileKey,
          mimeType: s.mimeType,
          originalName: s.originalName,
          size: s.size,
          pageCount: s.pageCount,
          sha256: s.sha256,
          sortOrder: s.sortOrder,
          extraction: s.extraction ?? undefined,
        })),
      },
    },
  });
}

export async function createRenderJob(args: { sourceJobId: string; adminId: string; style: RenderStyle }) {
  const src = await prisma.noteGenerationJob.findUnique({ where: { id: args.sourceJobId } });
  if (!src || src.type !== "GENERATE" || !src.draftDoc) throw new JobError("There is no draft to turn into a PDF.");
  const busy = await prisma.noteGenerationJob.count({ where: { noteId: src.noteId, status: { in: ["QUEUED", "RUNNING"] } } });
  if (busy > 0) throw new JobError("Another job is running for this note. Try again when it finishes.");
  return prisma.noteGenerationJob.create({
    data: {
      noteId: src.noteId,
      type: "RENDER",
      options: { sourceJobId: src.id, style: args.style } as unknown as Prisma.InputJsonValue,
      createdById: args.adminId,
      message: "Waiting for the worker",
    },
  });
}

export async function cancelJob(jobId: string) {
  await prisma.noteGenerationJob.updateMany({
    where: { id: jobId, status: { in: ["QUEUED", "RUNNING"] } },
    data: { status: "CANCELLED", message: "Cancelled", finishedAt: new Date(), lockedBy: null },
  });
}

// ---- worker side ------------------------------------------------------------------------

export const WORKER_ID = `${hostname()}:${process.pid}`;

/** Claim the oldest runnable job (queued, or running with a stale lock from a dead worker). */
export async function claimNextJob(): Promise<NoteGenerationJob | null> {
  const stale = new Date(Date.now() - STALE_LOCK_MS);
  const candidate = await prisma.noteGenerationJob.findFirst({
    where: { OR: [{ status: "QUEUED" }, { status: "RUNNING", lockedAt: { lt: stale } }] },
    orderBy: { createdAt: "asc" },
  });
  if (!candidate) return null;

  if (candidate.attempts >= MAX_ATTEMPTS) {
    await prisma.noteGenerationJob.update({
      where: { id: candidate.id },
      data: { status: "FAILED", error: candidate.error ?? "Stopped after repeated failures.", finishedAt: new Date(), lockedBy: null },
    });
    return null;
  }

  // Compare-and-set: only one worker can win the claim.
  const claimed = await prisma.noteGenerationJob.updateMany({
    where: {
      id: candidate.id,
      OR: [{ status: "QUEUED" }, { status: "RUNNING", lockedAt: { lt: stale } }],
    },
    data: { status: "RUNNING", lockedBy: WORKER_ID, lockedAt: new Date(), attempts: { increment: 1 }, startedAt: candidate.startedAt ?? new Date() },
  });
  if (claimed.count !== 1) return null;
  return prisma.noteGenerationJob.findUnique({ where: { id: candidate.id } });
}

/** Progress + heartbeat. Returns false if the job was cancelled (or taken over). */
export async function reportProgress(jobId: string, stage: string, progress: number, message: string): Promise<boolean> {
  const r = await prisma.noteGenerationJob.updateMany({
    where: { id: jobId, status: "RUNNING", lockedBy: WORKER_ID },
    data: { stage, progress: Math.max(0, Math.min(100, Math.round(progress))), message, lockedAt: new Date() },
  });
  return r.count === 1;
}

export async function addUsage(jobId: string, usage: TokenUsage) {
  await prisma.noteGenerationJob.update({
    where: { id: jobId },
    data: {
      inputTokens: { increment: usage.inputTokens + (usage.cacheCreationTokens ?? 0) + (usage.cacheReadTokens ?? 0) },
      outputTokens: { increment: usage.outputTokens },
      costUsdMicros: { increment: usageCostMicros(usage) },
      model: usage.model === "mock" ? "mock" : undefined,
    },
  });
}
