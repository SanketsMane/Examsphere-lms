import "server-only";

import DOMPurify from "isomorphic-dompurify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { ApiResponse } from "@/lib/types";
import {
  adminCourseSchema,
  teacherCourseSchema,
  type AdminCourseSchemaType,
  type TeacherCourseSchemaType,
} from "@/lib/zodSchemas";

/**
 * Shared, safe course write helpers.
 *
 * The admin and teacher course actions were near-duplicates that had drifted
 * apart: only one sanitised the description, only one enforced the plan limit,
 * and both spread `...validation.data` straight into Prisma. Centralising the
 * risky parts here keeps the two paths from diverging again.
 */

/** Flatten a ZodError into `{ field: firstMessage }` for the form to render. */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * Description is rich-text HTML rendered back into the page, so it must be
 * sanitised on the way in. The admin path previously skipped this entirely,
 * which made an admin-authored course a stored-XSS vector.
 */
export function sanitizeDescription(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

/**
 * Build the exact column set we are willing to write.
 *
 * Explicit, not a spread: a spread lets any field the schema happens to accept
 * reach the database, which is how `status` and `isFeatured` became settable by
 * teachers. Adding a field here must be a deliberate act.
 */
export function buildCourseData(
  input: TeacherCourseSchemaType | AdminCourseSchemaType,
  privileged: { status: string; isFeatured: boolean }
) {
  return {
    title: input.title,
    description: sanitizeDescription(input.description),
    smallDescription: input.smallDescription,
    fileKey: input.fileKey,
    price: input.price,
    duration: input.duration,
    level: input.level,
    category: input.category,
    slug: input.slug,
    language: input.language ?? null,
    prerequisites: input.prerequisites ?? null,
    // Previously hardcoded to `[]` *after* the spread, silently discarding
    // whatever the user entered.
    tags: input.tags ?? [],
    learningOutcomes: input.learningOutcomes ?? [],
    discountPrice: input.discountPrice ?? null,
    discountExpiry: input.discountExpiry ?? null,
    status: privileged.status as any,
    isFeatured: privileged.isFeatured,
  };
}

/**
 * Map a Prisma write failure onto a message the user can act on.
 *
 * The previous `catch {}` collapsed everything — including a duplicate slug,
 * by far the most common failure — into "Failed to create course", leaving the
 * user with no idea what to change.
 */
export function handleCourseWriteError(
  error: unknown,
  context: { action: string; userId?: string; slug?: string }
): ApiResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[] | string | undefined) ?? "";
      const onSlug = Array.isArray(target) ? target.includes("slug") : String(target).includes("slug");
      if (onSlug) {
        return {
          status: "error",
          message: "That URL slug is already taken. Please choose a different one.",
          fieldErrors: { slug: "This slug is already in use" },
        };
      }
      return { status: "error", message: "A course with these details already exists." };
    }
    if (error.code === "P2025") {
      return { status: "error", message: "Course not found." };
    }
    if (error.code === "P2003") {
      return { status: "error", message: "Invalid category selected." };
    }
  }

  // Anything unrecognised is a genuine server fault: log it with context, but
  // return a generic message rather than leaking internals to the client.
  logger.error?.(`${context.action} failed`, {
    userId: context.userId,
    slug: context.slug,
    error: error instanceof Error ? error.message : String(error),
  });
  console.error(`[${context.action}]`, error);

  return {
    status: "error",
    message: "Something went wrong while saving the course. Please try again.",
  };
}

export { adminCourseSchema, teacherCourseSchema };
