"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { listProducts } from "@/lib/firestore/products";
import { ApprovalBadge, WarehouseBadge } from "@/components/StatusBadge";
import type { ApprovalStatus, Product, WarehouseStatus } from "@/lib/types";

export default function ProductsPage() {
  return (
    <RequireRole allow={["MASTER", "ADMIN", "WAREHOUSE", "VIEWER"]}>
      <AppShell>
        <ProductsList />
      </AppShell>
    </RequireRole>
  );
}

function ProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [approval, setApproval] = useState<ApprovalStatus | "">("");
  const [warehouse, setWarehouse] = useState<WarehouseStatus | "">("");

  useEffect(() => {
    (async () => {
      try {
        setProducts(await listProducts({ limitTo: 500 }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Neizdevās ielādēt");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter((p) => {
      if (approval && p.approvalStatus !== approval) return false;
      if (warehouse && p.warehouseStatus !== warehouse) return false;
      if (needle) {
        const hay = `${p.title} ${p.brand} ${p.asin} ${p.ean} ${p.productSku}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [products, q, approval, warehouse]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Produkti</h1>
        <p className="text-sm text-slate-500">
          Pēdējie 500 produkti. Plašāku skatu skat caur paleti.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3">
        <input
          type="search"
          placeholder="Meklē…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 min-w-[200px] rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <select
          value={approval}
          onChange={(e) => setApproval(e.target.value as ApprovalStatus | "")}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">Approval: visi</option>
          <option value="draft">Draft</option>
          <option value="waiting_approval">Waiting</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="bundle">Bundle</option>
          <option value="outlet">Outlet</option>
        </select>
        <select
          value={warehouse}
          onChange={(e) => setWarehouse(e.target.value as WarehouseStatus | "")}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">Warehouse: visi</option>
          <option value="not_checked">Nepārbaudīts</option>
          <option value="found">Atrasts</option>
          <option value="missing">Trūkst</option>
          <option value="ready">Ready</option>
        </select>
        <div className="ml-auto text-xs text-slate-500">{filtered.length}</div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Ielāde…</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Nav rezultātu.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="app-table w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Brand</th>
                <th className="px-3 py-2">ASIN</th>
                <th className="px-3 py-2 text-right tabular">Final</th>
                <th className="px-3 py-2">Warehouse</th>
                <th className="px-3 py-2">Approval</th>
                <th className="px-3 py-2 text-right">→</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="max-w-[320px] truncate px-3 py-2 text-slate-900">
                    {p.title}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">{p.brand}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-slate-500">
                    {p.asin}
                  </td>
                  <td className="px-3 py-2 text-right tabular text-xs">
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
      )}
    </div>
  );
}
