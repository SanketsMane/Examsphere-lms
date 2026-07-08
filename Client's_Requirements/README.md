# ExamSphere — Client Requirements (Master Index)

> **Purpose of this folder:** A single, structured source of truth for everything the
> client asked for. It is written so that **any AI assistant (or developer) can read one
> phase file and implement it end-to-end** without re-interviewing the client.
>
> **Project:** `examsphere-lms` (Next.js 15 App Router + Prisma + Tailwind)
> **Public site lives in:** [`app/(public)/`](../app/(public)/)
> **Last updated:** 2026-07-08

---

## How to use this folder

1. Read [`00-CURRENT-STATUS-AUDIT.md`](00-CURRENT-STATUS-AUDIT.md) first — it records exactly
   what exists in the codebase today and what is missing, with file paths.
2. Implement **phase by phase**, in the order below. Each phase file is self-contained:
   goal → current state → exact requirements → target files → acceptance criteria → checklist.
3. Use the [`reference/`](reference/) folder for the client's exact design, colours, copy,
   and course content. **Do not invent course data** — use `reference/course-content-data.md`.
4. Tick the checklist at the bottom of each phase file as you go.

---

## The 5 phases (recommended build order)

| # | Phase | File | What it delivers |
|---|-------|------|------------------|
| 1 | **Homepage visual redesign** | [`01-PHASE-homepage-redesign.md`](01-PHASE-homepage-redesign.md) | Rebuild the homepage to match the client's reference image (boy+girl hero, 3 program cards, "Why Choose ExamSphere", stats bar, quote banner) — professional and on-brand. |
| 2 | **Dynamic course sections** | [`02-PHASE-course-sections.md`](02-PHASE-course-sections.md) | On-page anchored course detail sections (JEE / NEET / Foundation / MBBS) with full info + Enroll Now. Remove the old separate course cards. |
| 3 | **Navbar Courses mega-dropdown** | [`03-PHASE-navbar-dropdown.md`](03-PHASE-navbar-dropdown.md) | Grouped Courses dropdown that scrolls to the matching course section on the same page. |
| 4 | **Footer enhancement** | [`04-PHASE-footer.md`](04-PHASE-footer.md) | Professional multi-column footer: contact, socials, quick links, query form, legal, `© 2026`. |
| 5 | **AI chatbot (working)** | [`05-PHASE-ai-chatbot.md`](05-PHASE-ai-chatbot.md) | Floating, public, responsive chatbot that actually answers FAQs — and fix the existing broken "ExamSphere AI". |

> Build order rationale: the course **sections** (Phase 2) must exist before the dropdown
> (Phase 3) can scroll to them; the homepage shell (Phase 1) hosts both. Footer (4) and
> chatbot (5) are independent and can be done any time.

---

## Requirement traceability — client's original messages → phases

The client sent overlapping/renumbered lists over WhatsApp. Every distinct requirement is
mapped here so **nothing is dropped**.

| Client's words (paraphrased) | Covered in |
|------------------------------|------------|
| "Add drop-down in Courses" (Foundation 9–10 / 11–12, Competitive NEET/JEE, MBBS) | Phase 3 |
| "Clicking a dropdown course opens a tab describing the course + Enroll Now; no separate courses tab" | Phase 2 + Phase 3 |
| "Each course section: title, description, key features, duration, learning outcomes, faculty, pricing, Enroll Now" | Phase 2 |
| "Remove the old separate Courses section/cards" | Phase 2 |
| "Add a floating AI chatbot (bottom-right, every page), answers FAQs, not a placeholder" | Phase 5 |
| "The ExamSphere AI you added is not working — make it work" | Phase 5 |
| "Redesign footer: contact, socials (IG/FB/LinkedIn/YT/X), quick links, query box, legal, © 2026" | Phase 4 |
| "Make the homepage same as the image — same boy & girl hero, professional, ~4 sections" | Phase 1 |
| Reference HTML/CSS + course-section HTML the client pasted | Saved in [`reference/`](reference/) |

---

## Global acceptance criteria (applies to every phase)

- [ ] **Matches the client's reference image / code** in layout, colour, and tone (see `reference/`).
- [ ] **Fully responsive** — verified at 375px (mobile), 768px (tablet), 1280px (desktop).
- [ ] **No placeholders / dead buttons** — every CTA, link, and form does something real.
- [ ] **Brand colours & fonts** per [`reference/design-tokens.md`](reference/design-tokens.md).
- [ ] Works in both **light and dark** theme (the site has a ThemeToggle).
- [ ] No console errors; `npm run build` passes.

---

## Reference material

| File | Contents |
|------|----------|
| [`reference/design-tokens.md`](reference/design-tokens.md) | Exact colours, fonts, radii, shadows from the client's CSS. |
| [`reference/course-content-data.md`](reference/course-content-data.md) | **All course copy** — titles, features, outcomes, mentors, pricing for JEE/NEET/Foundation/MBBS. Single source of truth. |
| [`reference/client-reference-page.html`](reference/client-reference-page.html) | The client's full pasted HTML/CSS mock (homepage). |
| [`reference/client-reference-course-sections.html`](reference/client-reference-course-sections.html) | The client's pasted HTML for the four course detail sections. |
| [`assets/`](assets/) | **Drop the hero boy+girl image and any client-supplied images here.** See Phase 1 for the asset checklist. |

---

## Open items needing the client (asset/decision gaps)

These are the only things this folder can't resolve alone — flagged so they don't block silently:

1. **Hero image** — the client wants "the same boy & girl". The exact image must be supplied
   by the client (or approved stock). Drop it in `assets/hero-students.*`. See Phase 1.
2. **Real contact details** — phone, email, office address, and social URLs for the footer
   and chatbot. Placeholders are marked `⟨TBD⟩` in Phase 4.
3. **Real pricing** — Phase 2 uses the prices from the client's reference code; confirm they
   are correct before going live.
4. **Refund Policy page** — required by the footer (Phase 4) but does not exist yet
   (`app/(public)/refund/` is missing). Needs content or a link target.
