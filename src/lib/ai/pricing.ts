// Per-token pricing for Claude Opus 4.7, denominated in USD per 1M tokens.
//
// Source: https://www.anthropic.com/pricing (orientējoši — Anthropic
// occasionally repricec, so the numbers below are the published list at the
// time of writing). The Iestatījumi page lets MASTER override these via the
// `system/aiBudget` Firestore doc, so we can react to price changes without
// a code deploy.
//
// Cache tokens follow the standard split:
//   - cache_creation_input_tokens: charged 25% extra vs. regular input
//   - cache_read_input_tokens:     charged at ~10% of regular input

import type { EnrichmentUsage } from "@/lib/ai/enrich";

/** Default Opus 4.7 prices in USD / 1M tokens. */
export const DEFAULT_PRICE_PER_M_TOKENS = {
  input: 15,
  output: 75,
  cacheCreationInput: 18.75, // input × 1.25
  cacheReadInput: 1.5,       // input × 0.10
} as const;

export interface PricePerMTokens {
  input: number;
  output: number;
  cacheCreationInput: number;
  cacheReadInput: number;
}

/** Compute the USD cost of a single Claude call's token usage. */
export function estimateCostUsd(
  usage: EnrichmentUsage,
  prices: PricePerMTokens = DEFAULT_PRICE_PER_M_TOKENS
): number {
  const million = 1_000_000;
  return (
    (usage.inputTokens * prices.input) / million +
    (usage.outputTokens * prices.output) / million +
    (usage.cacheCreationInputTokens * prices.cacheCreationInput) / million +
    (usage.cacheReadInputTokens * prices.cacheReadInput) / million
  );
}

/** YYYY-MM-DD in the project's reference timezone (Europe/Riga).
 *  Used as the document id for aiCostStats so a single calendar day rolls up. */
export function todayKeyRiga(now: Date = new Date()): string {
  // Riga is UTC+2 (UTC+3 in summer). For budget purposes the small DST jump is
  // irrelevant — we just need a stable per-day bucket.
  const offsetMs = 3 * 60 * 60 * 1000; // UTC+3 as a conservative bias
  const local = new Date(now.getTime() + offsetMs);
  return [
    local.getUTCFullYear(),
    String(local.getUTCMonth() + 1).padStart(2, "0"),
    String(local.getUTCDate()).padStart(2, "0"),
  ].join("-");
}
