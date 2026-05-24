import type { AppUser, Pallet, Product } from "@/lib/types";

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

    for (const p of myProducts) {
      const value = p.finalPrice ?? p.referencePrice ?? 0;
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
      potentialProfitEur,
    };
  });
}

/** Pick the active warehouse worker with the lowest current month potential
 *  profit. Returns null if no active workers exist. */
export function recommendWorker(stats: WorkerMonthStats[]): WorkerMonthStats | null {
  if (stats.length === 0) return null;
  return stats.reduce((min, s) =>
    s.potentialProfitEur < min.potentialProfitEur ? s : min
  );
}
