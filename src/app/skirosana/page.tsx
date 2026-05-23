"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { listPallets } from "@/lib/firestore/pallets";
import { listProducts } from "@/lib/firestore/products";
import { PalletBadge } from "@/components/StatusBadge";
import type { Pallet, Product } from "@/lib/types";

interface Row {
  pallet: Pallet;
  total: number;
  unsorted: number; // not_listed + listing_approved
}

export default function SkirosanaPage() {
  return (
    <RequireRole allow={["MASTER", "ADMIN", "WAREHOUSE", "VIEWER"]}>
      <AppShell>
        <SkirosanaList />
      </AppShell>
    </RequireRole>
  );
}

function SkirosanaList() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const pallets = await listPallets();
        const all = await Promise.all(pallets.map((p) => listProducts({ palletId: p.id })));
        setRows(pallets.map((p, i) => buildRow(p, all[i] || [])));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Neizdevās ielādēt");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visible = useMemo(() => {
    if (!rows) return [];
    if (showAll) return rows;
    return rows.filter((r) => r.unsorted > 0);
  }, [rows, showAll]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Šķirošana</h1>
          <p className="text-sm text-slate-500">
            {showAll
              ? "Visi importētie manifesti."
              : "Manifesti, kuriem vēl ir nesašķiroti produkti."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs"
          >
            {showAll ? "Tikai nesašķirotos" : "Rādīt visus"}
          </button>
          <Link
            href="/manifesti"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
          >
            + Importēt manifestu
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Ielāde…</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
          {showAll
            ? "Vēl nav nevienas paletes."
            : "Visi importētie manifesti jau ir sašķiroti. 🎉"}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => (
            <Link
              key={r.pallet.id}
              href={`/skirosana/${r.pallet.id}`}
              className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 hover:shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {r.pallet.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="font-mono">{r.pallet.manifestSku}</span>
                    {r.pallet.source && ` · ${r.pallet.source}`}
                  </div>
                </div>
                <PalletBadge status={r.pallet.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Stat label="Produkti" value={r.total.toString()} />
                <Stat
                  label="Nesašķirotie"
                  value={r.unsorted.toString()}
                  tone={r.unsorted > 0 ? "amber" : "slate"}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "amber" | "slate";
}) {
  const cls =
    tone === "amber"
      ? "bg-amber-50 text-amber-900 border-amber-200"
      : "bg-slate-50 text-slate-700 border-slate-200";
  return (
    <div className={`rounded-md border px-2 py-1.5 ${cls}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="tabular text-sm font-semibold">{value}</div>
    </div>
  );
}

function buildRow(pallet: Pallet, products: Product[]): Row {
  let unsorted = 0;
  for (const p of products) {
    if (p.listingStatus === "not_listed" || p.listingStatus === "listing_approved") {
      unsorted++;
    }
  }
  return { pallet, total: products.length, unsorted };
}
