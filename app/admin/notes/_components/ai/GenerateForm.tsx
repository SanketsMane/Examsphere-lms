"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileImage, FileText, Loader2, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEPTH_LABELS, NOTE_DEPTHS, type GenerationOptions } from "@/lib/notes/ai/doc-schema";
import { estimateGenerationUsd } from "@/lib/notes/ai/pricing";

interface Picked {
  file: File;
  pages: number | null; // null while counting
}

const MAX_FILE_MB = 25;
const MAX_REQUEST_MB = 45; // nginx accepts 50 MB per request

async function countPdfPages(file: File): Promise<number> {
  const { pdfjs } = await import("react-pdf");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const n = doc.numPages;
  await doc.destroy();
  return n;
}

export function GenerateForm({
  noteId,
  model,
  defaults,
  onStarted,
}: {
  noteId: string;
  model: string;
  defaults: Partial<GenerationOptions>;
  onStarted: (jobId: string) => void;
}) {
  const [files, setFiles] = useState<Picked[]>([]);
  const [opts, setOpts] = useState<GenerationOptions>({
    depth: "detailed",
    language: "English",
    exam: "General",
    audience: "",
    includeQuestions: true,
    includeDiagrams: true,
    extraInstructions: "",
    ...defaults,
  });
  const [rights, setRights] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const totalMb = files.reduce((s, f) => s + f.file.size, 0) / 1024 / 1024;
  const pages = files.reduce((s, f) => s + (f.pages ?? 0), 0);
  const counting = files.some((f) => f.pages === null);
  const estimate = estimateGenerationUsd(pages, model);

  async function add(list: FileList | null) {
    if (!list) return;
    const next: Picked[] = [];
    for (const file of Array.from(list)) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(`${file.name} is larger than ${MAX_FILE_MB} MB.`);
        continue;
      }
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      next.push({ file, pages: isPdf ? null : 1 });
    }
    setFiles((cur) => [...cur, ...next]);
    for (const p of next.filter((x) => x.pages === null)) {
      const n = await countPdfPages(p.file).catch(() => 1);
      setFiles((cur) => cur.map((x) => (x.file === p.file ? { ...x, pages: n } : x)));
    }
    if (input.current) input.current.value = "";
  }

  async function start() {
    if (!files.length) return toast.error("Add at least one file.");
    if (!rights) return toast.error("Confirm you have the right to use this material.");
    if (totalMb > MAX_REQUEST_MB) return toast.error(`Uploads total ${totalMb.toFixed(0)} MB; send at most ${MAX_REQUEST_MB} MB at a time.`);
    setBusy(true);
    try {
      const body = new FormData();
      for (const f of files) body.append("files", f.file);
      body.set("options", JSON.stringify(opts));
      body.set("rights", "yes");
      const res = await fetch(`/api/admin/notes/${noteId}/ai/jobs`, { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not start");
      toast.success(`Started: ${data.pages} page${data.pages === 1 ? "" : "s"} queued`);
      setFiles([]);
      onStarted(data.job.id);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div
        className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary hover:bg-primary/5"
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          add(e.dataTransfer.files);
        }}
      >
        <Upload className="size-8 text-muted-foreground" />
        <p className="font-medium">Drop book screenshots, photos of handwritten notes, or PDFs</p>
        <p className="text-xs text-muted-foreground">JPEG, PNG, WebP or PDF · up to {MAX_FILE_MB} MB each · up to 200 pages per run</p>
        <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf,.pdf" className="hidden" onChange={(e) => add(e.target.files)} />
      </div>

      {files.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {files.map((f, i) => (
            <li key={`${f.file.name}-${i}`} className="flex items-center gap-3 px-4 py-2 text-sm">
              {f.file.type.startsWith("image/") ? <FileImage className="size-4 text-muted-foreground" /> : <FileText className="size-4 text-muted-foreground" />}
              <span className="min-w-0 flex-1 truncate">{f.file.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {f.pages === null ? "counting…" : `${f.pages} page${f.pages === 1 ? "" : "s"}`} · {(f.file.size / 1024 / 1024).toFixed(1)} MB
              </span>
              <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => setFiles((cur) => cur.filter((_, k) => k !== i))}>
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid items-start gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Type of notes</Label>
          <Select value={opts.depth} onValueChange={(v) => setOpts({ ...opts, depth: v as GenerationOptions["depth"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{NOTE_DEPTHS.map((d) => <SelectItem key={d} value={d}>{DEPTH_LABELS[d]}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Language</Label>
          <Select value={opts.language} onValueChange={(v) => setOpts({ ...opts, language: v as GenerationOptions["language"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Hindi">Hindi</SelectItem>
              <SelectItem value="Hinglish">Hinglish</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Exam</Label>
          <Input value={opts.exam} maxLength={60} onChange={(e) => setOpts({ ...opts, exam: e.target.value })} placeholder="NEET" />
        </div>
        <div className="space-y-2 md:col-span-3">
          <Label>Students (optional)</Label>
          <Input value={opts.audience} maxLength={120} onChange={(e) => setOpts({ ...opts, audience: e.target.value })} placeholder="Class 11 students starting the chapter" />
        </div>
        <div className="space-y-2 md:col-span-3">
          <Label>Extra instructions (optional)</Label>
          <Textarea rows={3} maxLength={1000} value={opts.extraInstructions} onChange={(e) => setOpts({ ...opts, extraInstructions: e.target.value })} placeholder="e.g. Add NCERT line references; keep each section under one page" />
        </div>
        <label className="flex items-center gap-3 text-sm">
          <Switch checked={opts.includeDiagrams} onCheckedChange={(v) => setOpts({ ...opts, includeDiagrams: v })} /> Draw diagrams
        </label>
        <label className="flex items-center gap-3 text-sm">
          <Switch checked={opts.includeQuestions} onCheckedChange={(v) => setOpts({ ...opts, includeQuestions: v })} /> Add practice questions
        </label>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
        <input type="checkbox" className="mt-1 size-4" checked={rights} onChange={(e) => setRights(e.target.checked)} />
        <span>
          I have the right to use this material. Notes made from copyrighted books are rewritten in the AI&apos;s own words and
          diagrams are redrawn, but you are responsible for what you publish.
        </span>
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {files.length === 0
            ? `Model: ${model}`
            : counting
              ? "Counting pages…"
              : `${pages} page${pages === 1 ? "" : "s"} · estimated AI cost $${estimate.low}–$${estimate.high} (${model})`}
        </p>
        <Button onClick={start} disabled={busy || counting || files.length === 0}>
          {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
          {busy ? "Uploading…" : "Generate notes"}
        </Button>
      </div>
    </div>
  );
}
