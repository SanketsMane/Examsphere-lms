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
  Rocket,
  GraduationCap,
  Target,
  Calculator,
  Atom,
  Microscope,
  PenLine,
  Timer,
  ShieldCheck,
} from "lucide-react";
import type { CourseAccent } from "./courses-content";

/**
 * Dedicated programme pages (one route per nav item).
 *
 * These replace the old single-scroll homepage where every programme was an
 * anchor on `/`. Each entry below renders a full page at /programs/<slug>.
 *
 * Note: "Class 9–10" and "Class 11–12" were previously the *same* `#foundation`
 * anchor. They are now separate programmes with their own syllabus and outcomes.
 */

export type ProgramGroupId = "competitive" | "foundation" | "mbbs";

export interface ProgramGroup {
  id: ProgramGroupId;
  label: string;
  accent: CourseAccent;
  blurb: string;
}

export const PROGRAM_GROUPS: ProgramGroup[] = [
  {
    id: "competitive",
    label: "Competitive Exams",
    accent: "navy",
    blurb:
      "Long-term, exam-focused coaching for India's toughest entrance tests, with live classes, full-length mocks and rank analytics.",
  },
  {
    id: "foundation",
    label: "Foundation",
    accent: "orange",
    blurb:
      "Early concept building for school students — strong fundamentals in Maths and Science, board readiness and Olympiad exposure.",
  },
  {
    id: "mbbs",
    label: "MBBS",
    accent: "green",
    blurb:
      "Subject-wise university preparation, clinical reasoning and high-yield revision for students already in medical college.",
  },
];

export interface ProgramData {
  slug: string;
  group: ProgramGroupId;
  /** Label used in the nav dropdown and breadcrumbs. */
  navLabel: string;
  icon: LucideIcon;
  tag: string;
  title: string;
  tagline: string;
  description: string;
  accent: CourseAccent;
  /** Three quick proof points shown in the page hero. */
  highlights: { icon: LucideIcon; label: string; value: string }[];
  keyFeatures: { icon: LucideIcon; label: string }[];
  outcomes: string[];
  /** Subject / module breakdown — the substance a dedicated page needs. */
  curriculum: { title: string; icon: LucideIcon; items: string[] }[];
  whoItsFor: string[];
  details: { duration: string; mode: string; level: string; language: string };
  mentor: { initials: string; name: string; role: string };
  faqs: { q: string; a: string }[];
}

export const PROGRAMS: ProgramData[] = [
  // ────────────────────────────── Competitive ──────────────────────────────
  {
    slug: "jee",
    group: "competitive",
    navLabel: "JEE (Main & Advanced)",
    icon: Rocket,
    tag: "Competitive Exams",
    title: "JEE (Main & Advanced)",
    tagline: "Engineering entrance preparation, built for depth.",
    description:
      "A rigorous, structured programme across Physics, Chemistry and Mathematics that takes you from first principles to advanced problem solving. Designed around the actual JEE pattern, with relentless practice, timed mocks and mentor-led review of every mistake you make.",
    accent: "navy",
    highlights: [
      { icon: Timer, label: "Duration", value: "12 / 24 Months" },
      { icon: FilePen, label: "Mock Tests", value: "60+ Full-Length" },
      { icon: Users, label: "Batch Size", value: "Small Batches" },
    ],
    keyFeatures: [
      { icon: Video, label: "Daily Live Classes" },
      { icon: FlaskConical, label: "Concept-Based Learning" },
      { icon: FilePen, label: "Weekly Mock Tests" },
      { icon: LineChart, label: "Rank Predictor & Analytics" },
      { icon: BookOpen, label: "Printed & Digital Notes" },
      { icon: MessagesSquare, label: "24x7 Doubt Support" },
    ],
    outcomes: [
      "Build strong conceptual clarity across Physics, Chemistry and Mathematics",
      "Master problem-solving speed and accuracy under exam conditions",
      "Attempt full-length JEE-pattern mocks with confidence",
      "Identify and close weak areas using per-chapter performance analytics",
    ],
    curriculum: [
      {
        title: "Physics",
        icon: Atom,
        items: [
          "Mechanics — kinematics, laws of motion, work-energy, rotation",
          "Thermodynamics & kinetic theory",
          "Electrostatics, current electricity and magnetism",
          "Optics and modern physics",
        ],
      },
      {
        title: "Chemistry",
        icon: TestTube,
        items: [
          "Physical chemistry — mole concept, equilibrium, electrochemistry",
          "Organic chemistry — mechanisms, named reactions, conversions",
          "Inorganic chemistry — periodic trends, coordination compounds",
          "Previous-year problem sets, chapter by chapter",
        ],
      },
      {
        title: "Mathematics",
        icon: Calculator,
        items: [
          "Algebra — quadratics, sequences, binomial, complex numbers",
          "Calculus — limits, continuity, differentiation, integration",
          "Coordinate geometry and vectors / 3D",
          "Probability, permutations and combinations",
        ],
      },
      {
        title: "Test Series & Review",
        icon: BarChart3,
        items: [
          "Weekly chapter-wise tests with detailed solutions",
          "Full-length JEE Main and Advanced pattern mocks",
          "One-to-one mistake analysis with your mentor",
          "Rank prediction and percentile tracking",
        ],
      },
    ],
    whoItsFor: [
      "Class 11 and 12 students targeting JEE Main and Advanced",
      "Droppers taking a focused year for a serious rank attempt",
      "Students who want structured daily practice rather than self-study alone",
    ],
    details: {
      duration: "12 / 24 Months",
      mode: "Live + Recorded",
      level: "Class 11, 12 & Droppers",
      language: "English / Hindi",
    },
    mentor: { initials: "RK", name: "Dr. R. Kapoor", role: "Lead Physics Mentor, 15+ yrs" },
    faqs: [
      {
        q: "Do you cover both JEE Main and JEE Advanced?",
        a: "Yes. The core syllabus is common, and the programme adds a dedicated Advanced-level problem track with higher-difficulty practice and multi-concept questions in the second half of the course.",
      },
      {
        q: "What if I miss a live class?",
        a: "Every live class is recorded and available in your dashboard within a few hours, so you can catch up without falling behind. Doubt support stays available on recorded content too.",
      },
      {
        q: "How are doubts handled?",
        a: "You get 24x7 doubt support plus scheduled faculty doubt sessions. Doubts raised on a chapter are routed to the faculty who teaches that chapter.",
      },
      {
        q: "What are the fees?",
        a: "Fees depend on the duration and batch you choose. Share your details through the enquiry form and our team will walk you through the options — there is no payment at the enquiry stage.",
      },
    ],
  },
  {
    slug: "neet",
    group: "competitive",
    navLabel: "NEET (UG)",
    icon: FlaskConical,
    tag: "Competitive Exams",
    title: "NEET (UG)",
    tagline: "Medical entrance preparation, anchored in NCERT.",
    description:
      "Comprehensive Biology, Physics and Chemistry preparation built by medical-entrance specialists. The programme is deliberately NCERT-first, because that is where NEET marks live — reinforced with high-yield revision, chapter-wise testing and relentless mock practice.",
    accent: "navy",
    highlights: [
      { icon: Timer, label: "Duration", value: "12 / 24 Months" },
      { icon: BarChart3, label: "Mock Tests", value: "40+ Full-Length" },
      { icon: Dna, label: "Focus", value: "NCERT-First" },
    ],
    keyFeatures: [
      { icon: Dna, label: "NCERT-Focused Biology" },
      { icon: TestTube, label: "Chemistry Reaction Mapping" },
      { icon: BarChart3, label: "40+ Full-Length Mocks" },
      { icon: Layers, label: "Chapter-Wise Test Series" },
      { icon: BookOpen, label: "High-Yield Revision Notes" },
      { icon: MessagesSquare, label: "Personal Doubt Mentor" },
    ],
    outcomes: [
      "Cover 100% of the NEET Biology, Physics and Chemistry syllabus",
      "Sharpen NCERT-based recall for high-weightage topics",
      "Improve accuracy under exam-day time pressure",
      "Build a repeatable revision cycle for the final three months",
    ],
    curriculum: [
      {
        title: "Biology",
        icon: Microscope,
        items: [
          "Cell biology, genetics and molecular basis of inheritance",
          "Human physiology and plant physiology",
          "Ecology, evolution and biotechnology",
          "Line-by-line NCERT mapping with recall drills",
        ],
      },
      {
        title: "Chemistry",
        icon: TestTube,
        items: [
          "Physical chemistry with NEET-weighted numericals",
          "Organic chemistry — reaction mapping and conversions",
          "Inorganic chemistry — NCERT-anchored factual recall",
          "Chapter-wise previous-year question banks",
        ],
      },
      {
        title: "Physics",
        icon: Atom,
        items: [
          "Mechanics and properties of matter",
          "Thermodynamics, oscillations and waves",
          "Electrodynamics and magnetism",
          "Modern physics and semiconductor devices",
        ],
      },
      {
        title: "Test Series & Revision",
        icon: RefreshCw,
        items: [
          "Chapter-wise tests immediately after each topic",
          "Full-length NEET-pattern mocks with OMR practice",
          "High-yield rapid revision series before the exam",
          "Accuracy and negative-marking analysis per attempt",
        ],
      },
    ],
    whoItsFor: [
      "Class 11 and 12 students targeting NEET (UG)",
      "Droppers repeating with a focused, test-heavy plan",
      "Students who need structured NCERT revision rather than scattered notes",
    ],
    details: {
      duration: "12 / 24 Months",
      mode: "Live + Recorded",
      level: "Class 11, 12 & Droppers",
      language: "English / Hindi",
    },
    mentor: { initials: "SM", name: "Dr. S. Mehta", role: "Lead Biology Mentor, MBBS, MD" },
    faqs: [
      {
        q: "How much of the programme is based on NCERT?",
        a: "Biology is taught line-by-line against NCERT, since the majority of NEET Biology questions trace directly to it. Chemistry and Physics use NCERT as the base and add problem sets where the exam demands more application.",
      },
      {
        q: "Is there OMR practice?",
        a: "Yes. Full-length mocks are conducted in NEET format including OMR-style marking, so exam-day mechanics are familiar rather than a surprise.",
      },
      {
        q: "I am a dropper. Is there a separate batch?",
        a: "Yes, droppers have a dedicated track with a compressed first pass over the syllabus and a much heavier testing and revision load.",
      },
      {
        q: "What are the fees?",
        a: "Fees vary by duration and batch. Send an enquiry and our team will share the options that fit your target year — no payment is taken at enquiry stage.",
      },
    ],
  },

  // ────────────────────────────── Foundation ──────────────────────────────
  {
    slug: "class-9-10",
    group: "foundation",
    navLabel: "Class 9–10",
    icon: BookOpen,
    tag: "Foundation",
    title: "Foundation — Class 9 & 10",
    tagline: "Get the fundamentals right, early.",
    description:
      "The years where competitive preparation is actually won. This programme builds genuine conceptual strength in Maths and Science, keeps school performance high, and introduces Olympiad and NTSE-style thinking long before the pressure of Class 11 arrives.",
    accent: "orange",
    highlights: [
      { icon: Timer, label: "Duration", value: "Full Academic Year" },
      { icon: Trophy, label: "Includes", value: "NTSE & Olympiad" },
      { icon: Users, label: "Batch Size", value: "Small Batches" },
    ],
    keyFeatures: [
      { icon: Presentation, label: "Interactive Concept Classes" },
      { icon: Trophy, label: "NTSE & Olympiad Prep" },
      { icon: Puzzle, label: "Fun Problem-Solving Modules" },
      { icon: FileText, label: "Weekly Practice Worksheets" },
      { icon: Users, label: "Small Batch Mentorship" },
      { icon: MessagesSquare, label: "Parent Progress Reports" },
    ],
    outcomes: [
      "Strengthen core Maths and Science fundamentals",
      "Build early exam temperament through NTSE and Olympiad practice",
      "Develop confident, independent problem-solving habits",
      "Enter Class 11 already comfortable with competitive-style questions",
    ],
    curriculum: [
      {
        title: "Mathematics",
        icon: Calculator,
        items: [
          "Number systems, polynomials and algebraic identities",
          "Linear equations, quadratic equations and progressions",
          "Geometry, triangles, circles and mensuration",
          "Trigonometry basics and coordinate geometry",
        ],
      },
      {
        title: "Science",
        icon: FlaskConical,
        items: [
          "Physics — motion, force, work, light and electricity",
          "Chemistry — matter, atoms, reactions and periodic classification",
          "Biology — life processes, control and coordination, heredity",
          "Practical reasoning and diagram-based questions",
        ],
      },
      {
        title: "Olympiad & NTSE Track",
        icon: Trophy,
        items: [
          "Mental ability and logical reasoning (MAT)",
          "Scholastic aptitude practice (SAT)",
          "Olympiad-level problem sets in Maths and Science",
          "Timed practice to build early exam temperament",
        ],
      },
      {
        title: "School & Assessment Support",
        icon: FileText,
        items: [
          "Weekly worksheets aligned to the school syllabus",
          "Periodic unit tests with detailed feedback",
          "Parent progress reports each term",
          "Doubt clearing sessions with subject mentors",
        ],
      },
    ],
    whoItsFor: [
      "Class 9 and 10 students who want a strong Maths and Science base",
      "Students preparing for NTSE, NSO, IMO and similar Olympiads",
      "Parents planning ahead for JEE or NEET in the senior years",
    ],
    details: {
      duration: "Full Academic Year",
      mode: "Live + Recorded",
      level: "Class 9 – 10",
      language: "English / Hindi",
    },
    mentor: { initials: "AN", name: "A. Nair", role: "Foundation Programme Head" },
    faqs: [
      {
        q: "Will this clash with school studies?",
        a: "No — it is built to support them. Weekly worksheets follow the school syllabus, so the programme reinforces classroom learning instead of competing with it.",
      },
      {
        q: "Is Olympiad preparation compulsory?",
        a: "It is included but not forced. Students who want to sit for NTSE or Olympiads get the dedicated track; others simply benefit from the sharper problem-solving practice.",
      },
      {
        q: "How do parents track progress?",
        a: "Parents receive periodic progress reports covering test performance, attendance and mentor observations, plus access to scheduled parent-teacher interactions.",
      },
    ],
  },
  {
    slug: "class-11-12",
    group: "foundation",
    navLabel: "Class 11–12 (Boards Prep)",
    icon: GraduationCap,
    tag: "Foundation",
    title: "Class 11–12 — Boards Preparation",
    tagline: "Score in the boards without losing the entrance thread.",
    description:
      "A board-focused programme for senior school students who want strong CBSE and state-board results. Teaching follows the prescribed syllabus and marking scheme closely, with answer-writing practice, previous-year papers and pre-board testing — while keeping concepts deep enough to support entrance preparation alongside.",
    accent: "orange",
    highlights: [
      { icon: Timer, label: "Duration", value: "Per Academic Year" },
      { icon: PenLine, label: "Focus", value: "Answer Writing" },
      { icon: FilePen, label: "Includes", value: "Pre-Board Tests" },
    ],
    keyFeatures: [
      { icon: Presentation, label: "Syllabus-Aligned Classes" },
      { icon: PenLine, label: "Answer-Writing Practice" },
      { icon: FileText, label: "Previous-Year Board Papers" },
      { icon: FilePen, label: "Pre-Board Test Series" },
      { icon: BookOpen, label: "Chapter Summary Notes" },
      { icon: MessagesSquare, label: "Doubt Clearing Sessions" },
    ],
    outcomes: [
      "Cover the full board syllabus with time left for revision",
      "Write structured, marking-scheme-aware answers that score",
      "Walk into pre-boards and boards with tested exam temperament",
      "Keep concepts strong enough to carry into JEE or NEET preparation",
    ],
    curriculum: [
      {
        title: "Physics",
        icon: Atom,
        items: [
          "Electrostatics, current electricity and magnetic effects",
          "Optics, dual nature and modern physics",
          "Derivations and numericals in board format",
          "Diagram and graph based answer practice",
        ],
      },
      {
        title: "Chemistry",
        icon: TestTube,
        items: [
          "Physical chemistry — solutions, kinetics, electrochemistry",
          "Organic chemistry — functional groups and conversions",
          "Inorganic chemistry — p, d and f block elements",
          "Named reactions and equation writing practice",
        ],
      },
      {
        title: "Mathematics / Biology",
        icon: Calculator,
        items: [
          "Maths — calculus, matrices, determinants, probability",
          "Biology — reproduction, genetics, ecology and biotechnology",
          "Stream-appropriate elective coverage",
          "Step-marking practice for long-form questions",
        ],
      },
      {
        title: "Board Exam Preparation",
        icon: ShieldCheck,
        items: [
          "Chapter-wise tests in board pattern",
          "Previous-year board paper solving, year by year",
          "Full pre-board test series with evaluated answer sheets",
          "Time management and presentation training",
        ],
      },
    ],
    whoItsFor: [
      "Class 11 and 12 students focused on scoring well in board exams",
      "Students who need answer-writing and presentation training, not just concepts",
      "Students balancing board preparation alongside entrance coaching",
    ],
    details: {
      duration: "Per Academic Year",
      mode: "Live + Recorded",
      level: "Class 11 – 12",
      language: "English / Hindi",
    },
    mentor: { initials: "AN", name: "A. Nair", role: "Foundation Programme Head" },
    faqs: [
      {
        q: "Which boards do you cover?",
        a: "Teaching is aligned to the CBSE syllabus and marking scheme, and it maps closely to most state boards. Tell us your board in the enquiry and we will confirm the fit before you join.",
      },
      {
        q: "Can I take this along with JEE or NEET coaching?",
        a: "Yes, that is a common combination. Concepts are taught deeply enough to support entrance preparation, while the testing and answer-writing work stays board-specific.",
      },
      {
        q: "How are answer sheets evaluated?",
        a: "Pre-board answer sheets are evaluated against the board marking scheme, so you see exactly where steps and presentation are costing you marks.",
      },
    ],
  },

  // ──────────────────────────────── MBBS ────────────────────────────────
  {
    slug: "mbbs",
    group: "mbbs",
    navLabel: "Medical Subjects",
    icon: Stethoscope,
    tag: "MBBS",
    title: "MBBS — Medical Subjects",
    tagline: "University preparation for students already in medical college.",
    description:
      "High-yield revision, question banks and clinical-learning support built for MBBS students. The programme is organised subject by subject across the professional years, so you can prepare efficiently for university exams without drowning in unfocused reading.",
    accent: "green",
    highlights: [
      { icon: Timer, label: "Structure", value: "Semester-wise" },
      { icon: ClipboardList, label: "Includes", value: "Question Bank" },
      { icon: Stethoscope, label: "Focus", value: "Clinical Cases" },
    ],
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
      "Build habits that carry into postgraduate entrance preparation",
    ],
    curriculum: [
      {
        title: "First Professional",
        icon: Microscope,
        items: [
          "Anatomy — general, regional and neuroanatomy",
          "Physiology — systemic and applied",
          "Biochemistry — metabolism and molecular biology",
          "Viva and practical preparation",
        ],
      },
      {
        title: "Second Professional",
        icon: TestTube,
        items: [
          "Pathology — general and systemic",
          "Pharmacology — drug classes and clinical application",
          "Microbiology — bacteriology, virology and immunology",
          "Forensic medicine essentials",
        ],
      },
      {
        title: "Clinical Subjects",
        icon: Stethoscope,
        items: [
          "Medicine, Surgery, Obstetrics and Gynaecology",
          "Paediatrics, Orthopaedics and allied specialities",
          "Case-based clinical reasoning discussions",
          "Ward and OSCE oriented preparation",
        ],
      },
      {
        title: "Revision & Assessment",
        icon: RefreshCw,
        items: [
          "High-yield notes for each subject",
          "Topic-wise question banks with explanations",
          "Rapid revision series before university exams",
          "Faculty-led doubt and discussion sessions",
        ],
      },
    ],
    whoItsFor: [
      "MBBS students from first professional year to final year",
      "Students who want structured revision ahead of university exams",
      "Students building an early base for postgraduate entrance preparation",
    ],
    details: {
      duration: "Semester-wise",
      mode: "Live + Recorded",
      level: "MBBS 1st – Final Year",
      language: "English",
    },
    mentor: { initials: "DV", name: "Dr. D. Verma", role: "Clinical Faculty, MD" },
    faqs: [
      {
        q: "Is this aligned to my university's syllabus?",
        a: "Content follows the NMC competency-based curriculum that most Indian universities derive from. Share your university in the enquiry and we will confirm the mapping before you enrol.",
      },
      {
        q: "Can I join for a single subject?",
        a: "Yes. The programme is organised subject by subject, so you can take only the subjects you need for the current semester.",
      },
      {
        q: "Does this help with PG entrance preparation?",
        a: "Indirectly, yes. The high-yield notes and question banks are built around the same core concepts that postgraduate entrance exams test, so the groundwork carries over.",
      },
    ],
  },
];

export function getProgram(slug: string): ProgramData | undefined {
  return PROGRAMS.find((p) => p.slug === slug);
}

export function programsByGroup(groupId: ProgramGroupId): ProgramData[] {
  return PROGRAMS.filter((p) => p.group === groupId);
}
