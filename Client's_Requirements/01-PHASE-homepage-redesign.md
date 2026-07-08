# Phase 1 — Homepage Visual Redesign (match the client's image)

**Client's words:** *"Make the same similar to the image given — it will contain 4 sections.
Same website they want, same boy and girl in hero section, everything same and professional."*

**Goal:** Replace the current generic homepage with a page that matches the client's reference
image and pasted HTML — on-brand, professional, responsive.

---

## Target file(s)

- **Edit:** [`app/(public)/page.tsx`](../../app/(public)/page.tsx) — this is the live homepage.
- **Add tokens:** [`app/globals.css`](../../app/globals.css) — add the brand CSS variables from
  [`reference/design-tokens.md`](reference/design-tokens.md).
- **Fonts:** load `Sora` + `Inter` via `next/font/google` in `app/layout.tsx`.
- **New components** (suggested, under `components/marketing/examsphere/`):
  `HeroExamSphere.tsx`, `ProgramCards.tsx`, `WhyChoose.tsx`, `StatsStrip.tsx`,
  `QuoteBanner.tsx`, `TrustStrip.tsx`.
- **Hero image:** place at `public/images/hero-students.png` (or `.webp`). See asset note below.

> Keep the old homepage variants (`page-clean.tsx`, `page-comprehensive.tsx`, etc.) out of the
> way — they are not imported. Optionally delete them in a cleanup commit.

---

## The 4 required page sections (top to bottom, per the image)

### Section 1 — Hero
- Left column:
  - Orange pill eyebrow: **"★ Empowering Future Doctors & Engineers"**
  - H1: **"Your Journey to <span accent>Success</span> Begins Here."** ("Success" in orange)
  - Sub: *"Expert guidance, smart strategies and personalized mentorship for **JEE, NEET,
    Foundation and MBBS**."*
  - Two CTAs: **Start Learning** (navy, rocket icon) · **Explore Courses** (outline) →
    scrolls to first course section.
  - Three quick badges: **Expert Faculty · Structured Courses · Proven Results** (with icons).
- Right column: **the boy + girl student photo** (backpacks/books, exactly like the image),
  with the decorative orbit ring and 3 floating circular badges (rocket=navy, medical=green,
  graduation=orange).

### Section 2 — Three program cards
Three cards side by side (stack on mobile). Content in
[`reference/course-content-data.md`](reference/course-content-data.md) → "3 program cards":
1. **Competitive Exams — JEE / NEET** (navy, target icon) → "Explore Now" scrolls to `#jee`
2. **Foundation** (orange, book icon) → "Explore Now" scrolls to `#foundation`
3. **MBBS** (green, caduceus icon) → "Explore Now" scrolls to `#mbbs`

### Section 3 — "Why Choose ExamSphere?" + stats
- Heading: **"Why Choose ExamSphere?"** (ExamSphere = navy+orange) with sub-line
  *"Everything you need to learn, practice and excel in your dream exam."*
- Row of 7 feature tiles: Expert Faculty · Live & Recorded Classes · Daily Practice Questions ·
  AI-Powered Performance Analysis · Personalized Mentorship · Doubt Support · Mock Tests & PYQ Papers.
- Stats strip: **50K+** Students Enrolled · **100+** Expert Faculty · **10K+** Hours of Live
  Classes · **95%** Student Satisfaction · **Top** Results in JEE & NEET.

### Section 4 — Quote banner + trust strip
- Navy gradient banner with mountain/summit motif:
  > *"At ExamSphere, we don't just teach — we mentor, guide and inspire."*
  > **Your dream. Our mission.** (tagline in orange)
- Trust strip below: Safe & Secure Learning Environment · Accessible Anytime, Anywhere ·
  Affordable Fee Structure · Regular Tests & Performance Tracking · Trusted by Students Across India.

> The **four detailed course sections** (JEE/NEET/Foundation/MBBS) from Phase 2 sit **below
> Section 4** (or between 2 and 3 — client just wants them reachable from the dropdown). Footer
> (Phase 4) and chatbot (Phase 5) follow.

---

## Design rules

- Colours, fonts, radii, shadows: **exactly** per [`reference/design-tokens.md`](reference/design-tokens.md).
- Match spacing/feel of the client's CSS (`.hero`, `.feat-card`, `.why`, `.stats-bar`,
  `.quote-inner` in [`reference/client-reference-page.html`](reference/client-reference-page.html)).
- Preserve the existing site's dark-mode support (don't hardcode white-only).
- Icons: the reference uses Font Awesome; the app uses `lucide-react` — **use lucide equivalents**
  (Rocket, Target, BookOpen, Stethoscope, GraduationCap, Users, Trophy, etc.) to avoid adding a
  new icon dependency.

---

## Hero image (asset dependency — OPEN ITEM)

The client insists on **"the same boy and girl."** Options, in order of preference:
1. Client provides the exact image → save as `public/images/hero-students.png`.
2. If not available, source a licensed equivalent (two Indian students, backpacks, books,
   navy + pink/hoodie palette) and get client sign-off.

Until the real image lands, use a clearly-labelled placeholder so layout can proceed. **Flag to
the client that this asset is required.** Drop candidates in
[`assets/`](assets/) in this folder for review.

---

## Acceptance criteria

- [ ] Homepage visually matches the client's image (hero, 3 cards, why-choose+stats, quote+trust).
- [ ] Boy+girl hero image present (real asset, not placeholder) — or explicitly pending client.
- [ ] All headings use Sora; body uses Inter; orange/navy/green used per brand meaning.
- [ ] "Explore Courses" and each card's "Explore Now" scroll to the correct course section.
- [ ] The old DB-driven marketing sections that don't belong (see Phase 2) are removed.
- [ ] Responsive at 375 / 768 / 1280 px; works in light & dark; `npm run build` passes.

## Checklist

- [ ] Brand tokens added to `globals.css`
- [ ] Sora + Inter loaded via `next/font`
- [ ] Hero section built (copy + image + floating badges)
- [ ] 3 program cards built and wired to scroll
- [ ] Why-Choose (7 tiles) + stats strip built
- [ ] Quote banner + trust strip built
- [ ] `page.tsx` re-composed to the new 4-section order
- [ ] Hero image sourced/approved
