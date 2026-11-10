import { z } from "zod";
import { MAX_COURSE_PRICE } from "@/lib/money";

/** Shared (client + server) rules for the notes module. */

export const NOTE_LANGUAGES = ["English", "Hindi", "Hinglish"] as const;
export const NOTE_ACCESS_TYPES = ["FREE", "PAID", "COURSE_ONLY"] as const;
export const NOTE_STATUSES = ["DRAFT", "PROCESSING", "REVIEW", "PUBLISHED", "ARCHIVED"] as const;

/** Upload limits. nginx allows 50 MB request bodies, so stay under that. */
export const MAX_NOTE_PDF_BYTES = 45 * 1024 * 1024;
export const MAX_NOTE_PAGES = 1000;
export const MAX_COVER_BYTES = 5 * 1024 * 1024;
export const COVER_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const slugRule = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Slug must be at least 3 characters")
  .max(120, "Slug must be at most 120 characters")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

/**
 * Prices are entered in whole rupees and stored in paise. Whole rupees keep wallet
 * payments possible (the wallet holds whole rupees).
 */
const rupees = z.coerce
  .number<string | number>()
  .int("Use whole rupees (no paise)")
  .min(0, "Price cannot be negative")
  .max(MAX_COURSE_PRICE);

export const noteFormSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
    slug: slugRule,
    shortDescription: z.string().trim().max(300, "Keep the summary under 300 characters").optional().default(""),
    description: z.string().trim().max(20000).optional().default(""),
    program: z.string().trim().max(100).optional().default(""),
    subject: z.string().trim().max(100).optional().default(""),
    chapter: z.string().trim().max(200).optional().default(""),
    language: z.enum(NOTE_LANGUAGES).default("English"),
    accessType: z.enum(NOTE_ACCESS_TYPES),
    priceRupees: rupees.default(0),
    discountPriceRupees: rupees.optional(),
    previewPages: z.coerce.number<string | number>().int().min(0).max(20).default(2),
    allowDownload: z.boolean().default(false),
    maxDownloads: z.coerce.number<string | number>().int().min(1).max(50).default(3),
    isFeatured: z.boolean().default(false),
  })
  .superRefine((v, ctx) => {
    if (v.accessType === "PAID" && v.priceRupees < 1) {
      ctx.addIssue({ code: "custom", path: ["priceRupees"], message: "A paid note needs a price of at least ₹1" });
    }
    if (v.discountPriceRupees !== undefined && v.discountPriceRupees !== null) {
      if (v.accessType !== "PAID") {
        ctx.addIssue({ code: "custom", path: ["discountPriceRupees"], message: "Only paid notes can have a discount" });
      } else if (v.discountPriceRupees < 1 || v.discountPriceRupees >= v.priceRupees) {
        ctx.addIssue({
          code: "custom",
          path: ["discountPriceRupees"],
          message: "Discount price must be at least ₹1 and lower than the price",
        });
      }
    }
  });

export type NoteFormInput = z.input<typeof noteFormSchema>;
export type NoteFormValues = z.output<typeof noteFormSchema>;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/** What the student pays, in paise. */
export function effectiveNotePricePaise(note: { pricePaise: number; discountPricePaise: number | null }): number {
  if (note.discountPricePaise && note.discountPricePaise > 0 && note.discountPricePaise < note.pricePaise) {
    return note.discountPricePaise;
  }
  return note.pricePaise;
}

export function formatRupeesFromPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
