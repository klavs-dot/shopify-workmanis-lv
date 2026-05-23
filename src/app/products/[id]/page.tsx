"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  ApprovalBadge,
  ConditionBadge,
  ImportBadge,
  ShopifyBadge,
  WarehouseBadge,
} from "@/components/StatusBadge";
import { getProduct, updateProduct } from "@/lib/firestore/products";
import { computePricing, RECOMMENDED_ACTION_LABEL } from "@/lib/pricing";
import { logAudit } from "@/lib/firestore/audit";
import { hasPermission } from "@/lib/auth/roles";
import type {
  ApprovalStatus,
  Product,
  ProductCondition,
  WarehouseStatus,
} from "@/lib/types";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <RequireRole allow={["MASTER", "ADMIN", "WAREHOUSE", "VIEWER"]}>
      <AppShell>
        <ProductDetail id={id} />
      </AppShell>
    </RequireRole>
  );
}

function ProductDetail({ id }: { id: string }) {
  const { appUser } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setProduct(await getProduct(id));
  };

  useEffect(() => {
    (async () => {
      try {
        setProduct(await getProduct(id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Neizdevās");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="text-sm text-slate-500">Ielāde…</div>;
  if (error) return <div className="text-sm text-red-700">{error}</div>;
  if (!product)
    return <div className="text-sm text-slate-500">Produkts nav atrasts.</div>;

  const canChangePrice = hasPermission(appUser?.role, "changePrice");
  const canApprove = hasPermission(appUser?.role, "approveProducts");
  const canWarehouse = hasPermission(appUser?.role, "changeWarehouseStatus");

  const saveAction = async (
    patch: Parameters<typeof updateProduct>[1],
    audit: {
      action: Parameters<typeof logAudit>[0]["action"];
      after: Record<string, unknown>;
    }
  ) => {
    if (!appUser) return;
    setSaving(true);
    try {
      await updateProduct(id, patch);
      await logAudit({
        userId: appUser.uid,
        userEmail: appUser.email,
        action: audit.action,
        entityType: "product",
        entityId: id,
        before: { ...product },
        after: audit.after,
      });
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setSaving(false);
    }
  };

  const onConditionChange = async (c: ProductCondition) => {
    const pricing = computePricing({
      referencePrice: product.referencePrice,
      marketPrice: product.marketPrice,
      condition: c,
    });
    await saveAction(
      { condition: c, finalPrice: pricing.suggestedPrice },
      {
        action: "price_changed",
        after: { condition: c, finalPrice: pricing.suggestedPrice },
      }
    );
  };

  const onFinalPriceChange = async (raw: string) => {
    const v = parseFloat(raw.replace(",", "."));
    const final = Number.isFinite(v) ? v : null;
    await saveAction(
      { finalPrice: final },
      { action: "price_changed", after: { finalPrice: final } }
    );
  };

  const onMarketPriceChange = async (raw: string) => {
    const v = parseFloat(raw.replace(",", "."));
    const market = Number.isFinite(v) ? v : null;
    const pricing = computePricing({
      referencePrice: product.referencePrice,
      marketPrice: market,
      condition: product.condition,
    });
    await saveAction(
      { marketPrice: market, finalPrice: pricing.suggestedPrice },
      {
        action: "price_changed",
        after: { marketPrice: market, finalPrice: pricing.suggestedPrice },
      }
    );
  };

  const setApproval = async (status: ApprovalStatus) => {
    await saveAction({ approvalStatus: status }, {
      action:
        status === "approved"
          ? "product_approved"
          : status === "rejected"
          ? "product_rejected"
          : status === "bundle"
          ? "product_sent_to_bundle"
          : status === "outlet"
          ? "product_sent_to_outlet"
          : "product_approved",
      after: { approvalStatus: status },
    });
  };

  const setWh = async (status: WarehouseStatus) => {
    await saveAction({ warehouseStatus: status }, {
      action:
        status === "missing"
          ? "product_marked_missing"
          : status === "damaged_package" || status === "damaged_product"
          ? "product_marked_damaged"
          : "warehouse_status_changed",
      after: { warehouseStatus: status },
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{product.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <ImportBadge status={product.importStatus} />
            <ApprovalBadge status={product.approvalStatus} />
            <WarehouseBadge status={product.warehouseStatus} />
            <ConditionBadge condition={product.condition} />
            <ShopifyBadge status={product.shopifyStatus} />
          </div>
        </div>
        <Link
          href={`/skirosana/${product.palletId}`}
          className="text-xs text-slate-500 underline-offset-2 hover:underline"
        >
          ← Atpakaļ uz paleti
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Manifesta dati</h2>
            <dl className="grid grid-cols-2 gap-y-1 text-sm">
              <Dt>Product SKU</Dt><Dd mono>{product.productSku || "—"}</Dd>
              <Dt>Manifest SKU</Dt><Dd mono>{product.manifestSku || "—"}</Dd>
              <Dt>Brand</Dt><Dd>{product.brand || "—"}</Dd>
              <Dt>Category</Dt><Dd>{product.categoryName || "—"}</Dd>
              <Dt>Subcategory</Dt><Dd>{product.subCategoryName || "—"}</Dd>
              <Dt>ASIN</Dt><Dd mono>{product.asin || "—"}</Dd>
              <Dt>EAN</Dt><Dd mono>{product.ean || "—"}</Dd>
              <Dt>Barcode</Dt><Dd mono>{product.barcode || "—"}</Dd>
              <Dt>Item qty</Dt><Dd>{product.itemQty}</Dd>
              <Dt>Stock qty</Dt><Dd>{product.stockQty}</Dd>
              <Dt>Weight (kg)</Dt><Dd>{product.weightKg ?? "—"}</Dd>
              <Dt>Grade</Dt><Dd>{product.grade ?? "—"}</Dd>
            </dl>

            {product.images.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {product.images.slice(0, 6).map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt=""
                    loading="lazy"
                    className="h-20 w-20 shrink-0 rounded object-cover ring-1 ring-slate-200"
                  />
                ))}
              </div>
            )}
            {product.description && (
              <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                {product.description}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Cenas</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Reference cena">
                <div className="rounded-md bg-slate-50 px-3 py-2 text-sm tabular">
                  {product.referencePrice.toFixed(2)} {product.referenceCurrency}
                </div>
              </Field>
              <Field label="Market price (manuāli)">
                <input
                  type="text"
                  defaultValue={product.marketPrice?.toString() ?? ""}
                  onBlur={(e) => canChangePrice && onMarketPriceChange(e.target.value)}
                  disabled={!canChangePrice || saving}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="—"
                />
              </Field>
              <Field label="Suggested (auto)">
                <div className="rounded-md bg-slate-50 px-3 py-2 text-sm tabular">
                  {product.suggestedPrice?.toFixed(2) ?? "—"}
                </div>
              </Field>
              <Field label="Condition">
                <select
                  value={product.condition}
                  disabled={!canChangePrice || saving}
                  onChange={(e) => onConditionChange(e.target.value as ProductCondition)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="brand_new">Jauns</option>
                  <option value="open_box">Atvērta kaste</option>
                  <option value="damaged_package">Bojāts iep.</option>
                  <option value="untested">Netestēts</option>
                  <option value="damaged_product">Bojāts produkts</option>
                </select>
              </Field>
              <Field label="Final cena">
                <input
                  type="text"
                  defaultValue={product.finalPrice?.toString() ?? ""}
                  onBlur={(e) => canChangePrice && onFinalPriceChange(e.target.value)}
                  disabled={!canChangePrice || saving}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium"
                />
              </Field>
              <Field label="Recommended action">
                <div className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                  {product.recommendedAction
                    ? RECOMMENDED_ACTION_LABEL[product.recommendedAction]
                    : "—"}
                </div>
              </Field>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">
              Shopify <span className="ml-2 text-xs font-normal text-slate-400">(coming later)</span>
            </h2>
            <dl className="grid grid-cols-2 gap-y-1 text-sm">
              <Dt>Shopify Product ID</Dt><Dd mono>{product.shopifyProductId || "—"}</Dd>
              <Dt>Variant ID</Dt><Dd mono>{product.shopifyVariantId || "—"}</Dd>
              <Dt>Published</Dt><Dd>
                {product.publishedAt?.toDate
                  ? product.publishedAt.toDate().toLocaleString("lv-LV")
                  : "—"}
              </Dd>
            </dl>
            <button
              disabled
              className="mt-3 cursor-not-allowed rounded-md bg-slate-200 px-3 py-1.5 text-xs text-slate-500"
            >
              Push to Shopify — coming later
            </button>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Warehouse</h2>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  "not_checked",
                  "found",
                  "missing",
                  "damaged_package",
                  "damaged_product",
                  "tested_ok",
                  "tested_failed",
                  "needs_photo",
                  "ready",
                ] as WarehouseStatus[]
              ).map((w) => (
                <button
                  key={w}
                  type="button"
                  disabled={!canWarehouse || saving}
                  onClick={() => setWh(w)}
                  className={`rounded-md border px-2 py-1.5 text-xs ${
                    product.warehouseStatus === w
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <WarehouseBadge status={w} />
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Approval</h2>
            <div className="flex flex-col gap-1.5">
              {(
                [
                  ["approved", "Apstiprināt", "bg-emerald-600 text-white"],
                  ["rejected", "Noraidīt", "bg-red-600 text-white"],
                  ["bundle", "Sūtīt uz Bundle", "bg-indigo-600 text-white"],
                  ["outlet", "Sūtīt uz Outlet", "bg-orange-600 text-white"],
                  ["do_not_publish", "Nepublicēt", "bg-slate-700 text-white"],
                  ["waiting_approval", "Atgriezt rindā", "bg-amber-100 text-amber-800"],
                  ["draft", "Atgriezt draft", "bg-slate-100 text-slate-700"],
                ] as [ApprovalStatus, string, string][]
              ).map(([s, label, cls]) => (
                <button
                  key={s}
                  type="button"
                  disabled={!canApprove || saving}
                  onClick={() => setApproval(s)}
                  className={`rounded-md px-2 py-1.5 text-xs font-medium ${cls} disabled:opacity-50`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Dt({ children }: { children: React.ReactNode }) {
  return <dt className="text-xs text-slate-500">{children}</dt>;
}
function Dd({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <dd className={`text-sm text-slate-900 ${mono ? "font-mono text-xs" : ""}`}>
      {children}
    </dd>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
