"use client";

import { useState } from "react";
import { serverTimestamp } from "firebase/firestore";

import { useAuth } from "@/lib/auth/AuthProvider";
import { updateProduct } from "@/lib/firestore/products";
import { logAudit } from "@/lib/firestore/audit";
import { hasPermission } from "@/lib/auth/roles";
import { computePricing, roundToDot99 } from "@/lib/pricing";
import type { Product } from "@/lib/types";

interface ProductActionsPanelProps {
  product: Product;
  /** Called after a successful update so the parent can refresh. */
  onChanged?: () => void;
  /** Optional cancel handler — collapses the panel. */
  onCancel?: () => void;
}

/**
 * Warehouse-worker action panel for a single product row.
 *
 * - Apstiprināt ievietošanu: sets listingDiscountPercent, locks finalPrice,
 *   moves listingStatus → "listing_approved", approvalStatus → "approved".
 * - Quick presets 50 % (default) and 75 % plus a free slider 0–99.
 * - Customer note: stored on the product; later surfaces as a red banner
 *   above the Shopify description.
 * - Marķēt veikalā: listingStatus → "listed_in_store".
 * - Marķēt pārdotu: opens a small sold-price input, then status → "sold".
 * - Utilizēt: stores a reason on disposalReason and listingStatus → "disposed".
 */
export function ProductActionsPanel({
  product,
  onChanged,
  onCancel,
}: ProductActionsPanelProps) {
  const { appUser } = useAuth();

  const canApprove = hasPermission(appUser?.role, "approveProducts");
  const canChangePrice = hasPermission(appUser?.role, "changePrice");
  const canMarkSold = hasPermission(appUser?.role, "approveProducts");

  const [discount, setDiscount] = useState<number>(product.listingDiscountPercent ?? 50);
  const [note, setNote] = useState<string>(product.customerNote ?? "");
  const [disposalReason, setDisposalReason] = useState<string>(
    product.disposalReason ?? ""
  );
  const [soldPriceStr, setSoldPriceStr] = useState<string>(
    product.finalPrice != null ? product.finalPrice.toFixed(2) : ""
  );
  const [showSold, setShowSold] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The "shop" displays the full RRP and a strikethrough discount of this %.
  // The customer pays this amount:
  const pricing = computePricing({
    referencePrice: product.referencePrice,
    marketPrice: product.marketPrice,
    condition: product.condition,
  });
  // The user-facing discounted price = referencePrice × (1 − discount/100),
  // rounded to .99 for shelf-ready feel.
  const discountedPrice = roundToDot99(
    product.referencePrice * (1 - discount / 100)
  );

  const run = async (
    patch: Parameters<typeof updateProduct>[1],
    action: Parameters<typeof logAudit>[0]["action"]
  ) => {
    if (!appUser) return;
    setBusy(true);
    setError(null);
    try {
      await updateProduct(product.id, patch);
      await logAudit({
        userId: appUser.uid,
        userEmail: appUser.email,
        action,
        entityType: "product",
        entityId: product.id,
        before: { ...product },
        after: patch as Record<string, unknown>,
      });
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setBusy(false);
    }
  };

  const approveListing = () =>
    run(
      {
        listingStatus: "listing_approved",
        approvalStatus: "approved",
        listingDiscountPercent: discount,
        finalPrice: discountedPrice,
        customerNote: note.trim() || null,
      },
      "product_listing_approved"
    );

  const markListed = () =>
    run({ listingStatus: "listed_in_store" }, "product_listed_in_store");

  const markSold = () => {
    const parsed = soldPriceStr.trim()
      ? Number(soldPriceStr.replace(",", "."))
      : null;
    const soldPrice = parsed != null && Number.isFinite(parsed) ? parsed : null;
    return run(
      {
        listingStatus: "sold",
        soldPrice,
        // serverTimestamp is allowed in the union
        soldAt: serverTimestamp(),
      },
      "product_marked_sold"
    );
  };

  const markDisposed = () =>
    run(
      {
        listingStatus: "disposed",
        disposalReason: disposalReason.trim() || null,
      },
      "product_marked_disposed"
    );

  const saveNoteOnly = () =>
    run(
      { customerNote: note.trim() || null },
      "product_customer_note_set"
    );

  return (
    <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          Darbības
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-[11px] text-slate-500 hover:underline"
          >
            Aizvērt
          </button>
        )}
      </div>

      {/* ===== Pricing & discount ===== */}
      <section className="rounded-md border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-slate-700">Cena un atlaide</div>
          <div className="text-[11px] text-slate-500 tabular">
            Ref. {product.referencePrice.toFixed(2)} {product.referenceCurrency}
            {" · "}
            Pricing-engine suggested {pricing.suggestedPrice.toFixed(2)}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            Atlaide
            <input
              type="number"
              min={0}
              max={99}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              disabled={!canChangePrice || busy}
              className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm tabular"
            />
            %
          </label>
          <input
            type="range"
            min={0}
            max={99}
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            disabled={!canChangePrice || busy}
            className="flex-1 min-w-[120px] max-w-xs accent-slate-900"
          />
          <div className="flex gap-1">
            {[50, 75, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDiscount(d)}
                disabled={!canChangePrice || busy}
                className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                  discount === d
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                −{d}%
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
          Pārdošanas cena pēc {discount}% atlaides:{" "}
          <strong className="tabular">
            {discountedPrice.toFixed(2)} {product.referenceCurrency}
          </strong>
          {" · "}
          Klients ietaupa{" "}
          <strong className="tabular">
            {(product.referencePrice - discountedPrice).toFixed(2)}
          </strong>
        </div>
      </section>

      {/* ===== Customer note ===== */}
      <section className="rounded-md border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-slate-700">
            Piezīme klientam (sarkans baneris veikalā)
          </div>
          <button
            type="button"
            onClick={saveNoteOnly}
            disabled={busy}
            className="rounded-md border border-slate-300 px-2 py-1 text-[11px] hover:bg-slate-50 disabled:opacity-50"
          >
            Saglabāt piezīmi
          </button>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={busy}
          rows={2}
          placeholder="piem. Piezīme!! Precei bojāts korpuss"
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {note.trim() && (
          <div className="mt-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-900">
            <strong>Piezīme!!</strong> {note.trim()}
          </div>
        )}
      </section>

      {/* ===== Action buttons ===== */}
      <section className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={approveListing}
          disabled={!canApprove || busy}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          ✓ Apstiprināt ievietošanu
        </button>
        <button
          type="button"
          onClick={markListed}
          disabled={!canApprove || busy}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          🛒 Marķēt veikalā
        </button>
        <button
          type="button"
          onClick={() => setShowSold((v) => !v)}
          disabled={!canMarkSold || busy}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          💰 Marķēt pārdotu
        </button>
      </section>

      {showSold && (
        <section className="rounded-md border border-indigo-200 bg-indigo-50 p-3">
          <label className="block text-xs font-medium text-indigo-900">
            Pārdošanas cena (faktiskā summa, ko klients samaksāja)
          </label>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              value={soldPriceStr}
              onChange={(e) => setSoldPriceStr(e.target.value)}
              className="w-32 rounded-md border border-indigo-300 px-3 py-1.5 text-sm tabular"
              placeholder="0.00"
            />
            <button
              type="button"
              onClick={markSold}
              disabled={busy}
              className="rounded-md bg-indigo-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
            >
              Apstiprināt pārdošanu
            </button>
            <button
              type="button"
              onClick={() => setShowSold(false)}
              className="rounded-md border border-indigo-300 px-3 py-1.5 text-xs"
            >
              Atcelt
            </button>
          </div>
        </section>
      )}

      {/* ===== Disposal ===== */}
      <section className="rounded-md border border-red-200 bg-red-50 p-3">
        <div className="text-xs font-medium text-red-900">Bojāts / Utilizējams</div>
        <textarea
          value={disposalReason}
          onChange={(e) => setDisposalReason(e.target.value)}
          rows={2}
          disabled={busy}
          placeholder="Iemesls (piem. iepakojums bojāts, korpuss saplaisājis)"
          className="mt-2 w-full rounded-md border border-red-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={markDisposed}
          disabled={busy}
          className="mt-2 rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-50"
        >
          🗑 Pārvietot uz Utilizētajām precēm
        </button>
      </section>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-100 p-2 text-xs text-red-900">
          {error}
        </div>
      )}
    </div>
  );
}
