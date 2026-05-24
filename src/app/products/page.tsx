"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { serverTimestamp } from "firebase/firestore";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { useAuth } from "@/lib/auth/AuthProvider";
import { listPallets } from "@/lib/firestore/pallets";
import { listProducts, updateProduct } from "@/lib/firestore/products";
import { logAudit } from "@/lib/firestore/audit";
import { hasPermission } from "@/lib/auth/roles";
import { roundToDot99 } from "@/lib/pricing";
import {
  SellingRobot,
  StaleWeekRobot,
  StaleTwoWeeksRobot,
} from "@/components/RobotMascots";
import type { Product } from "@/lib/types";

type Bucket = "selling" | "stale_week" | "stale_two_weeks";

const DAY_MS = 24 * 60 * 60 * 1000;

export default function ProductsPage() {
  return (
    <RequireRole allow={["MASTER", "ADMIN", "WAREHOUSE", "VIEWER"]}>
      <AppShell>
        <Suspense fallback={<div className="text-sm text-slate-500">Ielāde…</div>}>
          <ProductsHub />
        </Suspense>
      </AppShell>
    </RequireRole>
  );
}

function ProductsHub() {
  const search = useSearchParams();
  const bucket = (search.get("bucket") as Bucket | null) ?? null;
  const { appUser } = useAuth();
  const isWarehouse = appUser?.role === "WAREHOUSE";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      // Pull "listed_in_store" products with a generous cap. Bucket math
      // happens client-side so a single fetch covers all three views and
      // we don't need composite Firestore indexes on listedAt.
      const data = await listProducts({
        listingStatus: "listed_in_store",
        limitTo: 1000,
      });
      if (isWarehouse && appUser) {
        // Worker sees only products from pallets they claimed for sorting.
        const myPallets = await listPallets();
        const mine = new Set(
          myPallets
            .filter((p) => p.sortingClaimedBy === appUser.uid)
            .map((p) => p.id)
        );
        setProducts(data.filter((p) => mine.has(p.palletId)));
      } else {
        setProducts(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neizdevās ielādēt");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser?.uid, isWarehouse]);

  const counts = useMemo(() => {
    const now = Date.now();
    let selling = 0;
    let staleWeek = 0;
    let staleTwoWeeks = 0;
    for (const p of products) {
      const ts =
        p.listedAt?.toMillis?.() ?? p.createdAt?.toMillis?.() ?? null;
      if (ts == null) {
        selling++;
        continue;
      }
      const ageDays = (now - ts) / DAY_MS;
      if (ageDays < 7) selling++;
      else if (ageDays < 14) staleWeek++;
      else staleTwoWeeks++;
    }
    return { selling, staleWeek, staleTwoWeeks };
  }, [products]);

  if (loading) return <div className="text-sm text-slate-500">Ielāde…</div>;
  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        {error}
      </div>
    );
  }

  if (bucket) {
    return (
      <BucketDetailView
        bucket={bucket}
        products={products}
        onChanged={refresh}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Produkti veikalā</h1>
        <p className="text-sm text-slate-500">
          Pārskats par produktiem, kas ir veikalā. Spied karti, lai apskatītu detalizēti un pielietotu bulk darbības.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CategoryCard
          href="/products?bucket=selling"
          tone="emerald"
          title="Preces pārdošanā"
          subtitle="Aktuālas (mazāk par 7 dienām)"
          count={counts.selling}
          robot={<SellingRobot className="h-full w-full" />}
        />
        <CategoryCard
          href="/products?bucket=stale_week"
          tone="amber"
          title="Neviens nepērk nedēļu"
          subtitle="No 8 līdz 14 dienai"
          count={counts.staleWeek}
          robot={<StaleWeekRobot className="h-full w-full" />}
        />
        <CategoryCard
          href="/products?bucket=stale_two_weeks"
          tone="red"
          title="Neviens nepērk 2 nedēļas"
          subtitle="15+ dienas — steidzami!"
          count={counts.staleTwoWeeks}
          robot={<StaleTwoWeeksRobot className="h-full w-full" />}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category card (square)
// ---------------------------------------------------------------------------

function CategoryCard({
  href,
  tone,
  title,
  subtitle,
  count,
  robot,
}: {
  href: string;
  tone: "emerald" | "amber" | "red";
  title: string;
  subtitle: string;
  count: number;
  robot: React.ReactNode;
}) {
  const cls = {
    emerald:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 hover:border-emerald-400 hover:shadow-emerald-200",
    amber:
      "border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 hover:border-amber-400 hover:shadow-amber-200",
    red: "border-red-200 bg-gradient-to-br from-red-50 to-red-100 hover:border-red-400 hover:shadow-red-200",
  }[tone];

  const titleColor = {
    emerald: "text-emerald-900",
    amber: "text-amber-900",
    red: "text-red-900",
  }[tone];

  return (
    <Link
      href={href}
      className={`group flex aspect-square flex-col rounded-2xl border-2 p-4 shadow-sm transition hover:shadow-lg ${cls}`}
    >
      <div className="text-center">
        <h2 className={`text-base font-bold ${titleColor}`}>{title}</h2>
        <p className="mt-0.5 text-[11px] text-slate-600">{subtitle}</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-2 py-3">
        <div className="aspect-square h-full max-h-full w-auto">{robot}</div>
      </div>

      <div className="border-t border-white/60 pt-2 text-center">
        <div className={`tabular text-3xl font-extrabold ${titleColor}`}>{count}</div>
        <div className="text-[11px] uppercase tracking-wider text-slate-600">
          {count === 1 ? "produkts" : "produkti"}
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Bucket detail view with bulk actions
// ---------------------------------------------------------------------------

const BUCKET_META: Record<
  Bucket,
  { title: string; description: string; tone: "emerald" | "amber" | "red" }
> = {
  selling: {
    title: "Preces pārdošanā (0–7 dienas)",
    description: "Svaiga prece, kas nesen nonāca veikalā.",
    tone: "emerald",
  },
  stale_week: {
    title: "Neviens nepērk nedēļu (8–14 dienas)",
    description:
      "Šīm precēm jau pagāja nedēļa veikalā. Pamēģini papildu atlaidi vai pārvieto uz Izpārdošanu.",
    tone: "amber",
  },
  stale_two_weeks: {
    title: "Neviens nepērk 2+ nedēļas (15+ dienas)",
    description:
      "Šeit jau ir kritiski — vajadzīga agresīva atlaide vai pārvietošana uz Izpārdošanu.",
    tone: "red",
  },
};

function bucketFor(product: Product, now: number): Bucket {
  const ts = product.listedAt?.toMillis?.() ?? product.createdAt?.toMillis?.() ?? now;
  const ageDays = (now - ts) / DAY_MS;
  if (ageDays < 7) return "selling";
  if (ageDays < 14) return "stale_week";
  return "stale_two_weeks";
}

function BucketDetailView({
  bucket,
  products,
  onChanged,
}: {
  bucket: Bucket;
  products: Product[];
  onChanged: () => void | Promise<void>;
}) {
  const router = useRouter();
  const { appUser } = useAuth();
  const meta = BUCKET_META[bucket];
  const canAct = hasPermission(appUser?.role, "changePrice");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const now = Date.now();
  const inBucket = useMemo(
    () => products.filter((p) => bucketFor(p, now) === bucket),
    [products, bucket, now]
  );

  const selectedProducts = useMemo(
    () => inBucket.filter((p) => selected.has(p.id)),
    [inBucket, selected]
  );

  // Bulk action targets — selected if any are checked, otherwise the entire bucket.
  const targets = selected.size > 0 ? selectedProducts : inBucket;

  const [extraDiscount, setExtraDiscount] = useState(20);
  const [bulkPriceStr, setBulkPriceStr] = useState("");

  const toggle = (id: string) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const selectAll = () => setSelected(new Set(inBucket.map((p) => p.id)));
  const selectNone = () => setSelected(new Set());

  const audit = (
    productId: string,
    action: Parameters<typeof logAudit>[0]["action"],
    after: Record<string, unknown>
  ) => {
    if (!appUser) return Promise.resolve();
    return logAudit({
      userId: appUser.uid,
      userEmail: appUser.email,
      action,
      entityType: "product",
      entityId: productId,
      after,
    });
  };

  const applyExtraDiscount = async () => {
    if (!canAct || targets.length === 0) return;
    if (
      !window.confirm(
        `Pievienot ${extraDiscount}% papildu atlaidi ${targets.length} precei?`
      )
    )
      return;
    setBusy(true);
    setToast(null);
    try {
      for (const p of targets) {
        const factor = 1 - extraDiscount / 100;
        const newPrice = roundToDot99((p.finalPrice ?? p.referencePrice) * factor);
        await updateProduct(p.id, {
          finalPrice: newPrice,
          listingDiscountPercent: Math.min(99, p.listingDiscountPercent + extraDiscount),
        });
        await audit(p.id, "product_bulk_discount_applied", {
          extraDiscountPct: extraDiscount,
          newPrice,
        });
      }
      setToast(`✓ ${extraDiscount}% papildu atlaide pielietota ${targets.length} precei.`);
      await onChanged();
      setSelected(new Set());
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setBusy(false);
    }
  };

  const applyBulkPrice = async () => {
    if (!canAct || targets.length === 0) return;
    const v = parseFloat(bulkPriceStr.replace(",", "."));
    if (!Number.isFinite(v) || v <= 0) {
      setToast("Ievadi derīgu cenu (lielāku par 0).");
      return;
    }
    if (
      !window.confirm(
        `Iestatīt vienotu cenu ${v.toFixed(2)} EUR ${targets.length} precei?`
      )
    )
      return;
    setBusy(true);
    setToast(null);
    try {
      for (const p of targets) {
        await updateProduct(p.id, { finalPrice: v });
        await audit(p.id, "product_bulk_price_set", { newPrice: v });
      }
      setToast(`✓ Cena ${v.toFixed(2)} EUR pielietota ${targets.length} precei.`);
      await onChanged();
      setSelected(new Set());
      setBulkPriceStr("");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setBusy(false);
    }
  };

  const moveToOutlet = async () => {
    if (!canAct || targets.length === 0) return;
    if (
      !window.confirm(
        `Pārvietot ${targets.length} preci uz veikala Izpārdošanu (Outlet sale)?`
      )
    )
      return;
    setBusy(true);
    setToast(null);
    try {
      for (const p of targets) {
        await updateProduct(p.id, { outletSaleAt: serverTimestamp() });
        await audit(p.id, "product_moved_to_outlet_sale", {
          from: bucket,
        });
      }
      setToast(`✓ Pārvietots uz Izpārdošanu: ${targets.length} prece.`);
      await onChanged();
      setSelected(new Set());
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setBusy(false);
    }
  };

  const STALE_DISPOSAL_REASON = "Neviens nepērk 2+ nedēļas — utilizēts no /products";

  const moveToDisposed = async (single?: Product) => {
    if (!canAct) return;
    const list = single ? [single] : targets;
    if (list.length === 0) return;
    const msg = single
      ? `Pārvietot preci "${single.title.slice(0, 50)}" uz Utilizētajām?`
      : `Pārvietot ${list.length} preci uz Utilizētajām precēm?`;
    if (!window.confirm(msg)) return;
    setBusy(true);
    setToast(null);
    try {
      for (const p of list) {
        await updateProduct(p.id, {
          listingStatus: "disposed",
          disposalReason: STALE_DISPOSAL_REASON,
        });
        await audit(p.id, "product_marked_disposed", {
          from: bucket,
          reason: STALE_DISPOSAL_REASON,
        });
      }
      setToast(`✓ Pārvietots uz Utilizētajām: ${list.length} prece.`);
      await onChanged();
      if (!single) setSelected(new Set());
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setBusy(false);
    }
  };

  const accentClass =
    meta.tone === "emerald"
      ? "border-emerald-200 bg-emerald-50"
      : meta.tone === "amber"
      ? "border-amber-200 bg-amber-50"
      : "border-red-200 bg-red-50";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => router.push("/products")}
            className="text-xs text-slate-500 underline-offset-2 hover:underline"
          >
            ← Atpakaļ uz visām kategorijām
          </button>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{meta.title}</h1>
          <p className="text-sm text-slate-600">{meta.description}</p>
        </div>
        <div className="text-right">
          <div className="tabular text-3xl font-bold text-slate-900">{inBucket.length}</div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500">
            kopā šajā kategorijā
          </div>
        </div>
      </div>

      {bucket !== "selling" && (
        <section
          className={`space-y-3 rounded-lg border p-4 ${accentClass}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-slate-800">
              Bulk darbības {selected.size > 0 ? `(${selected.size} izvēlēti)` : `(visi ${inBucket.length})`}
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={selectAll}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px]"
              >
                Izvēlēties visus
              </button>
              <button
                type="button"
                onClick={selectNone}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px]"
              >
                Notīrīt
              </button>
            </div>
          </div>

          {/* Extra discount */}
          <div className="rounded-md border border-white bg-white/70 p-3">
            <div className="text-xs font-medium text-slate-700">
              Pievienot papildu atlaidi
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={5}
                max={90}
                value={extraDiscount}
                onChange={(e) => setExtraDiscount(Number(e.target.value))}
                className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm tabular"
              />
              <span className="text-xs text-slate-600">%</span>
              <input
                type="range"
                min={5}
                max={90}
                value={extraDiscount}
                onChange={(e) => setExtraDiscount(Number(e.target.value))}
                className="flex-1 min-w-[120px] max-w-xs accent-slate-900"
              />
              {[20, 30, 50].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setExtraDiscount(d)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                    extraDiscount === d
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  −{d}%
                </button>
              ))}
              <button
                type="button"
                onClick={applyExtraDiscount}
                disabled={!canAct || busy || targets.length === 0}
                className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:bg-slate-300"
              >
                Pielietot
              </button>
            </div>
          </div>

          {/* Bulk price set */}
          <div className="rounded-md border border-white bg-white/70 p-3">
            <div className="text-xs font-medium text-slate-700">
              Iestatīt vienotu cenu (EUR)
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={bulkPriceStr}
                onChange={(e) => setBulkPriceStr(e.target.value)}
                placeholder="piem. 9.99"
                className="w-32 rounded-md border border-slate-300 px-3 py-1.5 text-sm tabular"
              />
              <button
                type="button"
                onClick={applyBulkPrice}
                disabled={!canAct || busy || targets.length === 0}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
              >
                Pielietot
              </button>
            </div>
          </div>

          {/* Move to outlet sale */}
          <div className="rounded-md border border-white bg-white/70 p-3">
            <div className="text-xs font-medium text-slate-700">
              Pārvietot uz veikala Izpārdošanas sadaļu
            </div>
            <button
              type="button"
              onClick={moveToOutlet}
              disabled={!canAct || busy || targets.length === 0}
              className="mt-2 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-slate-300"
            >
              🏷 Pārvietot uz Izpārdošanu ({targets.length})
            </button>
          </div>

          {/* Move to utilizētajām — only meaningful in stale_two_weeks */}
          {bucket === "stale_two_weeks" && (
            <div className="rounded-md border border-red-300 bg-red-100/60 p-3">
              <div className="text-xs font-medium text-red-900">
                Utilizēt (preces, kuras nevar pārdot)
              </div>
              <p className="mt-0.5 text-[11px] text-red-800">
                Pārvieto preces uz Utilizētajām precēm. Iemesls tiek
                automātiski iestatīts uz &quot;Neviens nepērk 2+ nedēļas&quot;.
              </p>
              <button
                type="button"
                onClick={() => moveToDisposed()}
                disabled={!canAct || busy || targets.length === 0}
                className="mt-2 rounded-md bg-red-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-900 disabled:bg-slate-300"
              >
                🗑 Pārvietot uz Utilizētajām ({targets.length})
              </button>
            </div>
          )}

          {toast && (
            <div className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800">
              {toast}
            </div>
          )}
          {!canAct && (
            <div className="text-[11px] text-slate-600">
              Bulk darbības pieejamas tikai MASTER vai ADMIN lomai.
            </div>
          )}
        </section>
      )}

      {/* Product list */}
      {inBucket.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Šajā kategorijā nav neviena produkta. 🎉
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="app-table w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                {bucket !== "selling" && <th className="w-8 px-2 py-2"></th>}
                <th className="px-3 py-2"></th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Brand</th>
                <th className="px-3 py-2 text-right tabular">Ref.</th>
                <th className="px-3 py-2 text-right tabular">Final</th>
                <th className="px-3 py-2 text-right tabular">Atlaide %</th>
                <th className="px-3 py-2">Veikalā kopš</th>
                <th className="px-3 py-2">Izpārdošanā?</th>
                {bucket === "stale_two_weeks" && <th className="px-3 py-2"></th>}
                <th className="px-3 py-2 text-right">→</th>
              </tr>
            </thead>
            <tbody>
              {inBucket.map((p) => {
                const listedAtMs =
                  p.listedAt?.toMillis?.() ?? p.createdAt?.toMillis?.() ?? null;
                const ageDays =
                  listedAtMs != null
                    ? Math.floor((now - listedAtMs) / DAY_MS)
                    : null;
                return (
                  <tr key={p.id} className="border-t border-slate-100">
                    {bucket !== "selling" && (
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => toggle(p.id)}
                        />
                      </td>
                    )}
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
                    <td className="max-w-[280px] truncate px-3 py-2 text-slate-900">
                      {p.title}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">{p.brand}</td>
                    <td className="px-3 py-2 text-right tabular text-xs">
                      {p.referencePrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right tabular text-xs font-medium">
                      {p.finalPrice?.toFixed(2) ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular text-xs">
                      {p.listingDiscountPercent}%
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">
                      {ageDays != null ? `${ageDays} d.` : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {p.outletSaleAt ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-800 ring-1 ring-inset ring-red-200">
                          🏷 Outlet
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                    {bucket === "stale_two_weeks" && (
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => moveToDisposed(p)}
                          disabled={!canAct || busy}
                          title="Pārvietot uz Utilizētajām precēm"
                          className="rounded-md border border-red-300 bg-white px-2 py-1 text-[10px] font-medium text-red-800 hover:bg-red-50 disabled:opacity-40"
                        >
                          🗑 Utilizēt
                        </button>
                      </td>
                    )}
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
