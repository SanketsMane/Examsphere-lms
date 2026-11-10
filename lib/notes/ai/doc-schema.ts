import { z } from "zod";

/**
 * Structured notes ("NoteDoc"): what the AI writes, the admin edits and the renderer draws.
 * Shared by server and client (no server-only imports).
 *
 * Blocks use one flat shape with nullable fields instead of a union: simpler for structured
 * outputs and for the editor. Which fields are used depends on `type`:
 *   paragraph  text
 *   bullets    items            numbered  items
 *   definition term + text
 *   formula    latex (+ caption)
 *   table      headers + rows (+ caption)
 *   diagram    svg (+ caption)
 *   callout    variant + text
 *   qa         question + answer
 * Text fields may use **bold**, ==highlight== and inline $LaTeX$.
 */

export const BLOCK_TYPES = ["paragraph", "bullets", "numbered", "definition", "formula", "table", "diagram", "callout", "qa"] as const;
export const CALLOUT_VARIANTS = ["tip", "exam", "mistake", "mnemonic", "remember"] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];
export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];

export const noteBlockSchema = z.object({
  type: z.enum(BLOCK_TYPES),
  text: z.string().nullable(),
  items: z.array(z.string()).nullable(),
  term: z.string().nullable(),
  latex: z.string().nullable(),
  headers: z.array(z.string()).nullable(),
  rows: z.array(z.array(z.string())).nullable(),
  svg: z.string().nullable(),
  caption: z.string().nullable(),
  variant: z.enum(CALLOUT_VARIANTS).nullable(),
  question: z.string().nullable(),
  answer: z.string().nullable(),
});

export const noteSectionSchema = z.object({
  heading: z.string(),
  blocks: z.array(noteBlockSchema),
});

export const noteDocSchema = z.object({
  title: z.string(),
  subtitle: z.string().nullable(),
  sections: z.array(noteSectionSchema),
});

export type NoteBlock = z.infer<typeof noteBlockSchema>;
export type NoteSection = z.infer<typeof noteSectionSchema>;
export type NoteDoc = z.infer<typeof noteDocSchema>;

export function emptyBlock(type: BlockType): NoteBlock {
  const b: NoteBlock = {
    type,
    text: null,
    items: null,
    term: null,
    latex: null,
    headers: null,
    rows: null,
    svg: null,
    caption: null,
    variant: null,
    question: null,
    answer: null,
  };
  if (type === "paragraph") b.text = "";
  if (type === "bullets" || type === "numbered") b.items = [""];
  if (type === "definition") Object.assign(b, { term: "", text: "" });
  if (type === "formula") b.latex = "";
  if (type === "table") Object.assign(b, { headers: ["", ""], rows: [["", ""]] });
  if (type === "diagram") b.svg = "";
  if (type === "callout") Object.assign(b, { variant: "tip", text: "" });
  if (type === "qa") Object.assign(b, { question: "", answer: "" });
  return b;
}

/** Generation options chosen by the admin. */
export const NOTE_DEPTHS = ["detailed", "revision", "formula", "qa"] as const;
export const NOTE_STYLES = ["notebook", "topper", "clean"] as const;
export const NOTE_PAPERS = ["ruled", "grid", "plain"] as const;

export const generationOptionsSchema = z.object({
  depth: z.enum(NOTE_DEPTHS).default("detailed"),
  language: z.enum(["English", "Hindi", "Hinglish"]).default("English"),
  exam: z.string().trim().max(60).default("General"),
  audience: z.string().trim().max(120).default(""),
  includeQuestions: z.boolean().default(true),
  includeDiagrams: z.boolean().default(true),
  extraInstructions: z.string().trim().max(1000).default(""),
});
export type GenerationOptions = z.output<typeof generationOptionsSchema>;

export const renderStyleSchema = z.object({
  style: z.enum(NOTE_STYLES).default("notebook"),
  paper: z.enum(NOTE_PAPERS).default("ruled"),
});
export type RenderStyle = z.output<typeof renderStyleSchema>;

export const DEPTH_LABELS: Record<(typeof NOTE_DEPTHS)[number], string> = {
  detailed: "Detailed chapter notes",
  revision: "Short revision notes",
  formula: "Formula & key-facts sheet",
  qa: "Question & answer notes",
};
export const STYLE_LABELS: Record<(typeof NOTE_STYLES)[number], string> = {
  notebook: "Blue-ink notebook",
  topper: "Colourful topper's notes",
  clean: "Clean typed",
};
