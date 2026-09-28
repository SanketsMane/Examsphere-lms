import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Stethoscope,
  Target,
} from "lucide-react";

export type CourseAccent = "navy" | "orange" | "green";

/** Short program cards shown near the top of the homepage (Phase 1). */
export interface ProgramCardData {
  id: string;
  icon: LucideIcon;
  accent: CourseAccent;
  title: string;
  subtitle?: string;
  points: string[];
  href: string;
}

export const PROGRAM_CARDS: ProgramCardData[] = [
  {
    id: "competitive",
    icon: Target,
    accent: "navy",
    title: "Competitive Exams",
    subtitle: "JEE / NEET",
    points: [
      "JEE (Main & Advanced)",
      "NEET (UG)",
      "Olympiads",
      "Crash Courses & Test Series",
    ],
    href: "/programs#competitive",
  },
  {
    id: "foundation",
    icon: BookOpen,
    accent: "orange",
    title: "Foundation",
    points: [
      "Classes 6 – 10",
      "NTSE",
      "Olympiad Preparation",
      "Concept Building",
      "Strong Fundamentals",
    ],
    href: "/programs#foundation",
  },
  {
    id: "mbbs",
    icon: Stethoscope,
    accent: "green",
    title: "MBBS",
    points: [
      "University Subjects",
      "Exam Preparation",
      "Clinical Learning",
      "Notes & Question Bank",
      "High Yield Revision",
    ],
    href: "/programs#mbbs",
  },
];
