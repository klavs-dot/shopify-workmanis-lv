"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { useAuth } from "@/lib/auth/AuthProvider";
import { listPallets } from "@/lib/firestore/pallets";
import { listProducts } from "@/lib/firestore/products";
import { listUsers } from "@/lib/firestore/users";
import { buildWorkerStats, type WorkerMonthStats } from "@/lib/warehouseStats";
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
    return <WarehouseDashboard uid={appUser.uid} displayName={appUser.displayName} />;
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
                    className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow"
                  >
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {s.displayName}
                    </div>
                    <div className="truncate text-[11px] text-slate-500">
                      {s.email}
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

function WarehouseDashboard({ uid, displayName }: { uid: string; displayName: string }) {
  const [dateFrom, setDateFrom] = useState<string>(startOfMonthISO());
  const [dateTo, setDateTo] = useState<string>(todayISO());
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

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
