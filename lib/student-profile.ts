/**
 * What "complete" means for an ExamSphere student profile (BUG-0007). Shared by the dashboard's
 * Profile Status card and the Settings page so both count the same fields.
 */

export type StudentProfileFields = {
  targetProgram?: string | null;
  currentClass?: string | null;
  targetYear?: number | null;
  board?: string | null;
  institution?: string | null;
  city?: string | null;
  state?: string | null;
  contactPhone?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
};

/** School students (Class 6–12 and droppers) get board and guardian questions; MBBS students don't. */
export function isSchoolStudent(profile: StudentProfileFields | null | undefined): boolean {
  const cls = profile?.currentClass ?? "";
  return cls.startsWith("Class") || cls.startsWith("12th");
}

export function studentProfileChecklist(
  user: { name?: string | null },
  profile: StudentProfileFields | null | undefined
) {
  const p = profile ?? {};
  const items = [
    { label: "Name", done: !!user.name?.trim() },
    { label: "Phone", done: !!p.contactPhone?.trim() },
    { label: "Target Programme", done: !!p.targetProgram },
    { label: "Current Class", done: !!p.currentClass },
    { label: "Target Year", done: !!p.targetYear },
    { label: "School / College", done: !!p.institution?.trim() },
    { label: "City & State", done: !!p.city?.trim() && !!p.state?.trim() },
  ];
  if (isSchoolStudent(p)) {
    items.push(
      { label: "Board", done: !!p.board },
      { label: "Parent / Guardian", done: !!p.guardianName?.trim() && !!p.guardianPhone?.trim() }
    );
  }
  const completed = items.filter((i) => i.done).length;
  return { items, percentage: Math.round((completed / items.length) * 100) };
}
