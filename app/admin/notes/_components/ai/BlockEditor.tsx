"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CALLOUT_VARIANTS, type NoteBlock } from "@/lib/notes/ai/doc-schema";

const TYPE_LABEL: Record<NoteBlock["type"], string> = {
  paragraph: "Paragraph",
  bullets: "Bullet list",
  numbered: "Numbered list",
  definition: "Definition",
  formula: "Formula",
  table: "Table",
  diagram: "Diagram",
  callout: "Callout",
  qa: "Question & answer",
};
export const BLOCK_TYPE_LABEL = TYPE_LABEL;

const tableToText = (b: NoteBlock) =>
  [(b.headers ?? []).join(" | "), ...(b.rows ?? []).map((r) => r.join(" | "))].join("\n");
const textToTable = (t: string) => {
  const lines = t.split("\n").map((l) => l.split("|").map((c) => c.trim()));
  return { headers: lines[0] ?? [], rows: lines.slice(1).filter((r) => r.some(Boolean)) };
};

export function BlockEditor({
  block,
  onChange,
  onMove,
  onDelete,
  flagged,
}: {
  block: NoteBlock;
  onChange: (b: NoteBlock) => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
  flagged?: boolean;
}) {
  const set = (patch: Partial<NoteBlock>) => onChange({ ...block, ...patch });
  const mono = "font-mono text-xs";

  return (
    <div className={`rounded-xl border p-3 ${flagged ? "border-orange-400 bg-orange-50/60 dark:bg-orange-500/10" : "border-border bg-card"}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{TYPE_LABEL[block.type]}</span>
        <div className="flex">
          <Button variant="ghost" size="icon" className="size-7" aria-label="Move up" onClick={() => onMove(-1)}><ArrowUp className="size-3.5" /></Button>
          <Button variant="ghost" size="icon" className="size-7" aria-label="Move down" onClick={() => onMove(1)}><ArrowDown className="size-3.5" /></Button>
          <Button variant="ghost" size="icon" className="size-7 text-destructive" aria-label="Delete block" onClick={onDelete}><Trash2 className="size-3.5" /></Button>
        </div>
      </div>

      {block.type === "paragraph" && <Textarea rows={3} value={block.text ?? ""} onChange={(e) => set({ text: e.target.value })} />}

      {(block.type === "bullets" || block.type === "numbered") && (
        <Textarea
          rows={Math.min(10, Math.max(3, (block.items ?? []).length + 1))}
          value={(block.items ?? []).join("\n")}
          onChange={(e) => set({ items: e.target.value.split("\n") })}
          placeholder="One item per line"
        />
      )}

      {block.type === "definition" && (
        <div className="space-y-2">
          <Input value={block.term ?? ""} onChange={(e) => set({ term: e.target.value })} placeholder="Term" />
          <Textarea rows={2} value={block.text ?? ""} onChange={(e) => set({ text: e.target.value })} placeholder="Meaning" />
        </div>
      )}

      {block.type === "formula" && (
        <div className="space-y-2">
          <Input className={mono} value={block.latex ?? ""} onChange={(e) => set({ latex: e.target.value })} placeholder="LaTeX, e.g. F = ma" />
          <Input value={block.caption ?? ""} onChange={(e) => set({ caption: e.target.value || null })} placeholder="Caption (optional)" />
        </div>
      )}

      {block.type === "table" && (
        <div className="space-y-2">
          <Textarea className={mono} rows={Math.min(10, (block.rows?.length ?? 1) + 2)} value={tableToText(block)} onChange={(e) => set(textToTable(e.target.value))} />
          <p className="text-xs text-muted-foreground">First line is the header. Separate cells with |</p>
          <Input value={block.caption ?? ""} onChange={(e) => set({ caption: e.target.value || null })} placeholder="Caption (optional)" />
        </div>
      )}

      {block.type === "diagram" && (
        <div className="grid gap-3 md:grid-cols-[1fr_200px]">
          <div className="space-y-2">
            <Textarea className={mono} rows={6} value={block.svg ?? ""} onChange={(e) => set({ svg: e.target.value })} placeholder="<svg viewBox=...>" />
            <Input value={block.caption ?? ""} onChange={(e) => set({ caption: e.target.value || null })} placeholder="Caption" />
          </div>
          {block.svg && /<svg[\s>]/i.test(block.svg) && (
            // An <img> never runs scripts inside the SVG, so this preview is safe.
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="Diagram preview" className="w-full rounded-lg border border-border bg-white p-2" src={`data:image/svg+xml;utf8,${encodeURIComponent(block.svg.includes("xmlns=") ? block.svg : block.svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'))}`} />
          )}
        </div>
      )}

      {block.type === "callout" && (
        <div className="space-y-2">
          <Select value={block.variant ?? "tip"} onValueChange={(v) => set({ variant: v as NoteBlock["variant"] })}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CALLOUT_VARIANTS.map((v) => <SelectItem key={v} value={v}>{{ tip: "Tip", exam: "Exam point", mistake: "Common mistake", mnemonic: "Mnemonic", remember: "Remember" }[v]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea rows={2} value={block.text ?? ""} onChange={(e) => set({ text: e.target.value })} />
        </div>
      )}

      {block.type === "qa" && (
        <div className="space-y-2">
          <Input value={block.question ?? ""} onChange={(e) => set({ question: e.target.value })} placeholder="Question" />
          <Textarea rows={2} value={block.answer ?? ""} onChange={(e) => set({ answer: e.target.value })} placeholder="Answer" />
        </div>
      )}
    </div>
  );
}
