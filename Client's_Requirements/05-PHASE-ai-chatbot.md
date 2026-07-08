# Phase 5 — AI Chatbot (Floating, Public, Working)

**Client's words:** *"Add a floating AI chatbot button on the bottom-right corner of every page.
Visible immediately when the homepage loads. Opens as a chatbot popup. Responsive for desktop
and mobile. Can answer FAQs about Courses, Admissions, Fees, NEET, JEE, Foundation, MBBS, Contact
Information. The chatbot should not be a placeholder. Also: the ExamSphere AI you added is not
working — make it working."*

**Goal:** A floating, public chatbot on every page that genuinely answers ExamSphere FAQs, and a
fix for the existing broken AI.

---

## Why the current AI is broken (from the audit)

See [`00-CURRENT-STATUS-AUDIT.md`](00-CURRENT-STATUS-AUDIT.md) §4. In short:

1. The chat UI (`components/ai/chat-interface.tsx`) is only mounted in **logged-in dashboards**
   — there's **nothing on the public site**.
2. The API route [`app/api/ai/chat/route.ts`](../../app/api/ai/chat/route.ts):
   - **returns `401` unless the user is logged in** (`if (!session) ... Unauthorized`) — a public
     visitor can never use it;
   - proxies to an external **"Flowversal"** server (`FLOWVERSAL_API_URL`, hardcoded IP) using
     `FLOWVERSAL_API_KEY`, which is **not set in `.env`** → every call fails.

**Fix direction:** build a **separate public chatbot endpoint** that does **not** require login
and uses a reliable provider. Don't try to reuse the auth-gated dashboard route for the public
widget.

---

## Target file(s)

- **New widget:** `components/ai/PublicChatbot.tsx` — floating button + popup panel (client
  component). Can reuse pieces of `chat-interface.tsx` but must be self-contained and
  **login-free**.
- **Mount globally:** [`app/(public)/layout.tsx`](../../app/(public)/layout.tsx) — render
  `<PublicChatbot />` after `<Footer />` so it appears on **every public page**. (For the whole
  app, mount in the root `app/layout.tsx` instead.)
- **New API route:** `app/api/public/chat/route.ts` — public, no auth, rate-limited.
- **Knowledge base:** `app/api/public/chat/knowledge.ts` — the ExamSphere FAQ content the bot
  answers from (courses, fees, admissions, contact, etc.). Pull course facts from
  [`reference/course-content-data.md`](reference/course-content-data.md).

---

## Widget requirements (UX)

- Floating **circular button, bottom-right**, `position: fixed`, high z-index, visible on
  homepage load (no delay/scroll needed).
- Click → opens a chat **popup panel** (≈ 380×560px desktop; near-fullscreen sheet on mobile).
- Header with "ExamSphere Assistant", messages list, input + send, typing indicator.
- A few **suggested-question chips** on open (e.g. "What courses do you offer?",
  "NEET course fees?", "How do I enroll?").
- Responsive; works desktop + mobile; dark-mode safe; close/minimize button.
- No login required to chat.

---

## Answer scope (must handle)

Courses · Admissions/Enrollment · Fees/Pricing · NEET · JEE · Foundation · MBBS · Contact
Information. Ground answers in the real site data (course content + contact details), and offer a
fallback ("I'll connect you — see our Contact page / query form") when unsure.

---

## Backend — recommended implementation

The app already targets **Anthropic/Claude models**. Recommended: use the **Claude API** with a
system prompt seeded from the knowledge base (simple, reliable, no external server).

- **Model:** `claude-haiku-4-5-20251001` (fast + cheap, ideal for an FAQ bot). Upgrade to
  `claude-sonnet-5` if answer quality needs it.
- **Env:** add `ANTHROPIC_API_KEY` to `.env` / `.env.production` (do **not** commit the key).
- **Route sketch** (`app/api/public/chat/route.ts`):
  - Accept `{ messages }`, no session required.
  - Prepend a **system prompt** = "You are the ExamSphere assistant. Answer only about ExamSphere
    courses (JEE, NEET, Foundation, MBBS), fees, admissions, and contact info. Here is the
    knowledge base: …". Inject `knowledge.ts`.
  - Rate-limit by IP (e.g. simple in-memory/Upstash) to prevent abuse.
  - Return the assistant text (stream if easy).
- **Load the `claude-api` skill** before writing this route for correct SDK usage, model IDs,
  streaming, and system-prompt/tool patterns.

**Alternative (no LLM cost):** a rules/keyword FAQ engine driven by `knowledge.ts` (intent →
canned answer). Cheaper and fully offline, but less natural. Acceptable if the client prefers no
API cost — but it must still feel real, not a "coming soon" placeholder.

> If the client insists on keeping "Flowversal": obtain a valid `FLOWVERSAL_API_KEY`, confirm the
> server is reachable, and drop the auth gate for the public widget. Given it's an unverified
> external IP with no key, the Claude API path is safer and recommended.

---

## Also: make the existing dashboard AI work

The logged-in AI (`/dashboard/ai`, `/admin/ai`, `/teacher/ai`) is broken for the same reason
(missing `FLOWVERSAL_API_KEY`). Either:
- point `app/api/ai/chat/route.ts` at the working Claude API too, or
- supply a valid Flowversal key and verify the endpoint.
Confirm which the client wants for the internal assistant.

---

## Acceptance criteria

- [ ] Floating button visible bottom-right on the homepage **immediately on load**, on every page.
- [ ] Opens a responsive popup; usable on desktop and mobile; no login required.
- [ ] Gives real answers about Courses/Admissions/Fees/NEET/JEE/Foundation/MBBS/Contact — grounded
      in site data, not lorem/placeholder.
- [ ] Backend endpoint works without a logged-in session; key stored in env, not committed.
- [ ] The previously-broken AI (public and/or dashboard) returns real responses.
- [ ] Graceful fallback + error handling (network fail shows a friendly message, points to Contact).

## Checklist

- [ ] `knowledge.ts` written from real ExamSphere data
- [ ] `app/api/public/chat/route.ts` (public, no-auth, rate-limited) built
- [ ] Provider decided (Claude API recommended) + `ANTHROPIC_API_KEY` set
- [ ] `PublicChatbot.tsx` floating widget built (button + popup + chips)
- [ ] Mounted globally in `app/(public)/layout.tsx`
- [ ] Tested on mobile + desktop, logged-out
- [ ] Existing dashboard AI fixed/confirmed
- [ ] `claude-api` skill consulted before implementing the route
