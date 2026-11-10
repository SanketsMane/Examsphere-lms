"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { GenerationOptions, NoteDoc } from "@/lib/notes/ai/doc-schema";
import { GenerateForm } from "./GenerateForm";
import { DraftEditor, type Issue } from "./DraftEditor";

export interface JobView {
  id: string;
  type: "GENERATE" | "RENDER";
  status: "QUEUED" | "RUNNING" | "REVIEW" | "DONE" | "FAILED" | "CANCELLED";
  stage: string | null;
  progress: number;
  message: string | null;
  error: string | null;
  model: string | null;
  costUsd: number;
  createdAt: string;
  finishedAt: string | null;
  options: unknown;
}

interface DraftState {
  jobId: string;
  status: JobView["status"];
  doc: NoteDoc;
  issues: Issue[];
  sources: { id: string; originalName: string; pageCount: number }[];
}

interface Props {
  noteId: string;
  model: string;
  budget: { limitUsd: number; spentUsd: number };
  defaults: Partial<GenerationOptions>;
  jobs: JobView[];
  draft: DraftState | null;
}

const ACTIVE = new Set(["QUEUED", "RUNNING"]);
const STATUS_STYLE: Record<string, string> = {
  QUEUED: "bg-sky-500/10 text-sky-600",
  RUNNING: "bg-sky-500/10 text-sky-600",
  REVIEW: "bg-violet-500/10 text-violet-600",
  DONE: "bg-es-green-600/10 text-es-green-700",
  FAILED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

export function AiNotesPanel({ noteId, model, budget, defaults, jobs: initialJobs, draft: initialDraft }: Props) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [draft, setDraft] = useState(initialDraft);
  const [showForm, setShowForm] = useState(!initialDraft);
  const active = jobs.find((j) => ACTIVE.has(j.status)) ?? null;

  const poll = useCallback(
    async (jobId: string) => {
      const res = await fetch(`/api/admin/notes/${noteId}/ai/jobs/${jobId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const job: JobView = data.job;
      setJobs((cur) => (cur.some((j) => j.id === job.id) ? cur.map((j) => (j.id === job.id ? job : j)) : [job, ...cur]));
      if (job.type === "GENERATE" && job.status === "REVIEW" && data.draft) {
        setDraft({ jobId: job.id, status: job.status, doc: data.draft, issues: data.issues ?? [], sources: data.sources ?? [] });
        setShowForm(false);
        toast.success("Draft ready. Review it below.");
      }
      if (job.type === "RENDER" && job.status === "DONE") {
        toast.success(job.message ?? "PDF version created");
        router.refresh();
      }
      if (job.status === "FAILED") toast.error(job.error ?? "The job failed");
    },
    [noteId, router]
  );

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => poll(active.id), 2500);
    return () => clearInterval(t);
  }, [active, poll]);

  async function cancel(jobId: string) {
    await fetch(`/api/admin/notes/${noteId}/ai/jobs/${jobId}/cancel`, { method: "POST" });
    await poll(jobId);
  }

  async function retry(job: JobView) {
    const res = await fetch(`/api/admin/notes/${noteId}/ai/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromJobId: job.id, options: job.options }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error || "Could not retry");
    setJobs((cur) => [data.job, ...cur]);
  }

  const latest = jobs[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          AI model: <strong className="text-foreground">{model}</strong> · this month: ${budget.spentUsd.toFixed(2)} of ${budget.limitUsd} budget
        </span>
        {draft && !active && (
          <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
            <Sparkles className="mr-2 size-4" /> {showForm ? "Hide new generation" : "Generate again"}
          </Button>
        )}
      </div>

      {active && (
        <div className="space-y-3 rounded-2xl border border-sky-300 bg-sky-50/60 p-5 dark:border-sky-500/30 dark:bg-sky-500/5">
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin text-sky-600" />
            <span className="font-medium">{active.type === "RENDER" ? "Creating the PDF version" : "Generating notes"}</span>
            <span className="text-sm text-muted-foreground">· {active.message}</span>
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => cancel(active.id)}>Cancel</Button>
          </div>
          <Progress value={active.progress} />
          <p className="text-xs text-muted-foreground">
            {active.status === "QUEUED" ? "Waiting for the worker to pick this up." : "You can leave this page; the work continues in the background."}
            {active.costUsd > 0 && ` Cost so far: $${active.costUsd.toFixed(3)}.`}
          </p>
        </div>
      )}

      {!active && latest?.status === "FAILED" && (
        <div className="flex flex-wrap items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <XCircle className="mt-0.5 size-4 text-destructive" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">The last {latest.type === "RENDER" ? "PDF render" : "generation"} failed</p>
            <p className="text-muted-foreground">{latest.error}</p>
          </div>
          {latest.type === "GENERATE" && (
            <Button size="sm" variant="outline" onClick={() => retry(latest)}>
              <RotateCcw className="mr-2 size-4" /> Retry
            </Button>
          )}
        </div>
      )}

      {!active && latest?.type === "RENDER" && latest.status === "DONE" && (
        <div className="flex items-center gap-2 rounded-2xl border border-es-green-600/30 bg-es-green-600/5 p-4 text-sm">
          <CheckCircle2 className="size-4 text-es-green-700" /> {latest.message}. It is now the note&apos;s current file: check it in the File tab, then publish.
        </div>
      )}

      {draft && (
        <DraftEditor
          key={draft.jobId}
          noteId={noteId}
          jobId={draft.jobId}
          editable={draft.status === "REVIEW"}
          initialDoc={draft.doc}
          initialIssues={draft.issues}
          sources={draft.sources}
          onRenderQueued={(jobId) => poll(jobId)}
        />
      )}

      {showForm && !active && (
        <div className="rounded-2xl border border-border p-5">
          <h3 className="mb-4 font-display text-lg font-bold">Generate notes with AI</h3>
          <GenerateForm noteId={noteId} model={model} defaults={defaults} onStarted={(jobId) => poll(jobId)} />
        </div>
      )}

      {jobs.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Started</th>
                <th className="px-4 py-2">Job</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Result</th>
                <th className="px-4 py-2 text-right">AI cost</th>
              </tr>
            </thead>
            <tbody>
              {jobs.slice(0, 10).map((j) => (
                <tr key={j.id} className="border-t border-border">
                  <td className="px-4 py-2 text-muted-foreground">{new Date(j.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="px-4 py-2">{j.type === "RENDER" ? "PDF render" : "Generate"}</td>
                  <td className="px-4 py-2"><Badge variant="outline" className={`border-0 ${STATUS_STYLE[j.status]}`}>{j.status.toLowerCase()}</Badge></td>
                  <td className="max-w-xs truncate px-4 py-2 text-muted-foreground">{j.status === "FAILED" ? j.error : j.message}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{j.costUsd ? `$${j.costUsd.toFixed(3)}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
