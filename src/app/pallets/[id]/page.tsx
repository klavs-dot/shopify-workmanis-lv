"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { getPallet } from "@/lib/firestore/pallets";
import { listProducts } from "@/lib/firestore/products";
import {
  ApprovalBadge,
  PalletBadge,
  WarehouseBadge,
} from "@/components/StatusBadge";
import type {
  ApprovalStatus,
  Pallet,
  Product,
  WarehouseStatus,
} from "@/lib/types";

type Filters = {
  q: string;
  approval: ApprovalStatus | "";
  warehouse: WarehouseStatus | "";
  hasImage: "" | "yes" | "no";
};

export default function PalletDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <RequireRole allow={["MASTER", "ADMIN", "WAREHOUSE", "VIEWER"]}>
      <AppShell>
        <PalletDetail id={id} />
      </AppShell>
    </RequireRole>
  );
}

function PalletDetail({ id }: { id: string }) {
  const [pallet, setPallet] = useState<Pallet | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    q: "",
    approval: "",
    warehouse: "",
    hasImage: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const [p, prods] = await Promise.all([
          getPallet(id),
          listProducts({ palletId: id }),
        ]);
        setPallet(p);
        setProducts(prods);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Neizdevās ielādēt");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return products.filter((p) => {
      if (filters.approval && p.approvalStatus !== filters.approval) return false;
      if (filters.warehouse && p.warehouseStatus !== filters.warehouse) return false;
      if (filters.hasImage === "yes" && p.images.length === 0) return false;
      if (filters.hasImage === "no" && p.images.length > 0) return false;
      if (q) {
        const hay = `${p.title} ${p.brand} ${p.asin} ${p.ean} ${p.productSku}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, filters]);

  if (loading) return <div className="text-sm text-slate-500">Ielāde…</div>;
  if (error)
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        {error}
      </div>
    );
  if (!pallet)
    return (
      <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Palete nav atrasta.
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">{pallet.name}</h1>
            <PalletBadge status={pallet.status} />
          </div>
          <div className="text-xs text-slate-500">
            Manifest SKU{" "}
            <span className="font-mono text-slate-700">{pallet.manifestSku}</span>{" "}
            · {pallet.source} · {pallet.originalFileName}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Kopā produkti: {pallet.totalProducts} · Reference cena:{" "}
            {pallet.totalReferencePrice.toFixed(2)} {pallet.currency}
          </div>
        </div>
        <Link
          href="/pallets"
          className="text-xs text-slate-500 underline-offset-2 hover:underline"
        >
          ← Visas paletes
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3">
        <input
          type="search"
          placeholder="Meklē pēc title / brand / ASIN / EAN / SKU"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          className="flex-1 min-w-[200px] rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <select
          value={filters.approval}
          onChange={(e) =>
            setFilters((f) => ({ ...f, approval: e.target.value as ApprovalStatus | "" }))
          }
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">Approval: visi</option>
          <option value="draft">Draft</option>
          <option value="waiting_approval">Waiting</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="bundle">Bundle</option>
          <option value="outlet">Outlet</option>
          <option value="do_not_publish">Do not publish</option>
        </select>
        <select
          value={filters.warehouse}
          onChange={(e) =>
            setFilters((f) => ({ ...f, warehouse: e.target.value as WarehouseStatus | "" }))
          }
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">Warehouse: visi</option>
          <option value="not_checked">Nepārbaudīts</option>
          <option value="found">Atrasts</option>
          <option value="missing">Trūkst</option>
          <option value="damaged_package">Bojāts iep.</option>
          <option value="damaged_product">Bojāts prod.</option>
          <option value="tested_ok">Tested OK</option>
          <option value="tested_failed">Tests fail</option>
          <option value="needs_photo">Vajag bildi</option>
          <option value="ready">Ready</option>
        </select>
        <select
          value={filters.hasImage}
          onChange={(e) =>
            setFilters((f) => ({ ...f, hasImage: e.target.value as Filters["hasImage"] }))
          }
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">Bildes: visas</option>
          <option value="yes">Ar bildi</option>
          <option value="no">Bez bildes</option>
        </select>
        <div className="ml-auto text-xs text-slate-500">
          Rāda <strong>{filtered.length}</strong> no {products.length}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="app-table w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Brand</th>
              <th className="px-3 py-2">ASIN</th>
              <th className="px-3 py-2 text-right tabular">Ref.</th>
              <th className="px-3 py-2 text-right tabular">Suggested</th>
              <th className="px-3 py-2 text-right tabular">Final</th>
              <th className="px-3 py-2">Warehouse</th>
              <th className="px-3 py-2">Approval</th>
              <th className="px-3 py-2 text-right">→</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="max-w-[300px] truncate px-3 py-2 text-slate-900">{p.title}</td>
                <td className="px-3 py-2 text-xs text-slate-600">{p.brand}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-slate-500">{p.asin}</td>
                <td className="px-3 py-2 text-right tabular text-xs">
                  {p.referencePrice.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right tabular text-xs">
                  {p.suggestedPrice?.toFixed(2) ?? "—"}
                </td>
                <td className="px-3 py-2 text-right tabular text-xs font-medium">
                  {p.finalPrice?.toFixed(2) ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <WarehouseBadge status={p.warehouseStatus} />
                </td>
                <td className="px-3 py-2">
                  <ApprovalBadge status={p.approvalStatus} />
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/products/${p.id}`}
                    className="text-xs text-slate-900 underline-offset-2 hover:underline"
                  >
                    Atvērt
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
