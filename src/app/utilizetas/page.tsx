"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { listProducts } from "@/lib/firestore/products";
import { listPallets } from "@/lib/firestore/pallets";
import type { Pallet, Product } from "@/lib/types";

export default function UtilizetasPage() {
  return (
    <RequireRole allow={["MASTER", "ADMIN", "WAREHOUSE", "VIEWER"]}>
      <AppShell>
        <UtilizetasList />
      </AppShell>
    </RequireRole>
  );
}

function UtilizetasList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pallets, setPallets] = useState<Record<string, Pallet>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, allPallets] = await Promise.all([
          listProducts({ listingStatus: "disposed", limitTo: 500 }),
          listPallets(),
        ]);
        setProducts(p);
        setPallets(Object.fromEntries(allPallets.map((x) => [x.id, x])));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Neizdevās ielādēt");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Total written-off value = sum of finalPrice for disposed products
  const totalWrittenOff = products.reduce((s, p) => s + (p.finalPrice ?? 0), 0);
  const totalRefValue = products.reduce((s, p) => s + (p.referencePrice ?? 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Utilizētās preces</h1>
        <p className="text-sm text-slate-500">
          Bojātas vai neizmantojamas preces. Atzīmētas Šķirošanā ar pogu Bojāts/Utilizējams.
        </p>
      </div>

      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Stat label="Utilizēto skaits" value={String(products.length)} />
          <Stat label="Reference summa" value={totalRefValue.toFixed(2) + " EUR"} />
          <Stat
            label="Plānotā cenu summa"
            value={totalWrittenOff.toFixed(2) + " EUR"}
            tone="red"
          />
          <Stat
            label="Vidēja Final cena"
            value={
              products.length
                ? (totalWrittenOff / products.length).toFixed(2) + " EUR"
                : "—"
            }
          />
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500">Ielāde…</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Vēl nav neviena utilizēta produkta. 🎉
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="app-table w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2"></th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Brand</th>
                <th className="px-3 py-2">Manifests</th>
                <th className="px-3 py-2 text-right tabular">Ref.</th>
                <th className="px-3 py-2 text-right tabular">Final</th>
                <th className="px-3 py-2">Iemesls</th>
                <th className="px-3 py-2 text-right">→</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const pal = pallets[p.palletId];
                return (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      {p.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.images[0]}
                          alt=""
                          loading="lazy"
                          className="h-10 w-10 rounded object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-slate-100 ring-1 ring-slate-200" />
                      )}
                    </td>
                    <td className="max-w-[260px] truncate px-3 py-2 text-slate-900">
                      {p.title}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">{p.brand}</td>
                    <td className="px-3 py-2 text-xs">
                      {pal ? (
                        <Link
                          href={`/skirosana/${pal.id}?listing=disposed`}
                          className="font-mono text-[11px] text-slate-700 underline-offset-2 hover:underline"
                        >
                          {pal.manifestSku}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular text-xs">
                      {p.referencePrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right tabular text-xs">
                      {p.finalPrice?.toFixed(2) ?? "—"}
                    </td>
                    <td className="max-w-[240px] truncate px-3 py-2 text-xs text-slate-600">
                      {p.disposalReason || "—"}
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
                );
              })}
            </tbody>
          </table>
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
  tone?: "red";
}) {
  const cls =
    tone === "red"
      ? "bg-red-50 text-red-900 border-red-200"
      : "bg-white text-slate-900 border-slate-200";
  return (
    <div className={`rounded-md border px-3 py-2 ${cls}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="tabular text-sm font-semibold">{value}</div>
    </div>
  );
}
