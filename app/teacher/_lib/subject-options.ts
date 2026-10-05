import "server-only";

import { prisma } from "@/lib/db";
import { EXPERTISE_AREAS } from "@/lib/examsphere-taxonomy";

export type SubjectOption = { id: string; name: string; isFallback?: boolean };

/**
 * Subjects for session/group/template forms. The Subject table is admin-managed and is
 * often empty, which left these dropdowns with no options; fall back to the canonical
 * expertise list the same way getTeacherSignupOptions does. Fallback options have no
 * Subject row, so `isFallback` tells callers not to send the id as a foreign key.
 */
export async function getTeacherSubjectOptions(): Promise<SubjectOption[]> {
  const rows = await prisma.subject
    .findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    })
    .catch((error) => {
      console.error("Error loading subjects:", error);
      return [] as { id: string; name: string }[];
    });

  if (rows.length > 0) return rows;
  return EXPERTISE_AREAS.map((name) => ({ id: name, name, isFallback: true }));
}
