"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { listUsers } from "@/lib/firestore/users";
import { listPallets } from "@/lib/firestore/pallets";
import { listProducts } from "@/lib/firestore/products";
import { buildWorkerStats, type WorkerMonthStats } from "@/lib/warehouseStats";
import type { AppUser, Pallet, Product } from "@/lib/types";

export default function NoliktavasDarbiniekiPage() {
  return (
    <RequireRole allow={["MASTER", "ADMIN"]}>
      <AppShell>
        <Content />
      </AppShell>
    </RequireRole>
  );
}

function Content() {
  const [workers, setWorkers] = useState<AppUser[]>([]);
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [allUsers, allPallets, allProducts] = await Promise.all([
          listUsers(),
          listPallets(),
          listProducts({ limitTo: 2000 }),
        ]);
        setWorkers(allUsers.filter((u) => u.role === "WAREHOUSE"));
        setPallets(allPallets);
        setProducts(allProducts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Neizdevās ielādēt");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Current month stats — same shape used by the dashboard. Date filtering
  // for bonus calculation is done per-worker on the detail page.
  const stats = useMemo(
    () => buildWorkerStats(workers, pallets, products),
    [workers, pallets, products]
  );
  const statsByUid = useMemo(() => {
    const m = new Map<string, WorkerMonthStats>();
    stats.forEach((s) => m.set(s.uid, s));
    return m;
  }, [stats]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Noliktavas darbinieki</h1>
          <p className="text-sm text-slate-500">
            Warehouse darbinieki ar šī mēneša statistiku. Atver kartīti, lai
            redzētu detalizētu pārskatu ar datuma filtru (bonusu aprēķinam).
          </p>
        </div>
        <Link
          href="/noliktavas-darbinieki/jauns"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Pievienot darbinieku
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Ielāde…</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : workers.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Vēl nav neviena noliktavas darbinieka.{" "}
          <Link
            href="/noliktavas-darbinieki/jauns"
            className="font-semibold text-slate-900 underline-offset-2 hover:underline"
          >
            Pievienot pirmo →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workers.map((w) => (
            <WorkerCard
              key={w.uid}
              worker={w}
              stats={statsByUid.get(w.uid) ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WorkerCard({
  worker,
  stats,
}: {
  worker: AppUser;
  stats: WorkerMonthStats | null;
}) {
  const disabled = worker.status === "disabled";
  return (
    <Link
      href={`/noliktavas-darbinieki/${worker.uid}`}
      className={`block rounded-lg border bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">
            {worker.displayName || worker.email}
          </div>
          <div className="truncate text-[11px] text-slate-500">{worker.email}</div>
        </div>
        {disabled && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-800">
            Deaktivizēts
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5 text-[11px]">
        <Mini
          label="Veikalā"
          value={`${stats?.inStoreValue.toFixed(0) ?? "0"} €`}
          tone="emerald"
        />
        <Mini
          label="Pārdotās"
          value={`${stats?.soldValue.toFixed(0) ?? "0"} €`}
          tone="blue"
        />
        <Mini
          label="Utilizētās"
          value={`${stats?.disposedValue.toFixed(0) ?? "0"} €`}
          tone="red"
        />
      </div>

      <div className="mt-2 text-[11px] text-slate-500">
        Šī mēneša potenc. peļņa:{" "}
        <span className="font-medium tabular text-slate-900">
          {stats?.potentialProfitEur.toFixed(0) ?? "0"} €
        </span>
        {" · "}
        <span className="font-medium tabular">{stats?.palletCount ?? 0}</span> paletes
      </div>
    </Link>
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
