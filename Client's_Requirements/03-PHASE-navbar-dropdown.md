# Phase 3 — Navbar "Courses" Mega-Dropdown

**Client's words:** *"Add drop-down in Courses. Foundation includes two dropdowns (9–10),
(11–12 Boards Prep). Competitive Exams includes two dropdowns (NEET)(JEE). MBBS (include the
details in the image). Clicking any course from the dropdown takes the user to the tab where the
course is described with an Enroll Now option — same behaviour for every dropdown option, no
different courses tab required like before."*

**Goal:** Turn the flat "Courses" nav item into a grouped mega-dropdown whose items scroll to
the Phase 2 course sections on the same page.

---

## Target file(s)

- **Edit:** [`app/(public)/_components/Navbar.tsx`](../../app/(public)/_components/Navbar.tsx) —
  configure the Courses item with grouped sub-items.
- **Maybe edit:** [`components/ui/navbar.tsx`](../../components/ui/navbar.tsx) — the `Menu`
  component. It **already supports dropdowns** (`dropdown?: boolean`, `items?: IMenu[]`), but
  renders a **single flat column**. For the client's grouped 3-column layout you need either:
  - (a) extend `Menu` to support **grouped columns** (Competitive / Foundation / MBBS), or
  - (b) build a dedicated `CoursesMegaMenu` component styled like the reference
    `.dropdown-panel` (3 columns, section titles, icons).
  Option (b) is cleaner and matches the reference exactly.
- **Reference markup:** `<header>` in
  [`reference/client-reference-page.html`](reference/client-reference-page.html).

---

## Exact dropdown structure

```
Courses ▾
├── COMPETITIVE EXAMS        (navy accent icons)
│   ├── JEE (Main & Advanced) ──────────→ scroll to #jee
│   └── NEET (UG) ───────────────────────→ scroll to #neet
├── FOUNDATION               (orange accent icons)
│   ├── Class 9–10 ──────────────────────→ scroll to #foundation
│   └── Class 11–12 (Boards Prep) ───────→ scroll to #foundation
└── MBBS                     (green accent icons)
    └── Medical Subjects ────────────────→ scroll to #mbbs
```

- 3-column panel, ~560px wide on desktop (per reference).
- Each column has an uppercase group title + icon links.
- Opens on hover (desktop) and on tap (mobile — must work in the mobile menu too).

---

## Link/scroll behaviour (critical)

Every item links to a same-page anchor: `href="/#jee"`, `/#neet`, `/#foundation`, `/#mbbs`.

- On the homepage: use smooth scroll (site already sets `scroll-behavior:smooth` in the
  reference; ensure it's in `globals.css`). Next.js `<Link href="/#jee">` + the anchor works;
  for reliable smooth-scroll-with-offset consider an `onClick` that does
  `document.getElementById('jee')?.scrollIntoView({behavior:'smooth'})`.
- From another page (e.g. `/about`): `href="/#jee"` navigates home then jumps to the anchor.
- The sticky header offset is handled by `scroll-margin-top` on the sections (Phase 2).

> This is the client's "no different courses tab" requirement: the dropdown item does **not**
> open a new page — it reveals the on-page section with its Enroll Now button.

---

## Mobile

The current mobile menu (`Navbar.tsx` lines ~136–161) renders a flat list. Add an expandable
"Courses" group there too, listing the same items, each closing the menu and scrolling to the
section.

---

## Acceptance criteria

- [ ] "Courses" in the top nav opens a 3-column grouped dropdown (Competitive / Foundation / MBBS).
- [ ] Items exactly match the list above (2 competitive, 2 foundation, 1 MBBS).
- [ ] Group accent colours match brand (navy / orange / green).
- [ ] Clicking any item smooth-scrolls to the correct section; title not hidden by header.
- [ ] Works on desktop hover **and** mobile tap.
- [ ] No separate `/courses` tab is required to read course info (client requirement).

## Checklist

- [ ] Decide: extend `Menu` vs. dedicated `CoursesMegaMenu`
- [ ] Build grouped 3-column dropdown per reference
- [ ] Wire all 5 items to `#jee/#neet/#foundation(x2)/#mbbs`
- [ ] Smooth scroll + header offset verified
- [ ] Mobile expandable Courses group added
- [ ] Cross-page anchor navigation (`/#jee`) verified
