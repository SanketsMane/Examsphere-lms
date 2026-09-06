import "server-only";

import OpenAI from "openai";

/**
 * Central AI client — Vision IT Infra.
 *
 * The provider is an OpenAI-compatible proxy (POST /v1/chat/completions,
 * Authorization: Bearer vii_live_…), so the official `openai` SDK talks to it
 * directly and no bespoke HTTP client is needed.
 *
 * This replaces three different integrations that had drifted apart:
 *   - /api/ai/chat        -> Flowversal at a hardcoded plain-HTTP IP
 *                            (http://139.84.155.227:3000/api/tanchat), with an
 *                            Ollama fallback and ~60 lines of hand-rolled SSE
 *                            parsing that handled three different chunk shapes
 *   - /api/public/chat    -> the openai SDK, configured separately
 *   - an Ollama path      -> Basic auth against AI_BASE_URL
 *
 * None of those were configured in production, so the authenticated assistant
 * returned 503 and the public bot silently fell back to its FAQ engine.
 */

export const AI_BASE_URL = process.env.AI_BASE_URL?.trim() || "https://visionitinfra.com/v1";

/** Only models enabled on the key are accepted; the proxy 403s on anything else. */
export const AI_MODEL = process.env.AI_MODEL?.trim() || "gpt-4.1-mini";

export function isAiConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim());
}

/**
 * @throws if no key is configured — callers must check `isAiConfigured()` first
 *         and degrade gracefully rather than surfacing a crash.
 */
export function getAiClient(): OpenAI {
  const apiKey = process.env.AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new AiError("unconfigured", "The AI service is not configured.");

  return new OpenAI({
    apiKey,
    baseURL: AI_BASE_URL,
    // The proxy is a network hop in front of the model, so allow a generous
    // read timeout but do not retry automatically: a retried completion is
    // billed again, and 402/403 are not retryable anyway.
    timeout: 60_000,
    maxRetries: 0,
  });
}

/* ----------------------------------------------------------- error mapping */

export type AiErrorKind =
  | "unconfigured"
  | "auth"        // 401 — bad or revoked key
  | "no_credit"   // 402 — balance exhausted. Per the provider, a 402 is not billed.
  | "forbidden"   // 403 — model not enabled on this key
  | "rate_limit"  // 429
  | "upstream"    // 502 — provider or model unavailable
  | "timeout"
  | "unknown";

export class AiError extends Error {
  constructor(
    public kind: AiErrorKind,
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "AiError";
  }
}

/** Is it worth trying again later, or is this a standing condition? */
export function isRetryable(kind: AiErrorKind): boolean {
  return kind === "rate_limit" || kind === "upstream" || kind === "timeout";
}

/**
 * Map a provider failure onto a message that is safe and useful to show a user.
 * Never leaks the key, the upstream URL, or a raw provider payload.
 */
export function toAiError(err: unknown): AiError {
  if (err instanceof AiError) return err;

  const status: number | undefined =
    (err as any)?.status ?? (err as any)?.response?.status ?? undefined;

  const providerMessage: string | undefined =
    (err as any)?.error?.message ?? (err as any)?.message;

  switch (status) {
    case 401:
      return new AiError("auth", "The AI service rejected our credentials.", 401);
    case 402:
      return new AiError(
        "no_credit",
        "The AI assistant is temporarily unavailable. Please try again later.",
        402
      );
    case 403:
      return new AiError("forbidden", "That AI model is not available on this plan.", 403);
    case 429:
      return new AiError(
        "rate_limit",
        "The assistant is busy right now — please wait a moment and try again.",
        429
      );
    case 502:
    case 503:
    case 504:
      return new AiError(
        "upstream",
        "The AI service is temporarily unreachable. Please try again shortly.",
        status
      );
  }

  if (typeof providerMessage === "string" && /timeout|aborted/i.test(providerMessage)) {
    return new AiError("timeout", "The assistant took too long to respond. Please try again.");
  }

  return new AiError("unknown", "The assistant is unavailable right now. Please try again.");
}

/**
 * Log the operational detail server-side. The user-facing string stays generic;
 * this is what an admin needs in order to act (e.g. top up credit on a 402).
 */
export function logAiError(scope: string, e: AiError, extra?: Record<string, unknown>) {
  const advice: Partial<Record<AiErrorKind, string>> = {
    no_credit: "Vision IT Infra balance exhausted — top up the plan.",
    auth: "AI_API_KEY is invalid or revoked.",
    forbidden: `Model "${AI_MODEL}" is not enabled on this key.`,
    unconfigured: "AI_API_KEY is not set.",
  };
  console.error(
    `[AI:${scope}] ${e.kind}${e.status ? ` (${e.status})` : ""} — ${advice[e.kind] ?? e.message}`,
    extra ?? ""
  );
}
