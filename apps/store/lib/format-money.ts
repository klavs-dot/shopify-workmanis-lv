import type { Money } from "@/types/product";

/** Format an EUR amount the way Latvian shoppers expect:
 *      19.99 €     (comma decimal, space-thin-thousands, € suffix)
 *
 *  Intl handles the locale rules — we just pick the symbol style. We don't
 *  use the built-in "currency" style for EUR because Intl puts "€" in front
 *  for en-US but after the number for lv-LV, and we want to be consistent. */
export function formatMoney(money: Money): string {
  const n = new Intl.NumberFormat("lv-LV", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(money.amount);
  return `${n} €`;
}

/** Returns a positive number 0..99 (or null) representing how much percent
 *  off compareAtPrice the current price is. Used for the discount badge. */
export function discountPercent(
  price: Money,
  compareAt: Money | undefined
): number | null {
  if (!compareAt) return null;
  if (compareAt.amount <= price.amount) return null;
  const pct = Math.round(((compareAt.amount - price.amount) / compareAt.amount) * 100);
  if (pct <= 0) return null;
  return Math.min(99, pct);
}
