import "server-only";

import type { GenerationOptions, NoteDoc, NoteSection } from "@/lib/notes/ai/doc-schema";
import type { PageExtraction, ReviewResult, WriteResult } from "@/lib/notes/ai/schemas";
import type { TokenUsage } from "@/lib/notes/ai/pricing";

/** What the notes pipeline needs from an AI model. Implementations: Anthropic (Claude) and a mock. */

export interface ExtractInput {
  kind: "pdf" | "image";
  base64: string;
  mediaType: string;
  firstPage: number;
  pageCount: number;
  label: string;
}

export interface AiResult<T> {
  data: T;
  usage: TokenUsage;
}

export interface NotesAiProvider {
  readonly name: string;
  readonly model: string;
  extract(input: ExtractInput): Promise<AiResult<PageExtraction>>;
  write(input: { sourceText: string; options: GenerationOptions; part: number; totalParts: number; earlierHeadings: string[] }): Promise<AiResult<WriteResult>>;
  review(input: { sourceText: string; sections: NoteSection[] }): Promise<AiResult<ReviewResult>>;
  rewriteSection(input: { sourceText: string; section: NoteSection; instruction: string; options: GenerationOptions }): Promise<AiResult<NoteSection>>;
  suggestTitle(input: { doc: Pick<NoteDoc, "sections"> }): Promise<AiResult<{ title: string; subtitle: string | null }>>;
}

export class AiNotConfiguredError extends Error {}
export class AiRefusalError extends Error {}

/**
 * NOTES_AI_PROVIDER=anthropic | mock. In production the default is Anthropic and a missing key
 * is an error; the mock is used only when explicitly chosen or in local development without a key.
 */
export async function getNotesAiProvider(model: string): Promise<NotesAiProvider> {
  const choice = (process.env.NOTES_AI_PROVIDER || "").toLowerCase();
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  const useMock = choice === "mock" || (!choice && !hasKey && process.env.NODE_ENV !== "production");
  if (useMock) {
    const { MockNotesProvider } = await import("@/lib/notes/ai/mock-provider");
    return new MockNotesProvider();
  }
  if (!hasKey) throw new AiNotConfiguredError("AI is not configured: set ANTHROPIC_API_KEY on the server.");
  const { AnthropicNotesProvider } = await import("@/lib/notes/ai/anthropic-provider");
  return new AnthropicNotesProvider(model);
}
