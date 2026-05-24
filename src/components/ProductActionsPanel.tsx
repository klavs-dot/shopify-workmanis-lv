"use client";

import { useState } from "react";
import { serverTimestamp } from "firebase/firestore";

import { useAuth } from "@/lib/auth/AuthProvider";
import { updateProduct } from "@/lib/firestore/products";
import { logAudit } from "@/lib/firestore/audit";
import { hasPermission } from "@/lib/auth/roles";
import { computePricing, roundToDot99 } from "@/lib/pricing";
import type { AiStatus, Product } from "@/lib/types";

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
  const { appUser, firebaseUser } = useAuth();

  const canApprove = hasPermission(appUser?.role, "approveProducts");
  const canChangePrice = hasPermission(appUser?.role, "changePrice");
  const canMarkSold = hasPermission(appUser?.role, "approveProducts");
  const canEnrich = appUser?.role === "MASTER" || appUser?.role === "ADMIN";

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

  // ---- AI content editor state (LV / EN / RU) ----
  const [activeLang, setActiveLang] = useState<"lv" | "en" | "ru">("lv");
  const [titleLv, setTitleLv] = useState(product.enrichedTitle ?? "");
  const [titleEn, setTitleEn] = useState(product.enrichedTitleEn ?? "");
  const [titleRu, setTitleRu] = useState(product.enrichedTitleRu ?? "");
  const [descLv, setDescLv] = useState(product.descriptionLv ?? "");
  const [descEn, setDescEn] = useState(product.descriptionEn ?? "");
  const [descRu, setDescRu] = useState(product.descriptionRu ?? "");
  const [contentDirty, setContentDirty] = useState(false);
  const [contentToast, setContentToast] = useState<string | null>(null);

  const saveContent = async () => {
    if (!appUser) return;
    setBusy(true);
    setContentToast(null);
    try {
      await updateProduct(product.id, {
        enrichedTitle: titleLv.trim() || null,
        enrichedTitleEn: titleEn.trim() || null,
        enrichedTitleRu: titleRu.trim() || null,
        descriptionLv: descLv.trim() || null,
        descriptionEn: descEn.trim() || null,
        descriptionRu: descRu.trim() || null,
      });
      await logAudit({
        userId: appUser.uid,
        userEmail: appUser.email,
        action: "product_customer_note_set", // closest existing action; piggybacks the manual-edit audit
        entityType: "product",
        entityId: product.id,
        after: {
          editedFields: ["titles", "descriptions"],
          via: "manual-multilang-edit",
        },
      });
      setContentDirty(false);
      setContentToast("✓ Saglabāts");
      onChanged?.();
      setTimeout(() => setContentToast(null), 3000);
    } catch (err) {
      setContentToast(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setBusy(false);
    }
  };

  const [aiBusy, setAiBusy] = useState(false);
  const [aiStatusLocal, setAiStatusLocal] = useState<AiStatus | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const aiStatus: AiStatus = aiStatusLocal ?? product.aiStatus;

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
    run(
      {
        listingStatus: "listed_in_store",
        // Stamp the first-listed date so /products stale-bucket math works.
        // If listedAt was already set (re-listing), the serverTimestamp
        // simply overwrites it — that's intentional: the 7/14-day clock
        // restarts on each manual re-listing.
        listedAt: serverTimestamp(),
      },
      "product_listed_in_store"
    );

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

  const markShipped = () => {
    if (!appUser) return Promise.resolve();
    return run(
      {
        shippedAt: serverTimestamp(),
        shippedByUid: appUser.uid,
      },
      "product_marked_shipped"
    );
  };

  const saveNoteOnly = () =>
    run(
      { customerNote: note.trim() || null },
      "product_customer_note_set"
    );

  const runAiEnrichment = async () => {
    if (!firebaseUser) return;
    setAiBusy(true);
    setAiError(null);
    setAiStatusLocal("enrichment_pending");
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/ai/enrich-product", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        enriched?: { confidenceScore?: number };
      };
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const conf = data.enriched?.confidenceScore ?? 0;
      setAiStatusLocal(conf >= 0.6 ? "enriched" : "needs_review");
      onChanged?.();
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Kļūda");
      setAiStatusLocal("failed");
    } finally {
      setAiBusy(false);
    }
  };

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

      {/* ===== AI enrichment ===== */}
      <section className="rounded-md border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-medium text-slate-700">AI bagātinājums (Claude Sonnet)</div>
            <div className="text-[11px] text-slate-500">
              Status:{" "}
              <span className="font-medium">
                {aiStatus === "enriched"
                  ? "Bagātināts"
                  : aiStatus === "needs_review"
                  ? "Vajag pārskatīt"
                  : aiStatus === "enrichment_pending"
                  ? "Apstrādā…"
                  : aiStatus === "failed"
                  ? "Kļūda"
                  : "Nesākts"}
              </span>
              {product.confidenceScore != null && (
                <>
                  {" · "}
                  Confidence:{" "}
                  <strong className="tabular">
                    {(product.confidenceScore * 100).toFixed(0)}%
                  </strong>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={runAiEnrichment}
            disabled={!canEnrich || aiBusy}
            className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {aiBusy
              ? "Bagātina… (30-60 sek)"
              : aiStatus === "enriched" || aiStatus === "needs_review"
              ? "✨ Pārbagātināt"
              : "✨ Sākt AI bagātinājumu"}
          </button>
        </div>

        {aiError && (
          <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
            {aiError}
          </div>
        )}

        {(product.enrichedTitle ||
          product.enrichedTitleEn ||
          product.enrichedTitleRu ||
          product.descriptionLv ||
          product.descriptionEn ||
          product.descriptionRu) && (
          <div className="mt-3 space-y-3 rounded-md bg-slate-50 p-3">
            {/* Language tabs */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {(["lv", "en", "ru"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLang(lang)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                      activeLang === lang
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {lang === "lv" ? "Latviešu" : lang === "en" ? "English" : "Русский"}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {contentToast && (
                  <span className="text-[11px] text-slate-700">{contentToast}</span>
                )}
                <button
                  type="button"
                  onClick={saveContent}
                  disabled={busy || !contentDirty}
                  className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Saglabāt tulkojumus
                </button>
              </div>
            </div>

            {/* Editable content per active language */}
            {activeLang === "lv" && (
              <LangFields
                titleLabel="Virsraksts (latviski)"
                descLabel="Apraksts (latviski)"
                titleValue={titleLv}
                descValue={descLv}
                onTitleChange={(v) => {
                  setTitleLv(v);
                  setContentDirty(true);
                }}
                onDescChange={(v) => {
                  setDescLv(v);
                  setContentDirty(true);
                }}
                titlePlaceholder="piem. FENCHILIN Hollywood LED Grima Spogulis ar Bluetooth"
                descPlaceholder="150–300 rakstzīmes, dabīgi latviski ar diakritikām…"
              />
            )}
            {activeLang === "en" && (
              <LangFields
                titleLabel="Title (English)"
                descLabel="Description (English)"
                titleValue={titleEn}
                descValue={descEn}
                onTitleChange={(v) => {
                  setTitleEn(v);
                  setContentDirty(true);
                }}
                onDescChange={(v) => {
                  setDescEn(v);
                  setContentDirty(true);
                }}
                titlePlaceholder="e.g. FENCHILIN Hollywood LED Vanity Mirror with Bluetooth"
                descPlaceholder="150–300 characters, natural English…"
              />
            )}
            {activeLang === "ru" && (
              <LangFields
                titleLabel="Заголовок (русский)"
                descLabel="Описание (русское)"
                titleValue={titleRu}
                descValue={descRu}
                onTitleChange={(v) => {
                  setTitleRu(v);
                  setContentDirty(true);
                }}
                onDescChange={(v) => {
                  setDescRu(v);
                  setContentDirty(true);
                }}
                titlePlaceholder="напр. FENCHILIN Голливудское LED-зеркало для макияжа с Bluetooth"
                descPlaceholder="150–300 символов, натуральный русский…"
              />
            )}

            {/* Images + sources stay read-only for now */}
            {product.enrichedImages && product.enrichedImages.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Atrastās bildes ({product.enrichedImages.length})
                </div>
                <div className="mt-1 flex gap-1.5 overflow-x-auto">
                  {product.enrichedImages.slice(0, 8).map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={src}
                      alt=""
                      loading="lazy"
                      className="h-16 w-16 shrink-0 rounded object-cover ring-1 ring-slate-300"
                    />
                  ))}
                </div>
              </div>
            )}
            {product.sourceUrls && product.sourceUrls.length > 0 && (
              <details className="text-[11px]">
                <summary className="cursor-pointer text-slate-500">
                  Avoti ({product.sourceUrls.length})
                </summary>
                <ul className="mt-1 space-y-0.5">
                  {product.sourceUrls.slice(0, 6).map((url, i) => (
                    <li key={i} className="truncate">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 underline-offset-2 hover:underline"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
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

      {/* ===== Shipment (only visible when sold) ===== */}
      {product.listingStatus === "sold" && (
        <section
          className={`rounded-md border p-3 ${
            product.shippedAt
              ? "border-emerald-200 bg-emerald-50"
              : "border-blue-200 bg-blue-50"
          }`}
        >
          <div className="text-xs font-medium text-slate-800">
            Klienta sūtījums
          </div>
          {product.shippedAt ? (
            <div className="mt-1 text-xs text-emerald-900">
              ✓ Izsūtīts{" "}
              <strong className="tabular">
                {product.shippedAt.toDate().toLocaleString("lv-LV")}
              </strong>
            </div>
          ) : (
            <>
              <p className="mt-1 text-[11px] text-blue-900">
                Klients samaksāja, bet prece vēl nav izsūtīta. Atzīmē, kad
                fiziski nodod kurjeram vai pastam.
              </p>
              <button
                type="button"
                onClick={markShipped}
                disabled={busy}
                className="mt-2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                📦 Atzīmēt kā izsūtītu
              </button>
            </>
          )}
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

function LangFields({
  titleLabel,
  descLabel,
  titleValue,
  descValue,
  onTitleChange,
  onDescChange,
  titlePlaceholder,
  descPlaceholder,
}: {
  titleLabel: string;
  descLabel: string;
  titleValue: string;
  descValue: string;
  onTitleChange: (v: string) => void;
  onDescChange: (v: string) => void;
  titlePlaceholder: string;
  descPlaceholder: string;
}) {
  return (
    <div className="space-y-2">
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-slate-500">
          {titleLabel}
        </label>
        <input
          type="text"
          value={titleValue}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={titlePlaceholder}
          maxLength={120}
          className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
        />
        <div className="mt-0.5 text-right text-[10px] text-slate-400">
          {titleValue.length} / 80 ieteicams
        </div>
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-slate-500">
          {descLabel}
        </label>
        <textarea
          value={descValue}
          onChange={(e) => onDescChange(e.target.value)}
          placeholder={descPlaceholder}
          rows={4}
          className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
        />
        <div className="mt-0.5 text-right text-[10px] text-slate-400">
          {descValue.length} / 150–300 ieteicams
        </div>
      </div>
    </div>
  );
}
