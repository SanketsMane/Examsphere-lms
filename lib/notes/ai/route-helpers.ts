import "server-only";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { JobError } from "@/lib/notes/ai/jobs";
import { AiNotConfiguredError, AiRefusalError } from "@/lib/notes/ai/provider";
import { logger } from "@/lib/logger";

/** The job, only if it belongs to the note in the URL. */
export async function loadNoteJob(noteId: string, jobId: string) {
  const job = await prisma.noteGenerationJob.findUnique({ where: { id: jobId } });
  return job && job.noteId === noteId ? job : null;
}

export function aiErrorResponse(err: unknown, context: string) {
  if (err instanceof JobError || err instanceof AiNotConfiguredError || err instanceof AiRefusalError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  logger.error(context, err as Error);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

/** What the admin UI needs to show a job. */
export function jobView(job: {
  id: string;
  type: string;
  status: string;
  stage: string | null;
  progress: number;
  message: string | null;
  error: string | null;
  model: string | null;
  provider: string | null;
  costUsdMicros: number;
  inputTokens: number;
  outputTokens: number;
  createdAt: Date;
  finishedAt: Date | null;
  resultVersionId: string | null;
  options: unknown;
}) {
  return {
    id: job.id,
    type: job.type,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    message: job.message,
    error: job.error,
    model: job.model,
    provider: job.provider,
    costUsd: job.costUsdMicros / 1_000_000,
    tokens: { input: job.inputTokens, output: job.outputTokens },
    createdAt: job.createdAt.toISOString(),
    finishedAt: job.finishedAt?.toISOString() ?? null,
    resultVersionId: job.resultVersionId,
    options: job.options,
  };
}
