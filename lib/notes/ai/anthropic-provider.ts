import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { noteSectionSchema, type GenerationOptions, type NoteDoc, type NoteSection } from "@/lib/notes/ai/doc-schema";
import {
  pageExtractionSchema,
  reviewResultSchema,
  titleResultSchema,
  writeResultSchema,
} from "@/lib/notes/ai/schemas";
import { EXTRACT_SYSTEM, REVIEW_SYSTEM, TITLE_SYSTEM, rewriteSystem, writeSystem } from "@/lib/notes/ai/prompts";
import { AiRefusalError, type AiResult, type ExtractInput, type NotesAiProvider } from "@/lib/notes/ai/provider";

type Effort = "low" | "medium" | "high";

/**
 * Claude via the official SDK. Every call uses structured outputs (validated against a Zod schema)
 * and the server-side refusal fallback, and checks stop_reason before reading the result.
 * Calls stay non-streaming with max_tokens 16000 (above ~21k the SDK requires streaming), which is
 * why long sources are written in parts.
 */
export class AnthropicNotesProvider implements NotesAiProvider {
  readonly name = "anthropic";
  private client = new Anthropic({ maxRetries: 3, timeout: 10 * 60 * 1000 });

  constructor(readonly model: string) {}

  private async call<T>(args: {
    schema: z.ZodType<T>;
    system: string;
    content: Anthropic.Beta.BetaContentBlockParam[];
    effort: Effort;
    cacheSystem?: boolean;
  }): Promise<AiResult<T>> {
    const response = await this.client.beta.messages.parse({
      model: this.model,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      // Re-runs the request on a suitable model if this one declines (billed at that model's rates).
      fallbacks: "default",
      system: [{ type: "text", text: args.system, ...(args.cacheSystem ? { cache_control: { type: "ephemeral" as const } } : {}) }],
      messages: [{ role: "user", content: args.content }],
      output_config: { effort: args.effort, format: betaZodOutputFormat(args.schema) },
    });

    if (response.stop_reason === "refusal") {
      throw new AiRefusalError(response.stop_details?.explanation || "The model declined to process this material.");
    }
    if (response.stop_reason === "max_tokens") {
      throw new Error("The AI response was cut off (too long). Split the source into smaller uploads.");
    }
    if (!response.parsed_output) throw new Error("The AI returned an unreadable response.");

    return {
      data: response.parsed_output as T,
      usage: {
        model: response.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      },
    };
  }

  extract(input: ExtractInput) {
    const source: Anthropic.Beta.BetaContentBlockParam =
      input.kind === "pdf"
        ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: input.base64 } }
        : { type: "image", source: { type: "base64", media_type: input.mediaType as "image/jpeg", data: input.base64 } };
    return this.call({
      schema: pageExtractionSchema,
      system: EXTRACT_SYSTEM,
      effort: "medium",
      cacheSystem: true,
      content: [
        source,
        {
          type: "text",
          text: `Source: ${input.label}. Transcribe ${input.pageCount === 1 ? "this page" : `these ${input.pageCount} pages`}; number them starting at ${input.firstPage}.`,
        },
      ],
    });
  }

  write(input: { sourceText: string; options: GenerationOptions; part: number; totalParts: number; earlierHeadings: string[] }) {
    const context =
      input.totalParts > 1
        ? `This is part ${input.part} of ${input.totalParts} of the source. Write notes for this part only.${
            input.earlierHeadings.length ? ` Sections already written for earlier parts (do not repeat them): ${input.earlierHeadings.join("; ")}.` : ""
          }`
        : "This is the whole source.";
    return this.call({
      schema: writeResultSchema,
      system: writeSystem(input.options),
      effort: "high",
      content: [{ type: "text", text: `<source>\n${input.sourceText}\n</source>\n\n${context}` }],
    });
  }

  review(input: { sourceText: string; sections: NoteSection[] }) {
    return this.call({
      schema: reviewResultSchema,
      system: REVIEW_SYSTEM,
      effort: "high",
      content: [
        { type: "text", text: `<source>\n${input.sourceText}\n</source>` },
        { type: "text", text: `<draft>\n${JSON.stringify({ sections: input.sections })}\n</draft>` },
      ],
    });
  }

  rewriteSection(input: { sourceText: string; section: NoteSection; instruction: string; options: GenerationOptions }) {
    return this.call({
      schema: noteSectionSchema,
      system: rewriteSystem(input.options),
      effort: "high",
      content: [
        // Same source for every rewrite of this job: cache it.
        { type: "text", text: `<source>\n${input.sourceText}\n</source>`, cache_control: { type: "ephemeral" } },
        { type: "text", text: `<section>\n${JSON.stringify(input.section)}\n</section>\n\n<instruction>\n${input.instruction}\n</instruction>` },
      ],
    });
  }

  suggestTitle(input: { doc: Pick<NoteDoc, "sections"> }) {
    return this.call({
      schema: titleResultSchema,
      system: TITLE_SYSTEM,
      effort: "low",
      content: [{ type: "text", text: input.doc.sections.map((s) => `- ${s.heading}`).join("\n") }],
    });
  }
}
