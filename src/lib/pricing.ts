// Pricing engine for shopify.workmanis.lv
//
// Loģika:
//   basePrice = marketPrice ? min(referencePrice, marketPrice) : referencePrice
//   suggested = basePrice * conditionCoefficient
//   suggested -> roundToDot99
//   recommendedAction iesakām pēc suggested:
//     < 5 EUR  -> bundle vai outlet
//     5-10 EUR -> manual_review
//     >= 10    -> sell_individually
//
// Damaged_product vienmēr iet uz outlet ar manuālu pārbaudi.

import type { ProductCondition, RecommendedAction } from "@/lib/types";

export const CONDITION_COEFFICIENT: Record<ProductCondition, number> = {
  brand_new: 0.5,
  open_box: 0.4,
  damaged_package: 0.3,
  untested: 0.2,
  damaged_product: 0.1,
};

export interface PricingInput {
  referencePrice: number;
  marketPrice?: number | null;
  condition: ProductCondition;
}

export interface PricingResult {
  basePrice: number;
  rawSuggested: number;
  suggestedPrice: number;
  recommendedAction: RecommendedAction;
  reason: string;
}

/** Round price upward so it ends with .99 — typical retail rounding. */
export function roundToDot99(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value < 1) return 0.99;
  const intPart = Math.floor(value);
  // 5.40 -> 5.99 ; 5.99 -> 5.99 ; 6.00 -> 6.99
  const candidate = intPart + 0.99;
  return candidate >= value ? candidate : candidate + 1;
}

export function computePricing(input: PricingInput): PricingResult {
  const ref = Number(input.referencePrice) || 0;
  const market = input.marketPrice != null ? Number(input.marketPrice) : null;

  const basePrice = market != null && market > 0 ? Math.min(ref, market) : ref;
  const coefficient = CONDITION_COEFFICIENT[input.condition];
  const rawSuggested = basePrice * coefficient;
  const suggestedPrice = roundToDot99(rawSuggested);

  let recommendedAction: RecommendedAction;
  let reason: string;

  if (input.condition === "damaged_product") {
    recommendedAction = "outlet";
    reason = "Bojāts produkts — vienmēr outlet.";
  } else if (suggestedPrice < 5) {
    recommendedAction = "bundle";
    reason = `Ieteiktā cena ${suggestedPrice.toFixed(2)} < 5 — bundle vai outlet.`;
  } else if (suggestedPrice < 10) {
    recommendedAction = "manual_review";
    reason = `Cena ${suggestedPrice.toFixed(2)} robežzonā — pārbaudīt manuāli.`;
  } else {
    recommendedAction = "sell_individually";
    reason = `Cena ${suggestedPrice.toFixed(2)} ≥ 10 — var tirgot individuāli.`;
  }

  return { basePrice, rawSuggested, suggestedPrice, recommendedAction, reason };
}

export const RECOMMENDED_ACTION_LABEL: Record<RecommendedAction, string> = {
  sell_individually: "Tirgot individuāli",
  bundle: "Bundle",
  outlet: "Outlet",
  manual_review: "Pārbaudīt manuāli",
  do_not_publish: "Nepublicēt",
};
