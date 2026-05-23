"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { listPallets } from "@/lib/firestore/pallets";
import { PalletBadge } from "@/components/StatusBadge";
import type { Pallet } from "@/lib/types";

export default function PalletsPage() {
  return (
    <RequireRole allow={["MASTER", "ADMIN", "WAREHOUSE", "VIEWER"]}>
      <AppShell>
        <PalletsList />
      </AppShell>
    </RequireRole>
  );
}

function PalletsList() {
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setPallets(await listPallets());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Neizdevās ielādēt");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Paletes</h1>
          <p className="text-sm text-slate-500">Visi importētie palešu manifesti.</p>
        </div>
        <Link
          href="/import"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + Importēt manifestu
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Ielāde…</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : pallets.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Vēl nav nevienas paletes. Sāc ar manifesta importu.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="app-table w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">Manifest SKU</th>
                <th className="px-3 py-2">Nosaukums</th>
                <th className="px-3 py-2">Avots</th>
                <th className="px-3 py-2 text-right tabular">Produkti</th>
                <th className="px-3 py-2 text-right tabular">Ref. cena</th>
                <th className="px-3 py-2">Importēta</th>
                <th className="px-3 py-2">Statuss</th>
                <th className="px-3 py-2 text-right">Darbības</th>
              </tr>
            </thead>
            <tbody>
              {pallets.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs text-slate-700">
                    {p.manifestSku}
                  </td>
                  <td className="px-3 py-2 text-slate-900">{p.name}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{p.source}</td>
                  <td className="px-3 py-2 text-right tabular">{p.totalProducts}</td>
                  <td className="px-3 py-2 text-right tabular">
                    {p.totalReferencePrice.toFixed(2)} {p.currency}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {p.createdAt?.toDate
                      ? p.createdAt.toDate().toLocaleDateString("lv-LV")
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <PalletBadge status={p.status} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/pallets/${p.id}`}
                      className="text-xs font-medium text-slate-900 underline-offset-2 hover:underline"
                    >
                      Atvērt →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
