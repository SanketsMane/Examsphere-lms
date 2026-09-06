import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { answerFromFaq, buildKnowledgeText, isOnTopic, OFF_TOPIC_REPLY } from "./knowledge";
import { AI_MODEL, getAiClient, isAiConfigured, logAiError, toAiError } from "@/lib/ai";

/**
 * Public chatbot endpoint — NO authentication required (unlike /api/ai/chat).
 * Always returns a useful, grounded answer:
 *   • If an AI key is configured, it asks Vision IT Infra (see lib/ai.ts) with the
 *     ExamSphere knowledge base as the system prompt.
 *   • Otherwise it falls back to a deterministic FAQ engine so the bot always works.
 */

export const dynamic = "force-dynamic";

// --- very small in-memory IP rate limiter (per server instance) ---
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_PER_WINDOW;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (rateLimited(ip)) {
      return NextResponse.json(
        { reply: "You're sending messages a bit fast — please wait a moment and try again." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as { messages?: ChatMessage[]; inquiryId?: string };
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const inquiryId = typeof body.inquiryId === "string" ? body.inquiryId : null;
    const latest = [...messages].reverse().find((m) => m.role === "user");
    const userText = (latest?.content || "").slice(0, 2000).trim();

    if (!userText) {
      return NextResponse.json({ reply: "Please type a question and I'll help you out!" });
    }

    // Compute the reply. COST CONTROL: only spend a paid API call when the question is
    // actually about ExamSphere. Off-topic ("free ChatGPT" abuse) is refused here for free.
    let reply: string | null = null;
    const onTopic = isOnTopic(userText);

    if (isAiConfigured() && onTopic) {
      try {
        reply = await llmReply(messages, userText);
      } catch (err) {
        // Never fail the visitor: fall through to the deterministic FAQ engine.
        // The server log still records *why* (402 = balance exhausted, etc).
        logAiError("public-chat", toAiError(err));
      }
    }
    if (!reply) {
      reply = onTopic ? answerFromFaq(userText) : OFF_TOPIC_REPLY;
    }

    // Persist this turn against the lead (best-effort — never blocks the reply).
    if (inquiryId) {
      persistTurn(inquiryId, userText, reply).catch((e) =>
        console.error("Persist chat turn failed:", e?.message || e)
      );
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Public chat error:", err);
    return NextResponse.json(
      { reply: "Sorry, something went wrong. Please try again or use the query form in the footer." },
      { status: 200 }
    );
  }
}

/** Store the user's message + assistant reply against an inquiry and bump its counters. */
async function persistTurn(inquiryId: string, userText: string, reply: string): Promise<void> {
  const exists = await prisma.chatInquiry.findUnique({ where: { id: inquiryId }, select: { id: true } });
  if (!exists) return; // ignore stale / forged ids
  const now = new Date();
  await prisma.$transaction([
    prisma.chatInquiryMessage.createMany({
      data: [
        { inquiryId, role: "user", content: userText.slice(0, 4000) },
        { inquiryId, role: "assistant", content: reply.slice(0, 8000) },
      ],
    }),
    prisma.chatInquiry.update({
      where: { id: inquiryId },
      data: { messageCount: { increment: 2 }, lastMessageAt: now },
    }),
  ]);
}

async function llmReply(history: ChatMessage[], userText: string): Promise<string | null> {
  // Shared Vision IT Infra client — same key, base URL and model as the
  // authenticated assistant, rather than a second copy of the config here.
  const client = getAiClient();

  const trimmed = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  const completion = await client.chat.completions.create({
    model: AI_MODEL,
    temperature: 0.4,
    max_tokens: 500,
    messages: [
      { role: "system", content: buildKnowledgeText() },
      ...trimmed,
      // ensure the latest user message is present even if history was empty
      ...(trimmed.some((m) => m.role === "user") ? [] : [{ role: "user" as const, content: userText }]),
    ],
  });

  return completion.choices[0]?.message?.content?.trim() || null;
}
