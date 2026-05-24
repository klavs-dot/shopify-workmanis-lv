"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { getUser } from "@/lib/firestore/users";
import { listPallets } from "@/lib/firestore/pallets";
import { listProducts } from "@/lib/firestore/products";
import { buildWorkerStats } from "@/lib/warehouseStats";
import type { AppUser, Pallet, Product } from "@/lib/types";

export default function WorkerDetailPage() {
  return (
    <RequireRole allow={["MASTER", "ADMIN"]}>
      <AppShell>
        <Content />
      </AppShell>
    </RequireRole>
  );
}

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

function Content() {
  const params = useParams<{ uid: string }>();
  const uid = params?.uid ?? "";

  const [worker, setWorker] = useState<AppUser | null>(null);
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState<string>(startOfMonthISO());
  const [dateTo, setDateTo] = useState<string>(todayISO());

  useEffect(() => {
    (async () => {
      try {
        const [w, allPallets, allProducts] = await Promise.all([
          getUser(uid),
          listPallets(),
          listProducts({ limitTo: 2000 }),
        ]);
        setWorker(w);
        setPallets(allPallets);
        setProducts(allProducts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Neizdevās ielādēt");
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  const stats = useMemo(() => {
    if (!worker) return null;
    const from = parseLocal(dateFrom, false) ?? undefined;
    const to = parseLocal(dateTo, true) ?? undefined;
    return buildWorkerStats([worker], pallets, products, { from, to })[0];
  }, [worker, pallets, products, dateFrom, dateTo]);

  // Suggested bonus = 10% of sold revenue. Placeholder — the actual rate
  // belongs in Iestatījumi later, but this gives the admin a starting figure.
  const bonusEur = stats ? stats.soldValue * 0.1 : 0;

  // My-pallet list inside the date range — useful for sanity-checking the math.
  const myPallets = useMemo(() => {
    if (!worker) return [];
    return pallets.filter(
      (p) =>
        p.assignedWarehouseUid === worker.uid ||
        p.sortingClaimedBy === worker.uid
    );
  }, [pallets, worker]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/noliktavas-darbinieki"
          className="text-xs text-slate-500 underline-offset-2 hover:underline"
        >
          ← Atpakaļ uz darbinieku sarakstu
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">
          {worker?.displayName || worker?.email || "Darbinieks"}
        </h1>
        <p className="text-sm text-slate-500">
          {worker?.email}
          {worker?.status === "disabled" && (
            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-800">
              Deaktivizēts
            </span>
          )}
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
      ) : !worker ? (
        <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
          Darbinieks nav atrasts.
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Pārdotas preces" value={`${stats.soldCount}`} tone="emerald" />
            <Stat
              label="Pārdotas par"
              value={`${stats.soldValue.toFixed(2)} €`}
              tone="emerald"
            />
            <Stat
              label="Vēl nav pārdotas"
              value={`${stats.inStoreCount + stats.sortingCount}`}
              tone="amber"
            />
            <Stat
              label="Nepārdotās vērtība"
              value={`${(stats.inStoreValue + stats.sortingValue).toFixed(2)} €`}
              tone="amber"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat
              label="Veikalā (EUR)"
              value={`${stats.inStoreValue.toFixed(2)} €`}
              tone="emerald"
            />
            <Stat
              label="Šķirotavā (EUR)"
              value={`${stats.sortingValue.toFixed(2)} €`}
              tone="slate"
            />
            <Stat
              label="Utilizētās (EUR)"
              value={`${stats.disposedValue.toFixed(2)} €`}
              tone="red"
            />
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="text-xs uppercase tracking-wider text-amber-800">
              Bonusa aprēķins (sākotnējais)
            </div>
            <div className="mt-1 text-2xl font-semibold tabular text-amber-900">
              {bonusEur.toFixed(2)} €
            </div>
            <p className="mt-1 text-[11px] text-amber-800">
              10% no pārdotā ({stats.soldValue.toFixed(2)} €) izvēlētajā datumu
              diapazonā. Faktiskā likme tiks konfigurēta Iestatījumos vēlāk.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
              Šī darbinieka paletes ({myPallets.length})
            </div>
            {myPallets.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">
                Pagaidām nav piešķirtu paletes.
              </div>
            ) : (
              <table className="app-table w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Manifest SKU</th>
                    <th className="px-4 py-2">Nosaukums</th>
                    <th className="px-4 py-2">Statuss</th>
                    <th className="px-4 py-2 text-right tabular">RRP</th>
                  </tr>
                </thead>
                <tbody>
                  {myPallets.map((p) => (
                    <tr key={p.id} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-mono text-xs text-slate-700">
                        {p.manifestSku}
                      </td>
                      <td className="px-4 py-2 text-slate-900">
                        <Link
                          href={`/skirosana/${p.id}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-700">{p.status}</td>
                      <td className="px-4 py-2 text-right tabular text-xs">
                        {p.totalReferencePrice.toFixed(2)} {p.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : null}
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
  tone: "amber" | "emerald" | "red" | "slate";
}) {
  const cls =
    tone === "amber"
      ? "border-amber-200 bg-amber-50"
      : tone === "emerald"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "red"
      ? "border-red-200 bg-red-50"
      : "border-slate-200 bg-white";
  return (
    <div className={`rounded-lg border p-4 ${cls}`}>
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular text-slate-900">{value}</div>
    </div>
  );
}
