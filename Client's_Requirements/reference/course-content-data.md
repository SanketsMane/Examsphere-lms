# Course Content Data — Single Source of Truth

All copy for the four homepage course sections, taken from the client's reference code.
**Use this verbatim** in Phase 2. Prices are from the client's mock — confirm before go-live.

Recommended representation in code (so sections + dropdown stay in sync):

```ts
// e.g. app/(public)/_data/courses-content.ts
export const COURSE_SECTIONS = [ /* the 4 objects below */ ];
```

Each section anchor id is used by the navbar dropdown (Phase 3) to scroll to it.

---

## 1. JEE (Main & Advanced) — anchor `#jee`

- **Group / tag:** Competitive Exams (navy accent)
- **Title:** JEE (Main & Advanced)
- **Description:** A rigorous, structured programme for Physics, Chemistry and Mathematics
  designed to take you from fundamentals to advanced problem solving for India's toughest
  engineering entrance exam.
- **Key Features:**
  - Daily Live Classes
  - Concept-Based Learning
  - Weekly Mock Tests
  - Rank Predictor & Analytics
  - Printed & Digital Notes
  - 24×7 Doubt Support
- **Learning Outcomes:**
  - Build strong conceptual clarity across PCM
  - Master problem-solving speed & accuracy
  - Attempt full-length JEE-pattern mocks with confidence
- **Course Details:** Duration `12 / 24 Months` · Mode `Live + Recorded` ·
  Level `Class 11, 12 & Droppers` · Language `English / Hindi`
- **Mentor:** Dr. R. Kapoor — Lead Physics Mentor, 15+ yrs (avatar initials `RK`)
- **Pricing:** ₹24,999 (was ₹39,999)
- **CTA:** Enroll Now (navy button)

---

## 2. NEET (UG) — anchor `#neet`

- **Group / tag:** Competitive Exams (navy accent)
- **Title:** NEET (UG)
- **Description:** Comprehensive Biology, Physics and Chemistry preparation crafted by
  medical-entrance specialists — built to maximize your NEET score and secure your seat in a
  top medical college.
- **Key Features:**
  - NCERT-Focused Biology
  - Chemistry Reaction Mapping
  - 40+ Full-Length Mocks
  - Chapter-Wise Test Series
  - High-Yield Revision Notes
  - Personal Doubt Mentor
- **Learning Outcomes:**
  - Cover 100% of the NEET Biology, Physics & Chemistry syllabus
  - Sharpen NCERT-based recall for high-weightage topics
  - Improve accuracy under exam-day time pressure
- **Course Details:** Duration `12 / 24 Months` · Mode `Live + Recorded` ·
  Level `Class 11, 12 & Droppers` · Language `English / Hindi`
- **Mentor:** Dr. S. Mehta — Lead Biology Mentor, MBBS, MD (avatar initials `SM`)
- **Pricing:** ₹22,999 (was ₹34,999)
- **CTA:** Enroll Now (navy button)

---

## 3. Foundation — Class 9–10 & 11–12 — anchor `#foundation`

> Client note: Foundation has **two dropdown entries** — **Class 9–10** and **Class 11–12
> (Boards Prep)**. Both link to this Foundation section (or split into `#foundation-910` and
> `#foundation-1112` if you build two sub-sections). Section background = soft (`--bg-soft`).

- **Group / tag:** Foundation (orange accent)
- **Title:** Foundation — Class 9–10 & 11–12
- **Description:** Build unshakeable fundamentals in Maths and Science early, with structured
  concept building, Olympiad and NTSE preparation that sets the stage for JEE & NEET success later.
- **Key Features:**
  - Interactive Concept Classes
  - NTSE & Olympiad Prep
  - Fun Problem-Solving Modules
  - Weekly Practice Worksheets
  - Small Batch Mentorship
  - Parent Progress Reports
- **Learning Outcomes:**
  - Strengthen core Maths & Science fundamentals
  - Build early exam temperament through NTSE/Olympiad practice
  - Develop confident, independent problem-solving habits
- **Course Details:** Duration `Full Academic Year` · Mode `Live + Recorded` ·
  Level `Class 9 – 12` · Language `English / Hindi`
- **Mentor:** A. Nair — Foundation Programme Head (avatar initials `AN`)
- **Pricing:** ₹9,999 (was ₹15,999)
- **CTA:** Enroll Now (orange button)

**Dropdown sub-items → this section:**
| Dropdown label | Scrolls to |
|---|---|
| Class 9–10 | `#foundation` |
| Class 11–12 (Boards Prep) | `#foundation` |

---

## 4. MBBS — University & Clinical Preparation — anchor `#mbbs`

- **Group / tag:** MBBS (green accent)
- **Title:** MBBS — University & Clinical Preparation
- **Description:** High-yield revision, question banks and clinical-learning support for MBBS
  students — designed to help you prepare efficiently for university exams and beyond.
- **Key Features:**
  - University Subject Coverage
  - Clinical Case Discussions
  - High-Yield Notes
  - Question Bank Access
  - Rapid Revision Series
  - Faculty Doubt Sessions
- **Learning Outcomes:**
  - Master university exam patterns subject by subject
  - Strengthen clinical reasoning with case-based learning
  - Revise high-yield topics efficiently before exams
- **Course Details:** Duration `Semester-wise` · Mode `Live + Recorded` ·
  Level `MBBS 1st – Final Year` · Language `English`
- **Mentor:** Dr. D. Verma — Clinical Faculty, MD (avatar initials `DV`)
- **Pricing:** ₹18,999 (was ₹27,999)
- **CTA:** Enroll Now (green button)

---

## Homepage "3 program cards" copy (Phase 1 hero-area cards, from the client's image)

These are the shorter summary cards near the top (above the detailed sections):

| Card | Accent | Bullet points |
|---|---|---|
| **Competitive Exams — JEE / NEET** | Navy | JEE (Main & Advanced) · NEET (UG) · Olympiads · Crash Courses & Test Series |
| **Foundation** | Orange | Classes 6–10 · NTSE · Olympiad Preparation · Concept Building · Strong Fundamentals |
| **MBBS** | Green | University Subjects · Exam Preparation · Clinical Learning · Notes & Question Bank · High Yield Revision |

Each card has an "Explore Now →" button that scrolls to the matching detailed section.

## "Why Choose ExamSphere?" feature tiles (from the image)

Expert Faculty · Live & Recorded Classes · Daily Practice Questions · AI-Powered Performance
Analysis · Personalized Mentorship · Doubt Support · Mock Tests & PYQ Papers

## Stats bar (from the image)

`50K+` Students Enrolled · `100+` Expert Faculty · `10K+` Hours of Live Classes ·
`95%` Student Satisfaction · `Top` Results in JEE & NEET

## Quote banner (from the image)

> "At ExamSphere, we don't just teach — we mentor, guide and inspire."
> **Your dream. Our mission.**

## Trust strip (from the image)

Safe & Secure Learning Environment · Accessible Anytime, Anywhere · Affordable Fee Structure ·
Regular Tests & Performance Tracking · Trusted by Students Across India
