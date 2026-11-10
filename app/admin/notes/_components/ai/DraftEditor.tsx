"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Check, ExternalLink, FileDown, Loader2, Plus, RefreshCw, Save, Sparkles, Trash2, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BLOCK_TYPES,
  emptyBlock,
  NOTE_PAPERS,
  NOTE_STYLES,
  STYLE_LABELS,
  type BlockType,
  type NoteDoc,
  type NoteSection,
  type RenderStyle,
} from "@/lib/notes/ai/doc-schema";
import { BlockEditor, BLOCK_TYPE_LABEL } from "./BlockEditor";

export interface Issue {
  section: number;
  block: number | null;
  severity: "high" | "medium" | "low";
  problem: string;
  suggestion: string;
  resolved?: boolean;
}

interface Props {
  noteId: string;
  jobId: string;
  editable: boolean; // rewrite only while under review
  initialDoc: NoteDoc;
  initialIssues: Issue[];
  sources: { id: string; originalName: string; pageCount: number }[];
  onRenderQueued: (jobId: string) => void;
}

const SEVERITY: Record<Issue["severity"], string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-orange-500/10 text-orange-600",
  low: "bg-muted text-muted-foreground",
};

/** Drop empty list items and whitespace-only lines before saving. */
function clean(doc: NoteDoc): NoteDoc {
  return {
    ...doc,
    sections: doc.sections.map((s) => ({
      ...s,
      blocks: s.blocks.map((b) => (b.items ? { ...b, items: b.items.map((i) => i.trim()).filter(Boolean) } : b)),
    })),
  };
}

export function DraftEditor({ noteId, jobId, editable, initialDoc, initialIssues, sources, onRenderQueued }: Props) {
  const [doc, setDoc] = useState<NoteDoc>(initialDoc);
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [style, setStyle] = useState<RenderStyle>({ style: "notebook", paper: "ruled" });
  const [preview, setPreview] = useState<string>("");
  const [previewing, setPreviewing] = useState(false);
  const [rewrite, setRewrite] = useState<{ index: number; text: string; busy: boolean } | null>(null);
  const [adding, setAdding] = useState<Record<number, BlockType>>({});
  const [rendering, setRendering] = useState(false);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const update = (next: NoteDoc) => {
    setDoc(next);
    setDirty(true);
  };
  const setSection = (i: number, s: NoteSection) => update({ ...doc, sections: doc.sections.map((x, k) => (k === i ? s : x)) });
  const moveIn = <T,>(list: T[], i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return list;
    const copy = [...list];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  };

  const refreshPreview = useCallback(async (d: NoteDoc, st: RenderStyle) => {
    setPreviewing(true);
    try {
      const res = await fetch(`/api/admin/notes/${noteId}/ai/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc: clean(d), style: st }),
      });
      if (res.ok) setPreview(await res.text());
    } finally {
      setPreviewing(false);
    }
  }, [noteId]);

  // Keep the preview roughly in sync while editing.
  useEffect(() => {
    const t = setTimeout(() => refreshPreview(doc, style), 1200);
    return () => clearTimeout(t);
  }, [doc, style, refreshPreview]);

  async function save(): Promise<boolean> {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/notes/${noteId}/ai/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc: clean(doc), issues }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save");
      setDirty(false);
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function runRewrite() {
    if (!rewrite?.text.trim()) return;
    setRewrite({ ...rewrite, busy: true });
    try {
      const res = await fetch(`/api/admin/notes/${noteId}/ai/jobs/${jobId}/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionIndex: rewrite.index, instruction: rewrite.text, section: doc.sections[rewrite.index] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Rewrite failed");
      setSection(rewrite.index, data.section);
      toast.success("Section rewritten. Review it, then save.");
      setRewrite(null);
    } catch (e: any) {
      toast.error(e.message);
      setRewrite((r) => (r ? { ...r, busy: false } : r));
    }
  }

  async function createPdf() {
    setRendering(true);
    try {
      if (dirty && !(await save())) return;
      const res = await fetch(`/api/admin/notes/${noteId}/ai/jobs/${jobId}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not start");
      toast.success("Creating the PDF version…");
      onRenderQueued(data.job.id);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRendering(false);
    }
  }

  const openIssues = issues.filter((i) => !i.resolved);
  const flaggedBlocks = new Set(openIssues.filter((i) => i.block !== null).map((i) => `${i.section}:${i.block}`));

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/95 p-3 backdrop-blur">
        <Button size="sm" variant="outline" onClick={save} disabled={saving || !dirty}>
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          {dirty ? "Save draft" : "Saved"}
        </Button>
        <Select value={style.style} onValueChange={(v) => setStyle({ ...style, style: v as RenderStyle["style"] })}>
          <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{NOTE_STYLES.map((s) => <SelectItem key={s} value={s}>{STYLE_LABELS[s]}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={style.paper} onValueChange={(v) => setStyle({ ...style, paper: v as RenderStyle["paper"] })}>
          <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
          <SelectContent>{NOTE_PAPERS.map((p) => <SelectItem key={p} value={p}>{p[0].toUpperCase() + p.slice(1)} paper</SelectItem>)}</SelectContent>
        </Select>
        <Button size="sm" variant="ghost" onClick={() => refreshPreview(doc, style)} disabled={previewing}>
          <RefreshCw className={`mr-2 size-4 ${previewing ? "animate-spin" : ""}`} /> Preview
        </Button>
        <Button size="sm" className="ml-auto" onClick={createPdf} disabled={rendering}>
          {rendering ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FileDown className="mr-2 size-4" />}
          Create PDF version
        </Button>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          {sources.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              Sources:
              {sources.map((s) => (
                <a key={s.id} href={`/api/admin/notes/${noteId}/ai/sources/${s.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 hover:border-primary hover:text-primary">
                  {s.originalName} <ExternalLink className="size-3" />
                </a>
              ))}
            </div>
          )}

          {issues.length > 0 && (
            <div className="rounded-xl border border-orange-300 bg-orange-50/50 p-4 dark:border-orange-500/30 dark:bg-orange-500/5">
              <p className="mb-3 text-sm font-semibold">
                Fact-check: {openIssues.length} of {issues.length} point{issues.length === 1 ? "" : "s"} open
              </p>
              <ul className="space-y-2">
                {issues.map((issue, i) => (
                  <li key={i} className={`rounded-lg bg-card p-3 text-sm ${issue.resolved ? "opacity-50" : ""}`}>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={`border-0 ${SEVERITY[issue.severity]}`}>{issue.severity}</Badge>
                      <button className="text-xs font-medium text-primary hover:underline" onClick={() => sectionRefs.current[issue.section]?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                        {doc.sections[issue.section]?.heading ?? `Section ${issue.section + 1}`}
                        {issue.block !== null ? ` · block ${issue.block + 1}` : ""}
                      </button>
                      <Button size="sm" variant="ghost" className="ml-auto h-7" onClick={() => { setIssues(issues.map((x, k) => (k === i ? { ...x, resolved: !x.resolved } : x))); setDirty(true); }}>
                        <Check className="mr-1 size-3.5" /> {issue.resolved ? "Reopen" : "Mark fixed"}
                      </Button>
                    </div>
                    <p>{issue.problem}</p>
                    {issue.suggestion && <p className="mt-1 text-muted-foreground">Suggestion: {issue.suggestion}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2 rounded-xl border border-border p-4">
            <Input value={doc.title} onChange={(e) => update({ ...doc, title: e.target.value })} className="text-lg font-semibold" placeholder="Title" />
            <Input value={doc.subtitle ?? ""} onChange={(e) => update({ ...doc, subtitle: e.target.value || null })} placeholder="Subtitle (optional)" />
          </div>

          {doc.sections.map((section, si) => (
            <section key={si} ref={(el) => { sectionRefs.current[si] = el; }} className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-2">
                <Input value={section.heading} onChange={(e) => setSection(si, { ...section, heading: e.target.value })} className="font-semibold" />
                <Button variant="ghost" size="icon" aria-label="Move section up" onClick={() => update({ ...doc, sections: moveIn(doc.sections, si, -1) })}><ArrowUp className="size-4" /></Button>
                <Button variant="ghost" size="icon" aria-label="Move section down" onClick={() => update({ ...doc, sections: moveIn(doc.sections, si, 1) })}><ArrowDown className="size-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive" aria-label="Delete section" onClick={() => update({ ...doc, sections: doc.sections.filter((_, k) => k !== si) })}><Trash2 className="size-4" /></Button>
              </div>

              {editable && (
                rewrite?.index === si ? (
                  <div className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 sm:flex-row">
                    <Input autoFocus value={rewrite.text} onChange={(e) => setRewrite({ ...rewrite, text: e.target.value })} placeholder="e.g. Simplify for Class 9, add a worked example, fix the formula for…" onKeyDown={(e) => e.key === "Enter" && runRewrite()} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={runRewrite} disabled={rewrite.busy || !rewrite.text.trim()}>
                        {rewrite.busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Wand2 className="mr-2 size-4" />} Rewrite
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRewrite(null)} disabled={rewrite.busy}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setRewrite({ index: si, text: "", busy: false })}>
                    <Sparkles className="mr-2 size-4" /> Ask AI to rewrite this section
                  </Button>
                )
              )}

              {section.blocks.map((block, bi) => (
                <BlockEditor
                  key={bi}
                  block={block}
                  flagged={flaggedBlocks.has(`${si}:${bi}`)}
                  onChange={(b) => setSection(si, { ...section, blocks: section.blocks.map((x, k) => (k === bi ? b : x)) })}
                  onMove={(dir) => setSection(si, { ...section, blocks: moveIn(section.blocks, bi, dir) })}
                  onDelete={() => setSection(si, { ...section, blocks: section.blocks.filter((_, k) => k !== bi) })}
                />
              ))}

              <div className="flex items-center gap-2">
                <Select value={adding[si] ?? "paragraph"} onValueChange={(v) => setAdding({ ...adding, [si]: v as BlockType })}>
                  <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>{BLOCK_TYPES.map((t) => <SelectItem key={t} value={t}>{BLOCK_TYPE_LABEL[t]}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" variant="ghost" onClick={() => setSection(si, { ...section, blocks: [...section.blocks, emptyBlock(adding[si] ?? "paragraph")] })}>
                  <Plus className="mr-1 size-4" /> Add block
                </Button>
              </div>
            </section>
          ))}

          <Button variant="outline" onClick={() => update({ ...doc, sections: [...doc.sections, { heading: "New section", blocks: [emptyBlock("paragraph")] }] })}>
            <Plus className="mr-2 size-4" /> Add section
          </Button>
        </div>

        <div className="min-w-0 2xl:sticky 2xl:top-20 2xl:h-[calc(100vh-7rem)]">
          <div className="flex h-[75vh] flex-col overflow-hidden rounded-2xl border border-border bg-white 2xl:h-full">
            <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-muted-foreground">
              <span>Preview: how the PDF will look</span>
              {previewing && <Loader2 className="size-3.5 animate-spin" />}
            </div>
            {/* Sandboxed: no scripts, no same-origin access. */}
            <iframe title="Notes preview" sandbox="" srcDoc={preview} className="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
