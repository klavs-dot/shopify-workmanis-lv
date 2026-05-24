"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { useAuth } from "@/lib/auth/AuthProvider";
import { listPallets } from "@/lib/firestore/pallets";
import { listProducts } from "@/lib/firestore/products";
import { listUsers } from "@/lib/firestore/users";
import { updateProduct } from "@/lib/firestore/products";
import { logAudit } from "@/lib/firestore/audit";
import {
  buildWorkerStats,
  daysSinceSold,
  pendingShipments,
  SHIPMENT_OVERDUE_DAYS,
  type WorkerMonthStats,
} from "@/lib/warehouseStats";
import { serverTimestamp } from "firebase/firestore";
import {
  InvestmentRobot,
  SoldRobot,
  InStoreRobot,
  DisposedRobot,
} from "@/components/RobotMascots";
import type { AppUser, Pallet, Product } from "@/lib/types";

export default function DashboardPage() {
  return (
    <RequireRole allow={["MASTER", "ADMIN", "WAREHOUSE", "VIEWER"]}>
      <AppShell>
        <DashboardRouter />
      </AppShell>
    </RequireRole>
  );
}

function DashboardRouter() {
  const { appUser } = useAuth();
  if (!appUser) return <div className="text-sm text-slate-500">Ielāde…</div>;
  if (appUser.role === "WAREHOUSE") {
    return (
      <WarehouseDashboard
        uid={appUser.uid}
        email={appUser.email}
        displayName={appUser.displayName}
      />
    );
  }
  return <AdminDashboard />;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function startOfMonthISO(): string {
  const d = new Date();
  d.setDate(1);
  return iso(d);
}
function todayISO(): string {
  return iso(new Date());
}
function iso(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}
function parseLocal(s: string, endOfDay = false): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(
    y,
    m - 1,
    d,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );
}

function inRange(d: Date | null | undefined, from: Date | null, to: Date | null): boolean {
  if (!d) return false;
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Admin / Master / Viewer dashboard
// ---------------------------------------------------------------------------

interface AdminTotals {
  investedEur: number;
  soldValueEur: number;
  inStoreValueEur: number;
  disposedValueEur: number;
}

function AdminDashboard() {
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [workers, setWorkers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState<string>(startOfMonthISO());
  const [dateTo, setDateTo] = useState<string>(todayISO());

  useEffect(() => {
    (async () => {
      try {
        const [allPallets, allProducts, allUsers] = await Promise.all([
          listPallets(),
          listProducts({ limitTo: 5000 }),
          listUsers(),
        ]);
        setPallets(allPallets);
        setProducts(allProducts);
        setWorkers(allUsers.filter((u) => u.role === "WAREHOUSE"));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Neizdevās ielādēt datus");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totals = useMemo<AdminTotals>(() => {
    const from = parseLocal(dateFrom, false);
    const to = parseLocal(dateTo, true);

    let investedEur = 0;
    let soldValueEur = 0;
    let inStoreValueEur = 0;
    let disposedValueEur = 0;

    // Pallets created in range → contribute to "invested" totals.
    for (const p of pallets) {
      const created = p.createdAt?.toDate?.() ?? null;
      if (inRange(created, from, to) && p.purchasePrice != null) {
        investedEur += p.purchasePrice;
      }
    }

    // Products by lifecycle status in range.
    for (const p of products) {
      const value = p.finalPrice ?? p.referencePrice ?? 0;
      switch (p.listingStatus) {
        case "sold": {
          const soldAt = p.soldAt?.toDate?.() ?? null;
          if (inRange(soldAt, from, to)) {
            soldValueEur += p.soldPrice ?? value;
          }
          break;
        }
        case "listed_in_store":
        case "listing_approved": {
          const listedAt =
            p.listedAt?.toDate?.() ?? p.createdAt?.toDate?.() ?? null;
          if (inRange(listedAt, from, to)) {
            inStoreValueEur += value;
          }
          break;
        }
        case "disposed": {
          const ts = p.updatedAt?.toDate?.() ?? p.createdAt?.toDate?.() ?? null;
          if (inRange(ts, from, to)) {
            disposedValueEur += value;
          }
          break;
        }
      }
    }

    return { investedEur, soldValueEur, inStoreValueEur, disposedValueEur };
  }, [pallets, products, dateFrom, dateTo]);

  const workerStats = useMemo<WorkerMonthStats[]>(() => {
    const from = parseLocal(dateFrom, false) ?? undefined;
    const to = parseLocal(dateTo, true) ?? undefined;
    return buildWorkerStats(workers, pallets, products, { from, to });
  }, [workers, pallets, products, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Operāciju pārskats izvēlētajā datumu diapazonā.
        </p>
      </div>

      {/* Date filter */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <label className="block">
          <span className="text-xs font-medium text-slate-700">No datuma</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="mt-1 block rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-700">Līdz datumam</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="mt-1 block rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setDateFrom(startOfMonthISO());
            setDateTo(todayISO());
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
        >
          Šis mēnesis
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Ielāde…</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : (
        <>
          {/* 4 robot metric cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <RobotMetric
              label="Ieguldītā nauda"
              valueEur={totals.investedEur}
              tone="violet"
              robot={<InvestmentRobot className="h-full w-full" />}
            />
            <RobotMetric
              label="Pārdotas preces"
              valueEur={totals.soldValueEur}
              tone="blue"
              robot={<SoldRobot className="h-full w-full" />}
            />
            <RobotMetric
              label="Preces veikalā"
              valueEur={totals.inStoreValueEur}
              tone="emerald"
              robot={<InStoreRobot className="h-full w-full" />}
            />
            <RobotMetric
              label="Utilizētās preces"
              valueEur={totals.disposedValueEur}
              tone="slate"
              robot={<DisposedRobot className="h-full w-full" />}
            />
          </div>

          {/* Workers section */}
          <div>
            <h2 className="text-sm font-semibold text-slate-700">
              Noliktavas darbinieki ({workerStats.length})
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Statistika izvēlētajā diapazonā. Spied karti, lai redzētu detaļas
              un bonusa aprēķinu.
            </p>
            {workerStats.length === 0 ? (
              <div className="mt-3 rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
                Vēl nav neviena Warehouse darbinieka.{" "}
                <Link
                  href="/noliktavas-darbinieki/jauns"
                  className="font-semibold text-slate-900 underline-offset-2 hover:underline"
                >
                  Pievienot →
                </Link>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {workerStats.map((s) => (
                  <Link
                    key={s.uid}
                    href={`/noliktavas-darbinieki/${s.uid}`}
                    className={`block rounded-lg border bg-white p-4 shadow-sm transition hover:shadow ${
                      s.hasOverdueShipment
                        ? "border-red-400"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {s.displayName}
                        </div>
                        <div className="truncate text-[11px] text-slate-500">
                          {s.email}
                        </div>
                      </div>
                      {s.hasOverdueShipment && (
                        <span
                          className="shipment-overdue inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                          title={`Vecākais sūtījums: ${s.oldestUnshippedDays} d.`}
                        >
                          ⚠ {s.oldestUnshippedDays}d kavēts
                        </span>
                      )}
                    </div>

                    <dl className="mt-3 grid grid-cols-3 gap-1.5 text-[11px]">
                      <Mini
                        label="Veikalā"
                        value={`${s.inStoreValue.toFixed(0)} €`}
                        tone="emerald"
                      />
                      <Mini
                        label="Pārdotās"
                        value={`${s.soldValue.toFixed(0)} €`}
                        tone="blue"
                      />
                      <Mini
                        label="Utilizētās"
                        value={`${s.disposedValue.toFixed(0)} €`}
                        tone="red"
                      />
                    </dl>

                    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Klienti nopirkuši</span>
                        <span className="tabular font-semibold text-slate-900">
                          {s.soldCount} gab. · {s.soldValue.toFixed(0)} €
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-slate-600">Nav izsūtīts</span>
                        <span
                          className={`tabular font-semibold ${
                            s.hasOverdueShipment
                              ? "text-red-700"
                              : s.unshippedCount > 0
                              ? "text-amber-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {s.unshippedCount} gab. · {s.unshippedValue.toFixed(0)} €
                          {s.unshippedCount > 0 &&
                            s.oldestUnshippedDays != null && (
                              <span className="ml-1 text-[10px] opacity-80">
                                (vec. {s.oldestUnshippedDays}d)
                              </span>
                            )}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function RobotMetric({
  label,
  valueEur,
  tone,
  robot,
}: {
  label: string;
  valueEur: number;
  tone: "violet" | "blue" | "emerald" | "slate";
  robot: React.ReactNode;
}) {
  const cls = {
    violet:
      "border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100 text-violet-900",
    blue:
      "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900",
    emerald:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-900",
    slate:
      "border-slate-300 bg-gradient-to-br from-slate-50 to-slate-200 text-slate-900",
  }[tone];

  return (
    <div className={`flex flex-col rounded-2xl border-2 p-4 shadow-sm ${cls}`}>
      <div className="text-xs uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-extrabold tabular">
        {valueEur.toFixed(2)} €
      </div>
      <div className="mt-2 flex h-28 items-center justify-center">
        <div className="aspect-square h-full max-h-full w-auto">{robot}</div>
      </div>
    </div>
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "blue" | "red";
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-900"
      : "border-red-200 bg-red-50 text-red-900";
  return (
    <div className={`rounded-md border px-2 py-1.5 ${cls}`}>
      <div className="text-[9px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="tabular font-semibold">{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Warehouse worker dashboard — personal sales metrics
// ---------------------------------------------------------------------------

function WarehouseDashboard({
  uid,
  email,
  displayName,
}: {
  uid: string;
  email: string;
  displayName: string;
}) {
  const [dateFrom, setDateFrom] = useState<string>(startOfMonthISO());
  const [dateTo, setDateTo] = useState<string>(todayISO());
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shippingId, setShippingId] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const [allPallets, allProducts] = await Promise.all([
        listPallets(),
        listProducts({ limitTo: 2000 }),
      ]);
      setPallets(allPallets);
      setProducts(allProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neizdevās ielādēt datus");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const myShipments = useMemo(
    () => pendingShipments(uid, pallets, products),
    [uid, pallets, products]
  );

  const overdueExists = useMemo(
    () =>
      myShipments.some((p) => {
        const d = daysSinceSold(p);
        return d != null && d > SHIPMENT_OVERDUE_DAYS;
      }),
    [myShipments]
  );

  const markShipped = async (productId: string) => {
    setShippingId(productId);
    try {
      await updateProduct(productId, {
        shippedAt: serverTimestamp(),
        shippedByUid: uid,
      });
      await logAudit({
        userId: uid,
        userEmail: email,
        action: "product_marked_shipped",
        entityType: "product",
        entityId: productId,
        after: { shippedByUid: uid },
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setShippingId(null);
    }
  };

  const myPalletIds = useMemo(
    () =>
      new Set(
        pallets
          .filter((p) => p.sortingClaimedBy === uid || p.assignedWarehouseUid === uid)
          .map((p) => p.id)
      ),
    [pallets, uid]
  );

  const myProducts = useMemo(
    () => products.filter((p) => myPalletIds.has(p.palletId)),
    [products, myPalletIds]
  );

  const stats = useMemo(() => {
    const from = parseLocal(dateFrom, false);
    const to = parseLocal(dateTo, true);

    let soldCount = 0;
    let soldSum = 0;
    let unsoldCount = 0;
    let unsoldSum = 0;

    for (const p of myProducts) {
      const status = p.listingStatus;
      if (status === "sold") {
        const soldAt = p.soldAt?.toDate?.() ?? null;
        if (!inRange(soldAt, from, to)) continue;
        soldCount += 1;
        soldSum += p.soldPrice ?? p.finalPrice ?? p.referencePrice ?? 0;
        continue;
      }
      if (status === "listed_in_store" || status === "listing_approved") {
        const listedAt =
          p.listedAt?.toDate?.() ?? p.createdAt?.toDate?.() ?? null;
        if (!inRange(listedAt, from, to)) continue;
        unsoldCount += 1;
        unsoldSum += p.finalPrice ?? p.referencePrice ?? 0;
      }
    }

    return { soldCount, soldSum, unsoldCount, unsoldSum };
  }, [myProducts, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Sveiks{displayName ? `, ${displayName}` : ""}!
        </h1>
        <p className="text-sm text-slate-500">
          Tava personīgā statistika no precēm, ko esi šķirojis. Filtrē pēc
          datuma diapazona (ieskaitot abus galus).
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <label className="block">
          <span className="text-xs font-medium text-slate-700">No datuma</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="mt-1 block rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-700">Līdz datumam</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="mt-1 block rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setDateFrom(startOfMonthISO());
            setDateTo(todayISO());
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
        >
          Šis mēnesis
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Ielāde…</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : (
        <>
          {/* Shipment alert + pending list */}
          {myShipments.length > 0 && (
            <section
              className={`rounded-lg border-2 p-4 ${
                overdueExists
                  ? "border-red-400 bg-red-50"
                  : "border-blue-200 bg-blue-50"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2
                    className={`text-sm font-semibold ${
                      overdueExists ? "text-red-900" : "text-blue-900"
                    }`}
                  >
                    {overdueExists ? "⚠️ " : "📦 "}
                    Klientiem jāizsūta — {myShipments.length} prece(s)
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-700">
                    {overdueExists
                      ? `Dažas preces nav izsūtītas ilgāk par ${SHIPMENT_OVERDUE_DAYS} dienām. Lūdzu, nokārto šodien!`
                      : "Sakārto izsūtīšanu un atzīmē, kad nodod kurjeram."}
                  </p>
                </div>
                {overdueExists && (
                  <span className="shipment-overdue inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider">
                    Kavēts!
                  </span>
                )}
              </div>

              <div className="mt-3 overflow-x-auto rounded-md border border-white bg-white">
                <table className="app-table w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Prece</th>
                      <th className="px-3 py-2">Pārdots</th>
                      <th className="px-3 py-2 text-right tabular">Cena</th>
                      <th className="px-3 py-2 text-right">Darbība</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myShipments.map((p) => {
                      const days = daysSinceSold(p);
                      const overdue = days != null && days > SHIPMENT_OVERDUE_DAYS;
                      const price = p.soldPrice ?? p.finalPrice ?? p.referencePrice ?? 0;
                      return (
                        <tr key={p.id} className="border-t border-slate-100 align-top">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {p.images[0] ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={p.images[0]}
                                  alt=""
                                  loading="lazy"
                                  className="h-10 w-10 shrink-0 rounded object-cover ring-1 ring-slate-200"
                                />
                              ) : (
                                <div className="h-10 w-10 shrink-0 rounded bg-slate-100 ring-1 ring-slate-200" />
                              )}
                              <div className="min-w-0">
                                <Link
                                  href={`/products/${p.id}`}
                                  className="block truncate text-sm font-medium text-slate-900 hover:underline"
                                >
                                  {p.enrichedTitle || p.title}
                                </Link>
                                {p.brand && (
                                  <div className="truncate text-[11px] text-slate-500">
                                    {p.brand}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {p.soldAt?.toDate ? (
                              <>
                                <div className="text-slate-900">
                                  {p.soldAt.toDate().toLocaleDateString("lv-LV")}
                                </div>
                                {days != null && (
                                  <div
                                    className={
                                      overdue
                                        ? "font-semibold text-red-700"
                                        : "text-slate-500"
                                    }
                                  >
                                    {days === 0
                                      ? "Šodien"
                                      : `Pirms ${days} d.`}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right tabular text-xs">
                            {price.toFixed(2)} EUR
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => markShipped(p.id)}
                              disabled={shippingId === p.id}
                              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {shippingId === p.id ? "Sūta…" : "📦 Izsūtīts"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SimpleStat label="Pārdotas preces" value={stats.soldCount} tone="green" />
            <SimpleStat
              label="Pārdotas par (EUR)"
              value={Number(stats.soldSum.toFixed(2))}
              tone="green"
              isMoney
            />
            <SimpleStat
              label="Vēl nav pārdotas"
              value={stats.unsoldCount}
              tone="amber"
            />
            <SimpleStat
              label="Nepārdotas vērtība (EUR)"
              value={Number(stats.unsoldSum.toFixed(2))}
              tone="amber"
              isMoney
            />
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <div className="font-medium">Manas paletes ({myPalletIds.size})</div>
            <p className="mt-1 text-xs text-slate-500">
              Iekļauj paletes, ko esi paņēmis šķirot Šķirošanā, kā arī tās,
              kuras vadītājs piešķīris tev manifesta augšupielādes laikā.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function SimpleStat({
  label,
  value,
  tone,
  isMoney,
}: {
  label: string;
  value: number;
  tone?: "amber" | "green" | "red";
  isMoney?: boolean;
}) {
  const cls =
    tone === "amber"
      ? "border-amber-200 bg-amber-50"
      : tone === "green"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "red"
      ? "border-red-200 bg-red-50"
      : "border-slate-200 bg-white";
  return (
    <div className={`rounded-lg border p-4 ${cls}`}>
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular text-slate-900">
        {isMoney ? value.toFixed(2) : value}
      </div>
    </div>
  );
}
