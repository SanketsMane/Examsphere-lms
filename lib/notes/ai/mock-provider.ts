import "server-only";

import { emptyBlock, type GenerationOptions, type NoteBlock, type NoteDoc, type NoteSection } from "@/lib/notes/ai/doc-schema";
import type { PageExtraction, ReviewResult, WriteResult } from "@/lib/notes/ai/schemas";
import type { AiResult, ExtractInput, NotesAiProvider } from "@/lib/notes/ai/provider";

/**
 * Deterministic stand-in for the AI, for local development and automated tests without an
 * API key. Never used in production unless NOTES_AI_PROVIDER=mock is set explicitly.
 */
export class MockNotesProvider implements NotesAiProvider {
  readonly name = "mock";
  readonly model = "mock";

  private usage() {
    return { model: "mock", inputTokens: 0, outputTokens: 0 };
  }

  async extract(input: ExtractInput): Promise<AiResult<PageExtraction>> {
    const pages = Array.from({ length: input.pageCount }, (_, i) => ({
      page: input.firstPage + i,
      kind: input.kind === "image" ? ("handwritten" as const) : ("printed" as const),
      language: "English" as const,
      legibility: "clear" as const,
      transcript: `# Cell structure (page ${input.firstPage + i} of ${input.label})\n- The cell is the basic unit of life.\n- Mitochondria produce ATP by aerobic respiration.\n- Energy relation: $E = h\\nu$`,
      figures: [{ description: "Labelled animal cell", labels: ["Nucleus", "Mitochondria", "Cell membrane"] }],
      uncertain: [],
    }));
    return { data: { pages }, usage: this.usage() };
  }

  async write(input: { sourceText: string; options: GenerationOptions; part: number; totalParts: number }): Promise<AiResult<WriteResult>> {
    const p = (text: string): NoteBlock => ({ ...emptyBlock("paragraph"), text });
    const sections: NoteSection[] = [
      {
        heading: `The cell: unit of life${input.totalParts > 1 ? ` (part ${input.part})` : ""}`,
        blocks: [
          p("The **cell** is the ==smallest unit that can carry out all life processes==."),
          { ...emptyBlock("definition"), term: "Cell theory", text: "All living things are made of cells, and new cells come from existing cells." },
          { ...emptyBlock("bullets"), items: ["Prokaryotic cells have no nucleus", "Eukaryotic cells have a membrane-bound nucleus", "Mitochondria make **ATP**"] },
          { ...emptyBlock("formula"), latex: "E = h\\nu = \\frac{hc}{\\lambda}", caption: "Energy of a photon" },
          ...(input.options.includeDiagrams
            ? [
                {
                  ...emptyBlock("diagram"),
                  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 260"><ellipse cx="300" cy="130" rx="220" ry="100" stroke="#1e3a8a" stroke-width="2" fill="#eff6ff"/><circle cx="300" cy="130" r="40" stroke="#1e3a8a" stroke-width="2" fill="#dbeafe"/><ellipse cx="420" cy="90" rx="35" ry="16" stroke="#1e3a8a" stroke-width="2" fill="none"/><text x="300" y="136" font-size="18" font-family="Kalam" text-anchor="middle" fill="#1e3a8a">Nucleus</text><text x="470" y="60" font-size="18" font-family="Kalam" fill="#1e3a8a">Mitochondria</text></svg>`,
                  caption: "Simplified animal cell",
                },
              ]
            : []),
          { ...emptyBlock("callout"), variant: "exam", text: "NEET often asks which organelle is called the powerhouse of the cell." },
          { ...emptyBlock("callout"), variant: "mnemonic", text: "**M**ighty **M**itochondria **M**ake energy." },
          { ...emptyBlock("table"), headers: ["Feature", "Prokaryote", "Eukaryote"], rows: [["Nucleus", "Absent", "Present"], ["Size", "1-10 μm", "10-100 μm"]], caption: null },
          ...(input.options.includeQuestions
            ? [{ ...emptyBlock("qa"), question: "Why is the mitochondrion called the powerhouse of the cell?", answer: "Because it produces most of the cell's ATP through aerobic respiration." }]
            : []),
        ],
      },
    ];
    return { data: { sections }, usage: this.usage() };
  }

  async review(input: { sections: NoteSection[] }): Promise<AiResult<ReviewResult>> {
    return {
      data: {
        issues: input.sections.length
          ? [{ section: 0, block: 1, severity: "low", problem: "Cell theory could mention Schleiden, Schwann and Virchow.", suggestion: "Add the scientists' names." }]
          : [],
      },
      usage: this.usage(),
    };
  }

  async rewriteSection(input: { section: NoteSection; instruction: string }): Promise<AiResult<NoteSection>> {
    return {
      data: {
        heading: input.section.heading,
        blocks: [...input.section.blocks, { ...emptyBlock("callout"), variant: "tip", text: `Rewritten as asked: ${input.instruction}` }],
      },
      usage: this.usage(),
    };
  }

  async suggestTitle(input: { doc: Pick<NoteDoc, "sections"> }) {
    return { data: { title: input.doc.sections[0]?.heading ?? "Study notes", subtitle: "Generated notes" }, usage: this.usage() };
  }
}
