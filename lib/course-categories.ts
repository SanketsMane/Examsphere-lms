import "server-only";

import { prisma } from "@/lib/db";
import { courseCategories } from "@/lib/zodSchemas";

/**
 * Course categories.
 *
 * The create/edit forms populate their dropdown from the `Category` table, but that
 * table can be empty — and was, which left the dropdown with no options while
 * `category` is a required field. Course creation was therefore impossible for both
 * admins and teachers.
 *
 * These helpers give a single source of truth: whatever the DB holds, falling back to
 * the built-in list so the form is never unusable. Validation uses the same union, so
 * the form can never offer an option the server would reject.
 */

export type CourseCategoryOption = { id: string; name: string };

/** Options for the form. DB rows first; built-in list when the table is empty. */
export async function getCourseCategoryOptions(): Promise<CourseCategoryOption[]> {
  const rows = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  if (rows.length > 0) return rows;

  // Fallback keeps the form usable before an admin has created any categories.
  return courseCategories.map((name) => ({ id: `builtin:${name}`, name }));
}

/** Every category name currently accepted, DB plus built-ins. */
export async function getAllowedCategoryNames(): Promise<Set<string>> {
  const rows = await prisma.category.findMany({ select: { name: true } });
  return new Set<string>([...rows.map((r) => r.name), ...courseCategories]);
}

/**
 * @returns null when valid, or a user-facing message when not.
 * Accepting an arbitrary string would let a course land in a category that no
 * listing or filter can ever surface.
 */
export async function assertValidCategory(category: string): Promise<string | null> {
  const allowed = await getAllowedCategoryNames();
  return allowed.has(category) ? null : "Please choose a valid category";
}
