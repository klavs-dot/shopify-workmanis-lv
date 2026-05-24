import type { AppUser, Pallet, Product } from "@/lib/types";

export const SHIPMENT_OVERDUE_DAYS = 3;

/** Per-worker month statistics used by the dashboard, the assignment
 *  recommender, and the Noliktavas darbinieki page. All EUR-denominated. */
export interface WorkerMonthStats {
  uid: string;
  email: string;
  displayName: string;
  /** Pallets currently bound to this worker (assigned or already claimed). */
  palletCount: number;
  inStoreCount: number;
  inStoreValue: number;
  /** Products on a worker's pallets that haven't reached the store yet. */
  sortingCount: number;
  sortingValue: number;
  soldCount: number;
  soldValue: number;
  disposedCount: number;
  disposedValue: number;
  /** Customer-paid products still waiting to be physically shipped. These
   *  are NOT date-range-filtered — they reflect the worker's current pending
   *  workload regardless of which month soldAt falls in. */
  unshippedCount: number;
  unshippedValue: number;
  /** Largest age (in whole days) of any pending shipment for this worker.
   *  null when nothing is pending. */
  oldestUnshippedDays: number | null;
  /** True if at least one pending shipment is older than SHIPMENT_OVERDUE_DAYS. */
  hasOverdueShipment: boolean;
  /** Predicted profit on this worker's pallets for the month — 50% of the
   *  total RRP of all bound pallets (sold + in store + still in sorting +
   *  still in transit). Used to balance new assignments. */
  potentialProfitEur: number;
}

function monthRange(now: Date = new Date()): { from: Date; to: Date } {
  const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

function inRange(d: Date | null | undefined, from: Date, to: Date): boolean {
  if (!d) return false;
  return d >= from && d <= to;
}

/** "Bound to" = assigned to OR sorting-claimed by OR (legacy) sorted by.
 *  Used to find pallets that should count towards a worker's load. */
function isPalletBoundTo(p: Pallet, uid: string): boolean {
  return p.assignedWarehouseUid === uid || p.sortingClaimedBy === uid;
}

export interface BuildStatsOptions {
  /** Defaults to the current calendar month. */
  from?: Date;
  to?: Date;
}

export function buildWorkerStats(
  workers: AppUser[],
  pallets: Pallet[],
  products: Product[],
  opts: BuildStatsOptions = {}
): WorkerMonthStats[] {
  const { from, to } = opts.from && opts.to ? { from: opts.from, to: opts.to } : monthRange();

  return workers.map((w) => {
    const myPallets = pallets.filter((p) => isPalletBoundTo(p, w.uid));
    const palletIds = new Set(myPallets.map((p) => p.id));
    const myProducts = products.filter((p) => palletIds.has(p.palletId));

    let inStoreCount = 0;
    let inStoreValue = 0;
    let sortingCount = 0;
    let sortingValue = 0;
    let soldCount = 0;
    let soldValue = 0;
    let disposedCount = 0;
    let disposedValue = 0;
    let unshippedCount = 0;
    let unshippedValue = 0;
    let oldestUnshippedDays: number | null = null;

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (const p of myProducts) {
      const value = p.finalPrice ?? p.referencePrice ?? 0;

      // Pending shipment count is always "current" — independent of the
      // date filter. Workers need to see open shipments regardless of
      // which range the admin happens to be inspecting.
      if (p.listingStatus === "sold" && !p.shippedAt) {
        unshippedCount += 1;
        unshippedValue += p.soldPrice ?? value;
        const soldAtMs = p.soldAt?.toMillis?.() ?? null;
        if (soldAtMs != null) {
          const ageDays = Math.floor((now - soldAtMs) / dayMs);
          if (oldestUnshippedDays == null || ageDays > oldestUnshippedDays) {
            oldestUnshippedDays = ageDays;
          }
        }
      }

      switch (p.listingStatus) {
        case "sold": {
          const soldAt = p.soldAt?.toDate?.() ?? null;
          if (inRange(soldAt, from, to)) {
            soldCount += 1;
            soldValue += p.soldPrice ?? value;
          }
          break;
        }
        case "listed_in_store":
        case "listing_approved": {
          const listedAt =
            p.listedAt?.toDate?.() ?? p.createdAt?.toDate?.() ?? null;
          if (inRange(listedAt, from, to)) {
            inStoreCount += 1;
            inStoreValue += value;
          }
          break;
        }
        case "disposed": {
          // Disposal has no dedicated timestamp — fall back to updatedAt.
          const ts = p.updatedAt?.toDate?.() ?? p.createdAt?.toDate?.() ?? null;
          if (inRange(ts, from, to)) {
            disposedCount += 1;
            disposedValue += value;
          }
          break;
        }
        case "not_listed": {
          const ts = p.createdAt?.toDate?.() ?? null;
          if (inRange(ts, from, to)) {
            sortingCount += 1;
            sortingValue += value;
          }
          break;
        }
      }
    }

    const hasOverdueShipment =
      oldestUnshippedDays != null && oldestUnshippedDays > SHIPMENT_OVERDUE_DAYS;

    // Pallets created this month — these are the ones that contribute to the
    // potential-profit number used for load balancing. We use 50% of RRP as
    // the predicted profit (same heuristic as the manifest card).
    const monthPallets = myPallets.filter((p) => {
      const ts = p.createdAt?.toDate?.() ?? null;
      return inRange(ts, from, to);
    });
    const potentialProfitEur = monthPallets.reduce(
      (acc, p) => acc + p.totalReferencePrice * 0.5,
      0
    );

    return {
      uid: w.uid,
      email: w.email,
      displayName: w.displayName || w.email,
      palletCount: monthPallets.length,
      inStoreCount,
      inStoreValue,
      sortingCount,
      sortingValue,
      soldCount,
      soldValue,
      disposedCount,
      disposedValue,
      unshippedCount,
      unshippedValue,
      oldestUnshippedDays,
      hasOverdueShipment,
      potentialProfitEur,
    };
  });
}

/** Compute the list of pending-shipment products for a single worker,
 *  sorted oldest-first so the most overdue one rises to the top. */
export function pendingShipments(
  uid: string,
  pallets: Pallet[],
  products: Product[]
): Product[] {
  const palletIds = new Set(
    pallets
      .filter((p) => p.assignedWarehouseUid === uid || p.sortingClaimedBy === uid)
      .map((p) => p.id)
  );
  return products
    .filter(
      (p) =>
        palletIds.has(p.palletId) &&
        p.listingStatus === "sold" &&
        !p.shippedAt
    )
    .sort((a, b) => {
      const at = a.soldAt?.toMillis?.() ?? 0;
      const bt = b.soldAt?.toMillis?.() ?? 0;
      return at - bt;
    });
}

/** Days since a sale, floored. Returns null when soldAt is missing. */
export function daysSinceSold(p: Product, now: number = Date.now()): number | null {
  const ms = p.soldAt?.toMillis?.() ?? null;
  if (ms == null) return null;
  return Math.floor((now - ms) / (24 * 60 * 60 * 1000));
}

/** Pick the active warehouse worker with the lowest current month potential
 *  profit. Returns null if no active workers exist. */
export function recommendWorker(stats: WorkerMonthStats[]): WorkerMonthStats | null {
  if (stats.length === 0) return null;
  return stats.reduce((min, s) =>
    s.potentialProfitEur < min.potentialProfitEur ? s : min
  );
}
