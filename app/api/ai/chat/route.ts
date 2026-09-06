import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  AI_MODEL,
  getAiClient,
  isAiConfigured,
  isRetryable,
  logAiError,
  toAiError,
} from "@/lib/ai";

export const dynamic = "force-dynamic";

/**
 * Authenticated AI assistant (used by /dashboard/ai and /admin/ai).
 *
 * Now talks to Vision IT Infra through the shared client in lib/ai.ts. It
 * previously posted to a hardcoded plain-HTTP address
 * (http://139.84.155.227:3000/api/tanchat), fell back to an Ollama instance,
 * and parsed the SSE stream by hand across three possible chunk shapes — then
 * buffered the whole thing and returned it as one JSON body anyway. None of the
 * required env vars were set in production, so this endpoint returned 503.
 */

const MAX_HISTORY = 10;
const MAX_MESSAGE_CHARS = 4000;

interface ChatRequestBody {
  messages: { role: string; content: string }[];
  conversationId?: string;
  attachments?: string[];
}

/** Only roles the provider accepts, and trimmed to a sane size. */
function sanitizeHistory(msgs: { role: string; content: string }[]) {
  return msgs
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: String(m.content ?? "").slice(0, MAX_MESSAGE_CHARS),
    }));
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "The AI assistant isn't configured yet. Please contact an administrator." },
      { status: 503 }
    );
  }

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { messages, conversationId, attachments } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  const latestUserMessage = [...messages].reverse().find((m) => m.role === "user");
  if (!latestUserMessage?.content?.trim()) {
    return NextResponse.json({ error: "Please enter a message." }, { status: 400 });
  }

  try {
    // Ownership check before touching the conversation.
    if (conversationId) {
      const owned = await prisma.aiConversation.findFirst({
        where: { id: conversationId, userId: session.user.id },
        select: { id: true },
      });
      if (!owned) {
        return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
      }

      await prisma.aiMessage.create({
        data: {
          conversationId,
          role: "user",
          content: latestUserMessage.content.slice(0, MAX_MESSAGE_CHARS),
          attachments: attachments ?? [],
        },
      });
      await prisma.aiConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    }

    // Build context from the stored conversation when there is one, so the
    // assistant is not at the mercy of whatever the client chose to send.
    let context: { role: "user" | "assistant"; content: string }[];
    if (conversationId) {
      const history = await prisma.aiMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: MAX_HISTORY,
        select: { role: true, content: true },
      });
      context = sanitizeHistory(history.reverse() as any);
    } else {
      context = sanitizeHistory(messages);
    }

    const systemPrompt = [
      "You are ExamSphere AI, the assistant inside the ExamSphere learning platform.",
      `The current user's role is: ${(session.user as any).role ?? "student"}.`,
      "ExamSphere is an exam-preparation platform for JEE, NEET, school Foundation (Class 9-12) and MBBS students.",
      "Answer concisely and accurately. Use Markdown. If you are unsure, say so rather than guessing.",
    ].join(" ");

    const client = getAiClient();
    const completion = await client.chat.completions.create({
      model: AI_MODEL,
      // max_tokens improves the provider's credit accounting accuracy.
      max_tokens: 1000,
      temperature: 0.4,
      messages: [{ role: "system", content: systemPrompt }, ...context],
    });

    const content = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!content) {
      return NextResponse.json(
        { error: "The assistant returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    if (conversationId) {
      await prisma.aiMessage.create({
        data: { conversationId, role: "assistant", content, attachments: [] },
      });
    }

    return NextResponse.json({ role: "assistant", content });
  } catch (err) {
    const e = toAiError(err);
    logAiError("chat", e, { userId: session.user.id });
    // Distinguish "try again" from "this will keep failing" so the UI can say
    // something useful instead of a blanket "Something went wrong".
    return NextResponse.json(
      { error: e.message, retryable: isRetryable(e.kind) },
      { status: e.status ?? 503 }
    );
  }
}
