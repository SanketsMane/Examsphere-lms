/**
 * Anthropic first-party API prices, US dollars per million tokens (as of 2026-10).
 * Used only for estimates and the monthly budget guard. Update if prices change:
 * https://www.anthropic.com/pricing
 */
export const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  "claude-opus-5-5": { input: 4, output: 20 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-fable-5-1": { input: 10, output: 50 },
  "claude-opus-5": { input: 5, output: 25 },
};

export const SELECTABLE_MODELS = [
  { id: "claude-opus-5-5", label: "Claude Opus 5.5 (recommended: best accuracy)" },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 (faster, about half the cost)" },
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5 (cheapest; for clean printed pages)" },
] as const;

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  model: string;
}

/** Estimated cost in millionths of a dollar (integer, for summing in the database). */
export function usageCostMicros(u: TokenUsage): number {
  const p = MODEL_PRICES[u.model] ?? MODEL_PRICES["claude-opus-5-5"];
  const input = u.inputTokens + (u.cacheCreationTokens ?? 0) * 1.25 + (u.cacheReadTokens ?? 0) * 0.1;
  return Math.round(input * p.input + u.outputTokens * p.output); // tokens x $/MTok = micro-dollars
}

/**
 * Rough cost of generating notes from `pages` source pages, as a range. Per page: reading
 * (~1.8k in / ~1.5k out incl. thinking), writing (~1k in / ~1.2k out) and review (~1.5k in / ~0.3k out).
 */
export function estimateGenerationUsd(pages: number, model: string): { low: number; high: number } {
  const p = MODEL_PRICES[model] ?? MODEL_PRICES["claude-opus-5-5"];
  const perPage = (4300 * p.input + 3000 * p.output) / 1_000_000;
  const mid = Math.max(1, pages) * perPage;
  return { low: +(mid * 0.6).toFixed(2), high: +(mid * 1.6).toFixed(2) };
}
