# Phase 4 — Footer Enhancement

**Client's words:** *"Redesign the footer into a professional multi-column footer: Contact
Information (phone, email, office address), Social Media (Instagram, Facebook, LinkedIn, YouTube,
Twitter/X) with icons, Quick Links (Home, Courses, About, Contact), a Query Box (Name, Email,
Message, Send), and Legal (Privacy Policy, Terms & Conditions, Refund Policy, Cookie Policy).
Bottom footer: Copyright © 2026 ExamSphere. All Rights Reserved."*

**Goal:** Rebuild the footer into a professional multi-column layout with all the columns and a
working query form.

---

## Target file(s)

- **Edit:** [`app/(public)/_components/Footer.tsx`](../../app/(public)/_components/Footer.tsx)
- **New (query form action):** a server action or API route to receive the query, e.g.
  `app/(public)/_components/footer-query-action.ts` or `app/api/contact/route.ts`.
  The app already sends email (`emails/`, Resend configured) — reuse it to deliver queries.
- **New page (if missing):** `app/(public)/refund/page.tsx` — Refund Policy (currently missing).
- **Reference styling:** `footer{...}` / `.footer-form` in
  [`reference/client-reference-page.html`](reference/client-reference-page.html).

---

## Required columns

### 1. Brand + Contact Information
- Logo + "ExamSphere" + tagline (Learn • Compete • Succeed) + short blurb.
- **Phone:** ⟨TBD — client to provide⟩ (icon)
- **Email:** ⟨TBD — client to provide⟩ (icon)
- **Office Address:** ⟨TBD — client to provide⟩ (icon) — *client said "if available"*.
- Prefer pulling from site settings (`getSiteSettings()`) with hard fallbacks so the footer is
  never empty.

### 2. Social Media (with icons — use lucide)
Instagram · Facebook · LinkedIn · YouTube · Twitter/X.
- **LinkedIn and Twitter/X must be added** — LinkedIn is currently not rendered at all.
- lucide has `Instagram, Facebook, Linkedin, Youtube, Twitter`. Use real URLs (⟨TBD⟩), open in
  new tab, circular icon buttons with orange hover (per reference `.social-row a`).

### 3. Quick Links
Home (`/`) · Courses (`/#jee` or `/courses`) · About (`/about`) · Contact (`/contact`).
> Replace/augment the current "Learn / Teach / Company" columns with these four the client
> named. Keep extras only if the client agrees.

### 4. Query Box (contact form) — must actually work
Fields: **Name**, **Email**, **Message**, **Send** button.
- On submit: validate, POST to the action/route, deliver via the existing email system (Resend),
  show success/error toast. **Not a placeholder.**
- Include basic anti-abuse (required fields, email format; consider a honeypot).

### 5. Legal
Privacy Policy (`/privacy`) · Terms & Conditions (`/terms`) · Refund Policy (`/refund`) ·
Cookie Policy (`/cookies`).
- `/privacy`, `/terms`, `/cookies` exist. **`/refund` must be created** (new page).

### Bottom bar
- Exact text: **`Copyright © 2026 ExamSphere. All Rights Reserved.`**
  - Client explicitly wants **2026** (the reference uses a dynamic year — hardcode/param to 2026,
    or `© 2026` while keeping the brand text). Remove the `v1.0.1` version tag unless wanted.

---

## Layout

Professional multi-column (4–5 columns desktop → stack on mobile), dark navy background
(`--navy-950`) matching the reference footer. Query box can occupy the wider last column.

---

## Acceptance criteria

- [ ] Footer shows Contact (phone, email, address), all 5 socials **incl. LinkedIn & X**,
      Quick Links (Home/Courses/About/Contact), Query Box, Legal (4 items incl. Refund).
- [ ] Query form submits and delivers a real email (success/error feedback shown).
- [ ] `/refund` page exists and is linked.
- [ ] Bottom bar reads exactly "Copyright © 2026 ExamSphere. All Rights Reserved."
- [ ] Icons present for socials; responsive; light/dark safe.

## Checklist

- [ ] Footer rebuilt with 5 columns
- [ ] LinkedIn + Twitter/X added; all socials use real URLs (⟨TBD⟩)
- [ ] Quick Links set to Home/Courses/About/Contact
- [ ] Query form + backend (email delivery) working
- [ ] Refund Policy page created + linked
- [ ] Copyright set to © 2026
- [ ] Real contact details filled in from client (⟨TBD⟩ resolved)
