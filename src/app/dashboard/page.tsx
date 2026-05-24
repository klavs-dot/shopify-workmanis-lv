"use client";

import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { useAuth } from "@/lib/auth/AuthProvider";
import { listPallets } from "@/lib/firestore/pallets";
import { listProducts } from "@/lib/firestore/products";
import type { Pallet, Product } from "@/lib/types";

interface AdminMetrics {
  totalPallets: number;
  totalProducts: number;
  waitingApproval: number;
  ready: number;
  problems: number;
  bundle: number;
  outlet: number;
}

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
// Admin / Master / Viewer dashboard
// ---------------------------------------------------------------------------

function AdminDashboard() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentPallets, setRecentPallets] = useState<Pallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [pallets, products] = await Promise.all([listPallets(), listProducts()]);
        setMetrics(aggregateAdmin(pallets, products));
        setRecentPallets(pallets.slice(0, 5));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Neizdevās ielādēt datus");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          shopify.workmanis.lv — palešu noliktavas operāciju pārskats.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Ielāde…</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard label="Paletes" value={metrics.totalPallets} />
          <MetricCard label="Produkti" value={metrics.totalProducts} />
          <MetricCard label="Gaida apstiprinājumu" value={metrics.waitingApproval} highlight="amber" />
          <MetricCard label="Ready" value={metrics.ready} highlight="green" />
          <MetricCard label="Problēmas" value={metrics.problems} highlight="red" />
          <MetricCard label="Bundle" value={metrics.bundle} />
          <MetricCard label="Outlet" value={metrics.outlet} />
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
          Pēdējās paletes
        </div>
        {recentPallets.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-500">
            Vēl nav nevienas paletes. Sāc ar manifesta importu sadaļā <strong>/manifesti</strong>.
          </div>
        ) : (
          <table className="app-table w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2">Manifest SKU</th>
                <th className="px-4 py-2">Nosaukums</th>
                <th className="px-4 py-2 text-right tabular">Produkti</th>
                <th className="px-4 py-2 text-right tabular">Ref. cena</th>
              </tr>
            </thead>
            <tbody>
              {recentPallets.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-mono text-xs text-slate-700">{p.manifestSku}</td>
                  <td className="px-4 py-2 text-slate-900">{p.name}</td>
                  <td className="px-4 py-2 text-right tabular">{p.totalProducts}</td>
                  <td className="px-4 py-2 text-right tabular">
                    {p.totalReferencePrice.toFixed(2)} {p.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function aggregateAdmin(pallets: Pallet[], products: Product[]): AdminMetrics {
  let waitingApproval = 0;
  let ready = 0;
  let problems = 0;
  let bundle = 0;
  let outlet = 0;
  for (const p of products) {
    if (p.approvalStatus === "waiting_approval") waitingApproval++;
    if (p.warehouseStatus === "ready") ready++;
    if (
      p.warehouseStatus === "missing" ||
      p.warehouseStatus === "damaged_product" ||
      p.warehouseStatus === "tested_failed"
    )
      problems++;
    if (p.approvalStatus === "bundle") bundle++;
    if (p.approvalStatus === "outlet") outlet++;
  }
  return {
    totalPallets: pallets.length,
    totalProducts: products.length,
    waitingApproval,
    ready,
    problems,
    bundle,
    outlet,
  };
}

// ---------------------------------------------------------------------------
// Warehouse worker dashboard — personal sales metrics
// ---------------------------------------------------------------------------

function startOfMonthISO(): string {
  const d = new Date();
  d.setDate(1);
  return toDateInputValue(d);
}

function todayISO(): string {
  return toDateInputValue(new Date());
}

function toDateInputValue(d: Date): string {
  // YYYY-MM-DD in local time (matches <input type="date"> expectations).
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseLocalDate(iso: string, endOfDay = false): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
}

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
        // The "mine" set is small (a worker's own claimed pallets). Pulling
        // everything client-side keeps the query simple — once we outgrow this,
        // add a Firestore composite index on sortingClaimedBy + createdAt.
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
    () => new Set(pallets.filter((p) => p.sortingClaimedBy === uid).map((p) => p.id)),
    [pallets, uid]
  );

  const myProducts = useMemo(
    () => products.filter((p) => myPalletIds.has(p.palletId)),
    [products, myPalletIds]
  );

  const stats = useMemo(() => {
    const from = parseLocalDate(dateFrom, false);
    const to = parseLocalDate(dateTo, true);

    let soldCount = 0;
    let soldSum = 0;
    let unsoldCount = 0;
    let unsoldSum = 0;

    for (const p of myProducts) {
      const status = p.listingStatus;

      // Sold within range — soldAt is the source of truth.
      if (status === "sold") {
        const soldAt = p.soldAt?.toDate?.() ?? null;
        if (soldAt && from && soldAt < from) continue;
        if (soldAt && to && soldAt > to) continue;
        soldCount += 1;
        soldSum += p.soldPrice ?? p.finalPrice ?? p.referencePrice ?? 0;
        continue;
      }

      // Unsold = currently sitting in the store.
      // We bucket by when it was listed (or fallback to createdAt) so the
      // worker can see "what I put up in this range that hasn't sold yet".
      if (status === "listed_in_store" || status === "listing_approved") {
        const listedAt = p.listedAt?.toDate?.() ?? p.createdAt?.toDate?.() ?? null;
        if (listedAt && from && listedAt < from) continue;
        if (listedAt && to && listedAt > to) continue;
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Pārdotas preces"
              value={stats.soldCount}
              highlight="green"
            />
            <MetricCard
              label="Pārdotas par (EUR)"
              value={Number(stats.soldSum.toFixed(2))}
              highlight="green"
              isMoney
            />
            <MetricCard
              label="Vēl nav pārdotas"
              value={stats.unsoldCount}
              highlight="amber"
            />
            <MetricCard
              label="Nepārdotas vērtība (EUR)"
              value={Number(stats.unsoldSum.toFixed(2))}
              highlight="amber"
              isMoney
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <div className="font-medium">
              Manas paletes ({myPalletIds.size})
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Statistika balstās uz paletēm, kuras esi paņēmis šķirot Šķirošanā.
              Preces tiek skaitītas, ja to pārdošanas vai veikalā ievietošanas
              datums iekrīt izvēlētajā diapazonā.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  highlight,
  isMoney,
}: {
  label: string;
  value: number;
  highlight?: "amber" | "green" | "red";
  isMoney?: boolean;
}) {
  const tone =
    highlight === "amber"
      ? "border-amber-200 bg-amber-50"
      : highlight === "green"
      ? "border-emerald-200 bg-emerald-50"
      : highlight === "red"
      ? "border-red-200 bg-red-50"
      : "border-slate-200 bg-white";
  return (
    <div className={`rounded-lg border p-4 ${tone}`}>
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular text-slate-900">
        {isMoney ? value.toFixed(2) : value}
      </div>
    </div>
  );
}
