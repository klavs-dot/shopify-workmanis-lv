// Server-side AI budget helpers. Uses firebase-admin (different SDK from the
// client-side aiBudget.ts) so it can run inside API routes with elevated
// privileges. Atomic increments via FieldValue.increment() ensure the
// per-day spend total stays correct when many parallel enrichments finish
// in close succession.

import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdmin } from "@/lib/firebase-admin";
import {
  DEFAULT_PRICE_PER_M_TOKENS,
  estimateCostUsd,
  todayKeyRiga,
  type PricePerMTokens,
} from "@/lib/ai/pricing";
import type { AiBudgetConfig, AiCostStats } from "@/lib/types";
import type { EnrichmentUsage } from "@/lib/ai/enrich";

export const DEFAULT_DAILY_CAP_USD_SERVER = 50;

export interface BudgetSnapshot {
  dailyCapUsd: number;
  spentTodayUsd: number;
  prices: PricePerMTokens;
}

/** Read both the current budget config and today's spend in one go. */
export async function getBudgetSnapshot(): Promise<BudgetSnapshot> {
  const { db } = getFirebaseAdmin();
  const [configSnap, statsSnap] = await Promise.all([
    db.doc("system/aiBudget").get(),
    db.doc(`aiCostStats/${todayKeyRiga()}`).get(),
  ]);
  const config = configSnap.exists
    ? (configSnap.data() as AiBudgetConfig)
    : null;
  const stats = statsSnap.exists ? (statsSnap.data() as AiCostStats) : null;

  const prices: PricePerMTokens = {
    input: config?.pricePerInputUsd ?? DEFAULT_PRICE_PER_M_TOKENS.input,
    output: config?.pricePerOutputUsd ?? DEFAULT_PRICE_PER_M_TOKENS.output,
    cacheCreationInput:
      config?.pricePerCacheCreationUsd ??
      DEFAULT_PRICE_PER_M_TOKENS.cacheCreationInput,
    cacheReadInput:
      config?.pricePerCacheReadUsd ?? DEFAULT_PRICE_PER_M_TOKENS.cacheReadInput,
  };

  return {
    dailyCapUsd: config?.dailyCapUsd ?? DEFAULT_DAILY_CAP_USD_SERVER,
    spentTodayUsd: stats?.totalCostUsd ?? 0,
    prices,
  };
}

/** Refuse to start a new enrichment when today's spend has already hit the
 *  cap. Returns null when we're under-budget. */
export function budgetExceededReason(
  snapshot: BudgetSnapshot
): string | null {
  if (snapshot.spentTodayUsd >= snapshot.dailyCapUsd) {
    return `Šodien AI budžets izsmelts (${snapshot.spentTodayUsd.toFixed(
      2
    )} / ${snapshot.dailyCapUsd.toFixed(
      2
    )} USD). Pārtraukts. Mainīt limitu var Iestatījumos.`;
  }
  return null;
}

/** Atomically add this call's cost to today's aiCostStats doc. */
export async function recordSpend(
  usage: EnrichmentUsage,
  prices: PricePerMTokens
): Promise<number> {
  const cost = estimateCostUsd(usage, prices);
  const { db } = getFirebaseAdmin();
  const id = todayKeyRiga();
  await db.doc(`aiCostStats/${id}`).set(
    {
      date: id,
      totalCostUsd: FieldValue.increment(cost),
      productCount: FieldValue.increment(1),
      inputTokens: FieldValue.increment(usage.inputTokens),
      outputTokens: FieldValue.increment(usage.outputTokens),
      cacheCreationInputTokens: FieldValue.increment(
        usage.cacheCreationInputTokens
      ),
      cacheReadInputTokens: FieldValue.increment(usage.cacheReadInputTokens),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return cost;
}
