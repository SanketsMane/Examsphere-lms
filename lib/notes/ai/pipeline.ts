import "server-only";

import type { NoteGenerationJob, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getPrivateStorage } from "@/lib/storage/private-storage";
import { uploadNoteVersion } from "@/lib/notes/admin";
import {
  generationOptionsSchema,
  noteDocSchema,
  renderStyleSchema,
  type GenerationOptions,
  type NoteDoc,
  type NoteSection,
} from "@/lib/notes/ai/doc-schema";
import type { ExtractedPage, ReviewIssue } from "@/lib/notes/ai/schemas";
import { AiNotConfiguredError, AiRefusalError, getNotesAiProvider, type NotesAiProvider } from "@/lib/notes/ai/provider";
import { addUsage, assertBudget, JobError, reportProgress, WORKER_ID } from "@/lib/notes/ai/jobs";
import { sourceUnits } from "@/lib/notes/ai/sources";
import { renderNoteHtml } from "@/lib/notes/ai/render-html";
import { htmlToPdf } from "@/lib/notes/ai/render-pdf";

class Cancelled extends Error {}

/** Characters of transcript per writing call (~15k tokens), so each answer fits in one response. */
const PART_CHARS = 60_000;

interface SourcePages {
  name: string;
  pages: ExtractedPage[];
}

export async function runJob(job: NoteGenerationJob) {
  try {
    if (job.type === "GENERATE") await runGenerate(job);
    else await runRender(job);
  } catch (err) {
    if (err instanceof Cancelled) return;
    const permanent = err instanceof JobError || err instanceof AiNotConfiguredError || err instanceof AiRefusalError;
    const message = err instanceof Error ? err.message : String(err);
    logger.error("NOTES_AI_JOB_FAILED", { jobId: job.id, type: job.type, permanent, error: message });
    // Transient failures go back to the queue (the worker retries up to MAX_ATTEMPTS).
    await prisma.noteGenerationJob.updateMany({
      where: { id: job.id, lockedBy: WORKER_ID },
      data: permanent || job.attempts >= 3
        ? { status: "FAILED", error: message.slice(0, 2000), message: "Failed", finishedAt: new Date(), lockedBy: null }
        : { status: "QUEUED", error: message.slice(0, 2000), message: "Retrying after an error", lockedBy: null, lockedAt: null },
    });
    if (permanent || job.attempts >= 3) await restoreNoteStatus(job.noteId);
  }
}

async function step(jobId: string, stage: string, progress: number, message: string) {
  if (!(await reportProgress(jobId, stage, progress, message))) throw new Cancelled();
}

async function pool<T>(items: T[], limit: number, fn: (item: T, index: number) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        await fn(items[i], i);
      }
    })
  );
}

function sourceText(sources: SourcePages[]): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const s of sources) {
    for (const p of s.pages) {
      const figures = p.figures.map((f) => `[Figure: ${f.description}${f.labels.length ? ` | labels: ${f.labels.join(", ")}` : ""}]`).join("\n");
      const block = `<page source="${s.name.replace(/"/g, "'")}" n="${p.page}" kind="${p.kind}" legibility="${p.legibility}">\n${p.transcript}${figures ? `\n${figures}` : ""}\n</page>\n`;
      if (current && current.length + block.length > PART_CHARS) {
        chunks.push(current);
        current = "";
      }
      current += block;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function runGenerate(job: NoteGenerationJob) {
  const options = generationOptionsSchema.parse(job.options);
  const ai = await getNotesAiProvider(job.model ?? "claude-opus-5-5");
  await prisma.noteGenerationJob.update({ where: { id: job.id }, data: { provider: ai.name, model: ai.model, error: null } });
  const sources = await prisma.noteSource.findMany({ where: { jobId: job.id }, orderBy: { sortOrder: "asc" } });
  const note = await prisma.note.findUniqueOrThrow({ where: { id: job.noteId } });

  // 1. Read every page (cached per source, so a retry or re-run doesn't pay twice).
  await step(job.id, "extract", 3, "Reading your pages");
  const storage = getPrivateStorage();
  const totalPages = sources.reduce((s, x) => s + x.pageCount, 0);
  let donePages = 0;
  const extracted: SourcePages[] = [];
  for (const src of sources) {
    const cached = src.extraction as { model?: string; pages?: ExtractedPage[] } | null;
    if (cached?.pages?.length && cached.model === ai.model) {
      extracted.push({ name: src.originalName, pages: cached.pages });
      donePages += src.pageCount;
      continue;
    }
    const units = await sourceUnits(src.kind, await storage.get(src.fileKey));
    const pagesByUnit: ExtractedPage[][] = new Array(units.length);
    await pool(units, 3, async (unit, i) => {
      await assertBudget(0);
      const res = await ai.extract({ ...unit, label: src.originalName });
      await addUsage(job.id, res.usage);
      // Trust our own page numbering over the model's.
      pagesByUnit[i] = res.data.pages.slice(0, unit.pageCount).map((p, k) => ({ ...p, page: unit.firstPage + k }));
      donePages += unit.pageCount;
      await step(job.id, "extract", 3 + (donePages / totalPages) * 47, `Read ${donePages} of ${totalPages} pages`);
    });
    const pages = pagesByUnit.flat();
    await prisma.noteSource.update({ where: { id: src.id }, data: { extraction: { model: ai.model, pages } as unknown as Prisma.InputJsonValue } });
    extracted.push({ name: src.originalName, pages });
  }

  // 2. Write the notes, part by part for long sources.
  const parts = sourceText(extracted);
  const sections: NoteSection[] = [];
  const partOfSection: number[] = [];
  for (const [i, text] of parts.entries()) {
    await step(job.id, "write", 50 + (i / parts.length) * 30, parts.length > 1 ? `Writing notes (part ${i + 1} of ${parts.length})` : "Writing notes");
    await assertBudget(0);
    const res = await ai.write({ sourceText: text, options, part: i + 1, totalParts: parts.length, earlierHeadings: sections.map((s) => s.heading) });
    await addUsage(job.id, res.usage);
    for (const s of res.data.sections) {
      sections.push(s);
      partOfSection.push(i);
    }
  }
  if (sections.length === 0) throw new JobError("The AI could not find any content to make notes from. Check that the uploads are readable.");

  // 3. Fact-check each part against its source.
  const issues: (ReviewIssue & { resolved?: boolean })[] = [];
  for (const [i, text] of parts.entries()) {
    await step(job.id, "check", 80 + (i / parts.length) * 15, "Checking the notes against the source");
    const own = sections.map((s, idx) => ({ s, idx })).filter((x) => partOfSection[x.idx] === i);
    if (own.length === 0) continue;
    await assertBudget(0);
    const res = await ai.review({ sourceText: text, sections: own.map((x) => x.s) });
    await addUsage(job.id, res.usage);
    for (const issue of res.data.issues) {
      const target = own[issue.section];
      if (target) issues.push({ ...issue, section: target.idx });
    }
  }

  const doc: NoteDoc = {
    title: note.title,
    subtitle: note.shortDescription || [note.program, note.subject, note.chapter].filter(Boolean).join(" · ") || null,
    sections,
  };
  const order = { high: 0, medium: 1, low: 2 } as const;
  issues.sort((a, b) => order[a.severity] - order[b.severity]);

  await prisma.noteGenerationJob.updateMany({
    where: { id: job.id, lockedBy: WORKER_ID, status: "RUNNING" },
    data: {
      status: "REVIEW",
      stage: "review",
      progress: 100,
      message: issues.length ? `Draft ready: ${issues.length} point${issues.length === 1 ? "" : "s"} to check` : "Draft ready",
      draftDoc: doc as unknown as Prisma.InputJsonValue,
      reviewIssues: issues as unknown as Prisma.InputJsonValue,
      finishedAt: new Date(),
      lockedBy: null,
    },
  });
  await prisma.note.updateMany({ where: { id: job.noteId, status: "PROCESSING" }, data: { status: "REVIEW" } });
}

async function runRender(job: NoteGenerationJob) {
  const opts = job.options as { sourceJobId?: string; style?: unknown };
  const style = renderStyleSchema.parse(opts.style ?? {});
  const src = opts.sourceJobId ? await prisma.noteGenerationJob.findUnique({ where: { id: opts.sourceJobId } }) : null;
  if (!src?.draftDoc) throw new JobError("The draft to render was not found.");
  const doc = noteDocSchema.parse(src.draftDoc);
  const note = await prisma.note.findUniqueOrThrow({ where: { id: job.noteId } });

  await step(job.id, "render", 20, "Laying out handwritten pages");
  const html = renderNoteHtml(doc, style, { program: note.program, subject: note.subject, language: note.language });
  const pdf = await htmlToPdf(html, { footerLabel: `ExamSphere · ${doc.title}`.slice(0, 120) });

  await step(job.id, "render", 75, "Saving the new version");
  const version = await uploadNoteVersion(note.id, job.createdById, pdf, `AI notes (${style.style}, ${style.paper} paper)`, { origin: "AI", contentJson: doc });

  await prisma.noteGenerationJob.updateMany({
    where: { id: job.id, lockedBy: WORKER_ID },
    data: { status: "DONE", stage: "done", progress: 100, message: `Version ${version.version} created (${version.pageCount} pages)`, resultVersionId: version.id, finishedAt: new Date(), lockedBy: null },
  });
  await prisma.noteGenerationJob.update({ where: { id: src.id }, data: { status: "DONE", resultVersionId: version.id } });
  await restoreNoteStatus(note.id);
}

/** Leave the transient AI statuses once the work is over (published notes stay published). */
async function restoreNoteStatus(noteId: string) {
  await prisma.note.updateMany({ where: { id: noteId, status: { in: ["PROCESSING", "REVIEW"] } }, data: { status: "DRAFT" } });
}

/** Rewrite one section of a draft on request (synchronous, called from the admin editor). */
export async function rewriteDraftSection(args: { jobId: string; sectionIndex: number; instruction: string; section: NoteSection }) {
  const job = await prisma.noteGenerationJob.findUnique({ where: { id: args.jobId }, include: { sources: { orderBy: { sortOrder: "asc" } } } });
  if (!job || job.type !== "GENERATE") throw new JobError("Draft not found.");
  await assertBudget(0);
  const options: GenerationOptions = generationOptionsSchema.parse(job.options);
  const extracted: SourcePages[] = job.sources.map((s) => ({
    name: s.originalName,
    pages: ((s.extraction as { pages?: ExtractedPage[] } | null)?.pages ?? []) as ExtractedPage[],
  }));
  const text = sourceText(extracted).join("\n").slice(0, PART_CHARS * 3);
  const ai: NotesAiProvider = await getNotesAiProvider(job.model ?? "claude-opus-5-5");
  const res = await ai.rewriteSection({ sourceText: text, section: args.section, instruction: args.instruction.slice(0, 1000), options });
  await addUsage(job.id, res.usage);
  return res.data;
}
