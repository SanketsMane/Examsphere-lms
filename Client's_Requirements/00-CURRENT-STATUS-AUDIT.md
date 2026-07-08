# Phase 0 — Current Status Audit

> A factual snapshot of the codebase **as of 2026-07-08**, so every phase starts from reality.
> Verified by reading the actual files listed below.

## Stack

- **Framework:** Next.js 15 (App Router), React, TypeScript
- **Styling:** Tailwind CSS + shadcn/ui (`components/ui/`), `lucide-react` icons
- **DB/ORM:** Prisma (`prisma/`), courses/users/etc. are DB-driven
- **Auth:** better-auth (`lib/auth.ts`, `lib/auth-client.ts`)
- **Public site route group:** [`app/(public)/`](../app/(public)/)
- **Dev server:** `npm run dev` (from `examsphere-lms/`)

---

## 1. Homepage — `app/(public)/page.tsx`

**Current:** A generic multi-section LMS marketing page. It composes (in order):
`BroadcastBanner → HeroSection (components/ui/hero-section-9) → StatsBar → VibeCard →
FeaturesGrid → UpcomingGroupClasses → FeaturedCourses → CategoriesGrid → PopularLanguages →
ServicesSection → TestimonialsSectionV2`.

- The hero is the generic `hero-section-9` component (title/subtitle/stats/images props) — **not**
  the branded ExamSphere hero with the boy+girl photo from the client's image.
- Courses are shown as **DB-driven cards** (`FeaturedCourses`, `CategoriesGrid`) — this is the
  "old separate courses section" the client wants **removed** (Phase 2).
- There are **~11 stacked sections**, not the tight 4-section layout in the client's image.

**Gap vs. client image:** ❌ Does not match. Needs the Phase 1 redesign.
**Note:** There are many unused homepage variants in the folder (`page-clean.tsx`,
`page-comprehensive.tsx`, `page-enhanced-simple.tsx`, `page-inline-styles.tsx`, `page-simple.tsx`,
`page-backup.tsx.disabled`). **Only `page.tsx` is live.** Ignore/clean the rest.

---

## 2. Navbar — `app/(public)/_components/Navbar.tsx`

**Current:** Uses a shared `Menu` component (`components/ui/navbar.tsx`) with a flat list:
`Home, Courses, Group Classes, Teachers, Pricing`. "Courses" is a **plain link to `/courses`** —
**no dropdown**.

- ✅ **Good news:** the `Menu` component **already supports dropdowns** — the `IMenu` type has
  `dropdown?: boolean` and `items?: IMenu[]`, and it renders a dropdown panel on hover
  (`components/ui/navbar.tsx:47-78`). It's just **not configured** for Courses.
- The current dropdown render is a **single flat column** — for the client's grouped
  (Competitive / Foundation / MBBS) layout it needs a wider, multi-column "mega menu" variant.

**Gap:** ❌ No Courses dropdown. Menu supports it; needs grouped mega-menu markup (Phase 3).

---

## 3. Footer — `app/(public)/_components/Footer.tsx`

**Current:** Dark multi-column footer, partly settings-driven.

| Client wants | Status now |
|---|---|
| Phone | ⚠️ Only if `settings.contactPhone` set |
| Email | ⚠️ Only if `settings.contactEmail` set |
| Office address | ❌ Missing |
| Instagram, Facebook, YouTube | ⚠️ Only if set in settings |
| **LinkedIn** | ❌ Not rendered at all |
| **Twitter/X** | ⚠️ Only if set |
| Quick Links (Home, Courses, About, Contact) | ⚠️ Has Learn/Teach/Company columns instead |
| **Query box (Name/Email/Message/Send)** | ❌ Missing entirely |
| Legal: Privacy, Terms, Cookies | ✅ Present in bottom bar |
| **Legal: Refund Policy** | ❌ Missing (and no `/refund` page exists) |
| **Copyright © 2026** | ⚠️ Uses `new Date().getFullYear()` (dynamic), shows `v1.0.1` |

**Gap:** ❌ Needs redesign per Phase 4 (add LinkedIn, address, query form, refund policy, fixed
2026 copyright, Quick Links).

---

## 4. AI Chatbot / "ExamSphere AI"

**Current:** There is a full chat UI component `components/ai/chat-interface.tsx` (`ChatInterface`),
but it is used **only inside authenticated dashboards**:
`app/admin/ai/page.tsx`, `app/dashboard/ai/page.tsx`, `app/teacher/ai/page.tsx`.

- ❌ **No floating chatbot on the public site.** Nothing is mounted in
  `app/(public)/layout.tsx`. A visitor on the homepage sees no chatbot.
- **Why the existing AI "is not working":** the API route `app/api/ai/chat/route.ts`:
  1. **Requires a logged-in session** — returns `401 Unauthorized` if `!session`
     (`app/api/ai/chat/route.ts:16-18`). A public visitor can never use it.
  2. Proxies to an **external "Flowversal" server**:
     `FLOWVERSAL_API_URL` (hardcoded default `http://139.84.155.227:3000/api/tanchat`) and
     `FLOWVERSAL_API_KEY`.
  3. **`FLOWVERSAL_API_KEY` is NOT set** in `.env` — so even authenticated calls fail.

**Gap:** ❌ Need a **public, floating, working** chatbot (Phase 5). Either wire a real provider
(recommended: Claude API, since the app already targets Anthropic models) or a self-contained
FAQ engine — and expose it without requiring login.

---

## 5. Course data & pages

**Current:** Courses are DB entities (Prisma). Public pages: `app/(public)/courses/page.tsx`
(listing), `app/(public)/courses/[slug]/` (detail). The client's new model is **content-driven
on-page sections on the homepage**, not the DB course catalog. Phase 2 builds these as static,
well-designed sections (content in `reference/course-content-data.md`). The DB catalog can stay
for the dashboard/enrolment backend, but the **homepage** should present the four programs as
anchored sections.

---

## 6. Legal / info pages that exist

✅ `/privacy`, `/terms`, `/cookies`, `/contact`, `/about`, `/faq`
❌ `/refund` (needed by Phase 4 footer)

---

## Summary scoreboard

| Requirement area | State | Phase |
|---|---|---|
| Homepage matches client image | ❌ Not started | 1 |
| Boy+girl hero | ❌ Missing asset + layout | 1 |
| Dynamic course sections (JEE/NEET/Foundation/MBBS) | ❌ Missing | 2 |
| Remove old course cards | ❌ Still present | 2 |
| Courses mega-dropdown | ❌ Not configured (engine ready) | 3 |
| Footer: LinkedIn / address / query form / refund / © 2026 | ❌ Missing pieces | 4 |
| Public floating chatbot | ❌ Missing | 5 |
| Fix existing broken AI | ❌ Auth-gated + unconfigured key | 5 |
