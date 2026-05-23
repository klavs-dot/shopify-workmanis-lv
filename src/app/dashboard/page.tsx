"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { listPallets } from "@/lib/firestore/pallets";
import { listProducts } from "@/lib/firestore/products";
import type { Pallet, Product } from "@/lib/types";

interface Metrics {
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
        <DashboardContent />
      </AppShell>
    </RequireRole>
  );
}

function DashboardContent() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentPallets, setRecentPallets] = useState<Pallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [pallets, products] = await Promise.all([listPallets(), listProducts()]);
        const m = aggregate(pallets, products);
        setMetrics(m);
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
            Vēl nav nevienas paletes. Sāc ar manifesta importu sadaļā <strong>/import</strong>.
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

function aggregate(pallets: Pallet[], products: Product[]): Metrics {
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

function MetricCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: "amber" | "green" | "red";
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
      <div className="mt-1 text-2xl font-semibold tabular text-slate-900">{value}</div>
    </div>
  );
}
