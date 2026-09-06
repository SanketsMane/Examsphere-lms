import type { LucideIcon } from "lucide-react";
import {
  Video,
  FlaskConical,
  FilePen,
  LineChart,
  BookOpen,
  MessagesSquare,
  Dna,
  TestTube,
  BarChart3,
  Layers,
  Presentation,
  Trophy,
  Puzzle,
  FileText,
  Users,
  BookMarked,
  Stethoscope,
  NotebookPen,
  ClipboardList,
  RefreshCw,
  Target,
} from "lucide-react";

export type CourseAccent = "navy" | "orange" | "green";

export interface CourseSectionData {
  id: "jee" | "neet" | "foundation" | "mbbs";
  tag: string;
  title: string;
  description: string;
  accent: CourseAccent;
  keyFeatures: { icon: LucideIcon; label: string }[];
  outcomes: string[];
  details: { duration: string; mode: string; level: string; language: string };
  mentor: { initials: string; name: string; role: string };
  price?: { now: string; was?: string };
  /** Where the "Enroll Now" button leads. */
  enrollHref: string;
}

export const COURSE_SECTIONS: CourseSectionData[] = [
  {
    id: "jee",
    tag: "Competitive Exams",
    title: "JEE (Main & Advanced)",
    description:
      "A rigorous, structured programme for Physics, Chemistry and Mathematics designed to take you from fundamentals to advanced problem solving for India's toughest engineering entrance exam.",
    accent: "navy",
    keyFeatures: [
      { icon: Video, label: "Daily Live Classes" },
      { icon: FlaskConical, label: "Concept-Based Learning" },
      { icon: FilePen, label: "Weekly Mock Tests" },
      { icon: LineChart, label: "Rank Predictor & Analytics" },
      { icon: BookOpen, label: "Printed & Digital Notes" },
      { icon: MessagesSquare, label: "24x7 Doubt Support" },
    ],
    outcomes: [
      "Build strong conceptual clarity across PCM",
      "Master problem-solving speed & accuracy",
      "Attempt full-length JEE-pattern mocks with confidence",
    ],
    details: {
      duration: "12 / 24 Months",
      mode: "Live + Recorded",
      level: "Class 11, 12 & Droppers",
      language: "English / Hindi",
    },
    mentor: { initials: "RK", name: "Dr. R. Kapoor", role: "Lead Physics Mentor, 15+ yrs" },
    enrollHref: "/register",
  },
  {
    id: "neet",
    tag: "Competitive Exams",
    title: "NEET (UG)",
    description:
      "Comprehensive Biology, Physics and Chemistry preparation crafted by medical-entrance specialists — built to maximize your NEET score and secure your seat in a top medical college.",
    accent: "navy",
    keyFeatures: [
      { icon: Dna, label: "NCERT-Focused Biology" },
      { icon: TestTube, label: "Chemistry Reaction Mapping" },
      { icon: BarChart3, label: "40+ Full-Length Mocks" },
      { icon: Layers, label: "Chapter-Wise Test Series" },
      { icon: BookOpen, label: "High-Yield Revision Notes" },
      { icon: MessagesSquare, label: "Personal Doubt Mentor" },
    ],
    outcomes: [
      "Cover 100% of the NEET Biology, Physics & Chemistry syllabus",
      "Sharpen NCERT-based recall for high-weightage topics",
      "Improve accuracy under exam-day time pressure",
    ],
    details: {
      duration: "12 / 24 Months",
      mode: "Live + Recorded",
      level: "Class 11, 12 & Droppers",
      language: "English / Hindi",
    },
    mentor: { initials: "SM", name: "Dr. S. Mehta", role: "Lead Biology Mentor, MBBS, MD" },
    enrollHref: "/register",
  },
  {
    id: "foundation",
    tag: "Foundation",
    title: "Foundation — Class 9–10 & 11–12",
    description:
      "Build unshakeable fundamentals in Maths and Science early, with structured concept building, Olympiad and NTSE preparation that sets the stage for JEE & NEET success later.",
    accent: "orange",
    keyFeatures: [
      { icon: Presentation, label: "Interactive Concept Classes" },
      { icon: Trophy, label: "NTSE & Olympiad Prep" },
      { icon: Puzzle, label: "Fun Problem-Solving Modules" },
      { icon: FileText, label: "Weekly Practice Worksheets" },
      { icon: Users, label: "Small Batch Mentorship" },
      { icon: MessagesSquare, label: "Parent Progress Reports" },
    ],
    outcomes: [
      "Strengthen core Maths & Science fundamentals",
      "Build early exam temperament through NTSE/Olympiad practice",
      "Develop confident, independent problem-solving habits",
    ],
    details: {
      duration: "Full Academic Year",
      mode: "Live + Recorded",
      level: "Class 9 – 12",
      language: "English / Hindi",
    },
    mentor: { initials: "AN", name: "A. Nair", role: "Foundation Programme Head" },
    enrollHref: "/register",
  },
  {
    id: "mbbs",
    tag: "MBBS",
    title: "MBBS — University & Clinical Preparation",
    description:
      "High-yield revision, question banks and clinical-learning support for MBBS students — designed to help you prepare efficiently for university exams and beyond.",
    accent: "green",
    keyFeatures: [
      { icon: BookMarked, label: "University Subject Coverage" },
      { icon: Stethoscope, label: "Clinical Case Discussions" },
      { icon: NotebookPen, label: "High-Yield Notes" },
      { icon: ClipboardList, label: "Question Bank Access" },
      { icon: RefreshCw, label: "Rapid Revision Series" },
      { icon: MessagesSquare, label: "Faculty Doubt Sessions" },
    ],
    outcomes: [
      "Master university exam patterns subject by subject",
      "Strengthen clinical reasoning with case-based learning",
      "Revise high-yield topics efficiently before exams",
    ],
    details: {
      duration: "Semester-wise",
      mode: "Live + Recorded",
      level: "MBBS 1st – Final Year",
      language: "English",
    },
    mentor: { initials: "DV", name: "Dr. D. Verma", role: "Clinical Faculty, MD" },
    enrollHref: "/register",
  },
];

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
