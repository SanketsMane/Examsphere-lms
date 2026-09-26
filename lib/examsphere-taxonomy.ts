/**
 * ExamSphere's own vocabulary: the programmes it runs, the subjects its teachers cover and the
 * details that matter about a student. One source for the teacher signup dropdowns, the student
 * profile and the course categories, so none of them drift back to generic LMS options.
 */

// Course categories shown in Browse Courses. `slug` is stable; `name` is also what
// Course.category stores.
export const PROGRAM_CATEGORIES = [
  { name: "JEE", slug: "jee", description: "JEE Main & Advanced preparation" },
  { name: "NEET", slug: "neet", description: "NEET-UG preparation" },
  { name: "Foundation (Class 6–10)", slug: "foundation", description: "School foundation for classes 6 to 10" },
  { name: "MBBS", slug: "mbbs", description: "MBBS university subjects" },
] as const;

export const PROGRAM_CATEGORY_NAMES = PROGRAM_CATEGORIES.map((c) => c.name);

// Teacher "Expertise Areas": the subjects and exam tracks ExamSphere teaches.
export const EXPERTISE_AREAS = [
  "Physics",
  "Chemistry",
  "Mathematics",
  "Biology",
  "Botany",
  "Zoology",
  "JEE Main",
  "JEE Advanced",
  "NEET-UG",
  "Foundation Science (Class 6–10)",
  "Foundation Mathematics (Class 6–10)",
  "Anatomy",
  "Physiology",
  "Biochemistry",
  "Pathology",
  "Pharmacology",
  "Microbiology",
  "Forensic Medicine",
  "Community Medicine",
  "Medicine",
  "Surgery",
  "Obstetrics & Gynaecology",
  "Paediatrics",
] as const;

export const TEACHING_LANGUAGES = [
  "English",
  "Hindi",
  "Marathi",
  "Bengali",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Gujarati",
  "Punjabi",
  "Odia",
  "Urdu",
] as const;

// Student profile options.
export const TARGET_PROGRAMS = ["JEE", "NEET", "Foundation", "MBBS"] as const;
export type TargetProgram = (typeof TARGET_PROGRAMS)[number];

export const CURRENT_CLASSES = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "12th Pass (Dropper)",
  "MBBS 1st Year",
  "MBBS 2nd Year",
  "MBBS 3rd Year",
  "MBBS Final Year",
] as const;

export const BOARDS = ["CBSE", "ICSE", "State Board", "IB", "Other"] as const;
