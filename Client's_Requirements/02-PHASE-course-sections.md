# Phase 2 — Dynamic Course Detail Sections

**Client's words:** *"When a user clicks any course from the dropdown, navigate/scroll to that
course's dedicated section on the same page. Each section must include Course Title, Description,
Key Features, Duration, Learning Outcomes, Faculty/Mentor, Pricing, Enroll Now. After this,
remove the old separate Courses section/cards — the dropdown becomes the primary way to access
course info. No different courses tab required like before."*

**Goal:** Build four anchored, on-page course sections on the homepage and remove the old
DB-driven course cards from the homepage.

---

## Target file(s)

- **Edit:** [`app/(public)/page.tsx`](../../app/(public)/page.tsx) — add the four sections;
  remove old course cards (see "Remove" below).
- **New data file:** `app/(public)/_data/courses-content.ts` — export `COURSE_SECTIONS`
  (the 4 objects, content from [`reference/course-content-data.md`](reference/course-content-data.md)).
- **New component:** `components/marketing/examsphere/CourseSection.tsx` — renders one section
  from a data object (keeps all four consistent).
- **Reference markup:** [`reference/client-reference-course-sections.html`](reference/client-reference-course-sections.html).

---

## The four sections (anchor ids are contract with Phase 3)

| Section | Anchor | Accent | Dropdown items that land here |
|---|---|---|---|
| JEE (Main & Advanced) | `#jee` | Navy | "JEE (Main & Advanced)" |
| NEET (UG) | `#neet` | Navy | "NEET (UG)" |
| Foundation (9–10 & 11–12) | `#foundation` | Orange | "Class 9–10", "Class 11–12 (Boards Prep)" |
| MBBS | `#mbbs` | Green | "Medical Subjects" |

> Add `scroll-margin-top: ~100px` on each section so the sticky header doesn't cover the title
> when scrolled to (the reference CSS already sets `.course-section{scroll-margin-top:100px}`).

---

## Required content per section (all 7+ blocks)

Each `CourseSection` must render, using the exact copy from
[`reference/course-content-data.md`](reference/course-content-data.md):

1. **Tag** (group label) + **Course Title** (h2)
2. **Course Description**
3. **Key Features** — 6 pills in a 2-col grid
4. **Learning Outcomes** — 3 bullet list with check icons
5. **Course Details card** — Duration, Mode, Level, Language (info rows)
6. **Faculty / Mentor** — avatar initials, name, role
7. **Pricing** — current price + struck-through old price *(optional if the client later says so)*
8. **Enroll Now** button (accent colour per section) — appears twice (header + mentor card),
   matching the reference.

### Data shape (suggested)

```ts
export interface CourseSectionData {
  id: "jee" | "neet" | "foundation" | "mbbs";
  tag: string;
  title: string;
  description: string;
  accent: "navy" | "orange" | "green";
  keyFeatures: { icon: string; label: string }[];
  outcomes: string[];
  details: { duration: string; mode: string; level: string; language: string };
  mentor: { initials: string; name: string; role: string };
  price?: { now: string; was?: string };
  enrollHref: string; // where "Enroll Now" goes — see below
}
```

---

## "Enroll Now" behaviour

The client wants a real enrol path (not a dead link). Choose one and keep it consistent:
- **Preferred:** link to the existing enrolment/checkout flow for that program (there is a
  courses/checkout system in the app — `app/(public)/courses/[slug]` + `app/payment`). Map each
  section to its real course slug if one exists.
- **Fallback:** link to `/register` (sign-up) or `/contact` with the program pre-selected.
- Confirm the target with the client (pricing is real money — don't guess the checkout).

---

## Remove the OLD courses UI from the homepage

Per the client, the dropdown + these sections replace the old cards. In
[`app/(public)/page.tsx`](../../app/(public)/page.tsx) remove (from the homepage only):
- `<FeaturedCourses courses={featuredCourses} />`
- `<CategoriesGrid categories={categories} />`
- `<PopularLanguages />` (generic, off-brand for an exam-prep site)

> Keep the `/courses` route and DB catalog for the backend/enrolment — this only removes the
> **homepage** cards the client called "the old separate courses section." Confirm with the
> client whether the top-nav "Courses → /courses" page should stay or fully redirect to the
> homepage sections.

---

## Acceptance criteria

- [ ] Four sections exist on the homepage with anchors `#jee #neet #foundation #mbbs`.
- [ ] Each renders all required blocks with the exact reference copy.
- [ ] Section accent colours: JEE/NEET navy, Foundation orange, MBBS green.
- [ ] Clicking a dropdown item (Phase 3) smooth-scrolls to the right section, title not hidden
      by the sticky header.
- [ ] "Enroll Now" goes to a real, agreed destination.
- [ ] Old homepage course cards (`FeaturedCourses`, `CategoriesGrid`, `PopularLanguages`) removed.
- [ ] Responsive; two-column desktop → single-column mobile (per reference `@media(max-width:900px)`).

## Checklist

- [ ] `courses-content.ts` created from reference data
- [ ] `CourseSection.tsx` component built
- [ ] Four sections rendered on homepage with correct anchors + `scroll-margin-top`
- [ ] Enroll Now destination decided + wired
- [ ] Old course cards removed from `page.tsx`
- [ ] Client confirmed on pricing + enrol flow
