"use client";

import Link from "next/link";
import { Fragment, use, useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { getPallet, updatePallet } from "@/lib/firestore/pallets";
import { useAuth } from "@/lib/auth/AuthProvider";
import { logAudit } from "@/lib/firestore/audit";
import { hasPermission } from "@/lib/auth/roles";
import { listProducts } from "@/lib/firestore/products";
import {
  ApprovalBadge,
  PalletBadge,
  WarehouseBadge,
} from "@/components/StatusBadge";
import { LISTING_STATUS_LABEL } from "@/lib/types";
import { ProductActionsPanel } from "@/components/ProductActionsPanel";
import type {
  ApprovalStatus,
  ListingStatus,
  Pallet,
  Product,
  WarehouseStatus,
} from "@/lib/types";

const LISTING_TABS: { value: ListingStatus | "all"; label: string; tone: string }[] = [
  { value: "all", label: "Visi", tone: "bg-slate-900 text-white" },
  { value: "not_listed", label: "Nav veikalā", tone: "bg-slate-100 text-slate-800" },
  { value: "listing_approved", label: "Apstiprināts", tone: "bg-amber-100 text-amber-800" },
  { value: "listed_in_store", label: "Veikalā", tone: "bg-emerald-100 text-emerald-800" },
  { value: "sold", label: "Pārdotās", tone: "bg-blue-100 text-blue-800" },
  { value: "out_of_stock", label: "Nav noliktavā", tone: "bg-orange-100 text-orange-800" },
  { value: "disposed", label: "Utilizētās", tone: "bg-red-100 text-red-800" },
];

interface Filters {
  q: string;
  approval: ApprovalStatus | "";
  warehouse: WarehouseStatus | "";
  hasImage: "" | "yes" | "no";
  listing: ListingStatus | "all";
}

export default function SkirosanaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <RequireRole allow={["MASTER", "ADMIN", "WAREHOUSE", "VIEWER"]}>
      <AppShell>
        <Suspense fallback={<div className="text-sm text-slate-500">Ielāde…</div>}>
          <PalletDetail id={id} />
        </Suspense>
      </AppShell>
    </RequireRole>
  );
}

function PalletDetail({ id }: { id: string }) {
  const search = useSearchParams();
  const { appUser, firebaseUser } = useAuth();
  const initialListing = (search.get("listing") as ListingStatus | "all" | null) || "all";

  const [pallet, setPallet] = useState<Pallet | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [aiBatchBusy, setAiBatchBusy] = useState(false);
  const [aiBatchStatus, setAiBatchStatus] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    q: "",
    approval: "",
    warehouse: "",
    hasImage: "",
    listing: initialListing,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const refreshProducts = async () => {
    const fresh = await listProducts({ palletId: id });
    setProducts(fresh);
  };

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

  const canManage = hasPermission(appUser?.role, "managePallets");

  const runAiBatch = async (rerun: boolean) => {
    if (!pallet || !appUser) return;
    const unenrichedCount = products.filter(
      (p) =>
        p.listingStatus !== "disposed" &&
        (rerun || p.aiStatus === "not_started" || p.aiStatus === "failed")
    ).length;
    if (unenrichedCount === 0) {
      setAiBatchStatus("Nav produktu, ko bagātināt.");
      setTimeout(() => setAiBatchStatus(null), 4000);
      return;
    }
    const confirmMsg = rerun
      ? `Pārbagātināt VISUS ${products.length} produktus? (~30-60 sek katrs)`
      : `Bagātināt ${unenrichedCount} produktus? (~30-60 sek katrs, kopā ${Math.ceil(unenrichedCount * 0.75)} min)`;
    if (!window.confirm(confirmMsg)) return;

    setAiBatchBusy(true);
    setAiBatchStatus("Sūta uz Claude…");
    try {
      if (!firebaseUser) throw new Error("Trūkst tokena — pārstartē sesiju");
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/ai/enrich-pallet", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ palletId: pallet.id, rerun, limit: 200 }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        processed?: number;
        succeeded?: number;
        failed?: number;
      };
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setAiBatchStatus(
        `Pabeigts: ${data.succeeded} sekmīgi · ${data.failed} kļūdas`
      );
      await refreshProducts();
    } catch (err) {
      setAiBatchStatus(
        err instanceof Error ? `Kļūda: ${err.message}` : "Neparedzēta kļūda"
      );
    } finally {
      setAiBatchBusy(false);
      setTimeout(() => setAiBatchStatus(null), 10000);
    }
  };

  const syncFromJobalots = async () => {
    if (!pallet?.jobalotsUrl || !appUser) return;
    setSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch(
        `/api/jobalots/lookup?url=${encodeURIComponent(pallet.jobalotsUrl)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Lookup neizdevās");
      await updatePallet(pallet.id, {
        purchasePrice: data.latestBidPrice ?? pallet.purchasePrice,
        reservePrice: data.reservePrice ?? pallet.reservePrice,
        location: data.location ?? pallet.location,
        weightKg: data.weightKg ?? pallet.weightKg,
        palletCondition: data.condition ?? pallet.palletCondition,
        coverImage: data.coverImage ?? pallet.coverImage,
      });
      await logAudit({
        userId: appUser.uid,
        userEmail: appUser.email,
        action: "pallet_jobalots_synced",
        entityType: "pallet",
        entityId: pallet.id,
        after: data,
      });
      const fresh = await getPallet(pallet.id);
      setPallet(fresh);
      setSyncStatus("Sinhronizēts ✓");
    } catch (err) {
      setSyncStatus(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return products.filter((p) => {
      if (filters.listing !== "all" && p.listingStatus !== filters.listing) return false;
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

  // Tab counts per listingStatus
  const counts = useMemo(() => {
    const c: Record<ListingStatus | "all", number> = {
      all: products.length,
      not_listed: 0,
      listing_approved: 0,
      listed_in_store: 0,
      sold: 0,
      out_of_stock: 0,
      disposed: 0,
    };
    for (const p of products) c[p.listingStatus] += 1;
    return c;
  }, [products]);

  if (loading) return <div className="text-sm text-slate-500">Ielāde…</div>;
  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        {error}
      </div>
    );
  }
  if (!pallet) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Manifests nav atrasts.
      </div>
    );
  }

  // Sorting-claim guard. The pallet card on /skirosana already prevents
  // non-claimers from clicking through, but a direct URL hit should also
  // get blocked. MASTER bypasses the guard.
  const claimedByMe = !!appUser && pallet.sortingClaimedBy === appUser.uid;
  const isMaster = appUser?.role === "MASTER";
  const isClaimed = !!pallet.sortingClaimedBy;
  if (isClaimed && !claimedByMe && !isMaster) {
    return (
      <div className="space-y-3">
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm">
          <div className="font-semibold text-amber-900">
            🔒 Šo manifestu šķiro cits darbinieks
          </div>
          <div className="mt-1 text-amber-800">
            Atbildīgais:{" "}
            <strong>{pallet.sortingClaimedByName ?? pallet.sortingClaimedByEmail}</strong>
            {pallet.sortingClaimedAt?.toDate && (
              <>
                {" "}— paņemts{" "}
                {pallet.sortingClaimedAt
                  .toDate()
                  .toLocaleString("lv-LV", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
              </>
            )}
            .
          </div>
          <div className="mt-2 text-xs text-amber-800">
            Tu vari redzēt sarakstu ar produktiem, bet nedari nekādas izmaiņas.
            Ja domā, ka šis claim ir kļūda, runā ar MASTER lietotāju, lai to atlaiž.
          </div>
        </div>
        <Link
          href="/skirosana"
          className="inline-block text-xs text-slate-500 underline-offset-2 hover:underline"
        >
          ← Atpakaļ uz Šķirošanas sarakstu
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">{pallet.name}</h1>
            <PalletBadge status={pallet.status} />
          </div>
          <div className="text-xs text-slate-500">
            Manifest SKU <span className="font-mono text-slate-700">{pallet.manifestSku}</span>
            {pallet.source && ` · ${pallet.source}`} · {pallet.originalFileName}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Kopā produkti: {pallet.totalProducts} · Total RRP:{" "}
            <span className="tabular">{pallet.totalReferencePrice.toFixed(2)}</span>{" "}
            {pallet.currency}
            {pallet.purchasePrice != null && (
              <>
                {" · "}
                Iegādes summa:{" "}
                <span className="tabular">{pallet.purchasePrice.toFixed(2)}</span>{" "}
                {pallet.currency}
              </>
            )}
            {pallet.location && <> · {pallet.location}</>}
            {pallet.weightKg != null && <> · {pallet.weightKg} kg</>}
            {pallet.palletCondition && (
              <> · <span className="font-medium">{pallet.palletCondition}</span></>
            )}
            {pallet.jobalotsUrl && (
              <>
                {" · "}
                <a
                  href={pallet.jobalotsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-700 underline-offset-2 hover:underline"
                >
                  Jobalots ↗
                </a>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Link
            href="/manifesti"
            className="text-xs text-slate-500 underline-offset-2 hover:underline"
          >
            ← Visi manifesti
          </Link>
          {pallet.jobalotsUrl && canManage && (
            <button
              type="button"
              onClick={syncFromJobalots}
              disabled={syncing}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              {syncing ? "Sinhronizē…" : "↻ Sync no Jobalots"}
            </button>
          )}
          {canManage && (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => runAiBatch(false)}
                disabled={aiBatchBusy}
                className="rounded-md bg-violet-600 px-2 py-1 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {aiBatchBusy ? "AI strādā…" : "✨ Bagātināt nebagātinātos"}
              </button>
              <button
                type="button"
                onClick={() => runAiBatch(true)}
                disabled={aiBatchBusy}
                className="rounded-md border border-violet-300 px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50"
              >
                Pārbagātināt visus
              </button>
            </div>
          )}
          {(syncStatus || aiBatchStatus) && (
            <span className="text-[11px] text-slate-500">
              {syncStatus || aiBatchStatus}
            </span>
          )}
        </div>
      </div>

      {/* Listing-status tabs */}
      <div className="flex flex-wrap gap-1.5">
        {LISTING_TABS.map((t) => {
          const active = filters.listing === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, listing: t.value }))}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                active ? t.tone : "bg-white text-slate-700 border border-slate-200"
              }`}
            >
              {t.label}
              <span className="ml-1.5 opacity-70 tabular">{counts[t.value]}</span>
            </button>
          );
        })}
      </div>

      {/* Secondary filters */}
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
              <th className="w-8 px-2 py-2"></th>
              <th className="px-3 py-2"></th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Brand</th>
              <th className="px-3 py-2">ASIN</th>
              <th className="px-3 py-2 text-right tabular">Ref.</th>
              <th className="px-3 py-2 text-right tabular">Final</th>
              <th className="px-3 py-2">Listing</th>
              <th className="px-3 py-2">Warehouse</th>
              <th className="px-3 py-2 text-right">→</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const isOpen = expandedId === p.id;
              return (
                <Fragment key={p.id}>
                  <tr
                    onClick={() => setExpandedId(isOpen ? null : p.id)}
                    className={`cursor-pointer border-t border-slate-100 ${
                      isOpen ? "bg-slate-50" : ""
                    }`}
                  >
                    <td className="px-2 py-2 text-slate-400">{isOpen ? "▼" : "▶"}</td>
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
                      {p.customerNote && (
                        <span
                          title={p.customerNote}
                          className="ml-1 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0 text-[9px] font-semibold uppercase text-red-800"
                        >
                          Piezīme
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">{p.brand}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-500">
                      {p.asin}
                    </td>
                    <td className="px-3 py-2 text-right tabular text-xs">
                      {p.referencePrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right tabular text-xs font-medium">
                      {p.finalPrice?.toFixed(2) ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">
                      {LISTING_STATUS_LABEL[p.listingStatus]}
                      {p.listingDiscountPercent > 0 && p.listingStatus !== "disposed" && (
                        <span className="ml-1 text-[10px] text-slate-500">
                          (−{p.listingDiscountPercent}%)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <WarehouseBadge status={p.warehouseStatus} />
                    </td>
                    <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/products/${p.id}`}
                        className="text-xs text-slate-900 underline-offset-2 hover:underline"
                      >
                        Atvērt
                      </Link>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-t border-slate-100 bg-slate-50">
                      <td colSpan={10} className="px-3 py-3">
                        <ProductActionsPanel
                          product={p}
                          onChanged={() => {
                            void refreshProducts();
                          }}
                          onCancel={() => setExpandedId(null)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
