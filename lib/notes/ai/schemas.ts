import { z } from "zod";
import { noteSectionSchema } from "@/lib/notes/ai/doc-schema";

/** Structured-output schemas for each AI step (all fields required; optional = nullable). */

export const pageExtractionSchema = z.object({
  pages: z.array(
    z.object({
      page: z.number().int(),
      kind: z.enum(["printed", "handwritten", "mixed"]),
      language: z.enum(["English", "Hindi", "Hinglish", "Other"]),
      legibility: z.enum(["clear", "partial", "poor"]),
      transcript: z.string(),
      figures: z.array(z.object({ description: z.string(), labels: z.array(z.string()) })),
      uncertain: z.array(z.string()),
    })
  ),
});
export type PageExtraction = z.infer<typeof pageExtractionSchema>;
export type ExtractedPage = PageExtraction["pages"][number];

export const writeResultSchema = z.object({
  sections: z.array(noteSectionSchema),
});
export type WriteResult = z.infer<typeof writeResultSchema>;

export const reviewResultSchema = z.object({
  issues: z.array(
    z.object({
      section: z.number().int(),
      block: z.number().int().nullable(),
      severity: z.enum(["high", "medium", "low"]),
      problem: z.string(),
      suggestion: z.string(),
    })
  ),
});
export type ReviewResult = z.infer<typeof reviewResultSchema>;
export type ReviewIssue = ReviewResult["issues"][number];

export const titleResultSchema = z.object({ title: z.string(), subtitle: z.string().nullable() });
