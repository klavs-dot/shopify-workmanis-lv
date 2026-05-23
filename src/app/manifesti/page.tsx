"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  parseManifestWorkbook,
  buildImportSummary,
  type ParseResult,
} from "@/lib/manifest";
import { createPallet, listPallets } from "@/lib/firestore/pallets";
import { bulkInsertProductsForPallet, listProducts } from "@/lib/firestore/products";
import { logAudit } from "@/lib/firestore/audit";
import type { ImportSummary, Pallet, Product } from "@/lib/types";

const JOBALOTS_URL_PATTERN =
  /^https?:\/\/(www\.)?jobalots\.com\/[a-z]{2}\/products\/[A-Z0-9]+/i;

export default function ManifestiPage() {
  return (
    <RequireRole allow={["MASTER", "ADMIN"]}>
      <AppShell>
        <ManifestiContent />
      </AppShell>
    </RequireRole>
  );
}

function ManifestiContent() {
  return (
    <div className="space-y-8">
      <ManifestUploader />
      <ManifestList />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Uploader
// ---------------------------------------------------------------------------

interface JobalotsLookup {
  manifestSku: string;
  title: string | null;
  rrp: number | null;
  reservePrice: number | null;
  latestBidPrice: number | null;
  currency: string | null;
  location: string | null;
  weightKg: number | null;
  condition: string | null;
  coverImage: string | null;
  isWinner: boolean;
}

function ManifestUploader() {
  const { appUser } = useAuth();
  const fileInput = useRef<HTMLInputElement | null>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParseResult | null>(null);
  const [palletName, setPalletName] = useState("");
  const [jobalotsUrl, setJobalotsUrl] = useState("");
  const [purchasePriceStr, setPurchasePriceStr] = useState("");
  const [source, setSource] = useState("Jobalots");

  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [palletId, setPalletId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live Jobalots lookup state (auto-runs on URL change)
  const [lookup, setLookup] = useState<JobalotsLookup | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const urlOk = !jobalotsUrl || JOBALOTS_URL_PATTERN.test(jobalotsUrl.trim());

  // Debounced auto-lookup whenever the URL becomes a valid Jobalots URL.
  useEffect(() => {
    const trimmed = jobalotsUrl.trim();
    if (!trimmed || !JOBALOTS_URL_PATTERN.test(trimmed)) {
      setLookup(null);
      setLookupError(null);
      return;
    }
    let cancelled = false;
    setLookupLoading(true);
    setLookupError(null);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/jobalots/lookup?url=${encodeURIComponent(trimmed)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          throw new Error(data?.error || "Lookup neizdevās");
        }
        setLookup(data as JobalotsLookup);
        // Auto-fill purchase price if user hasn't typed one yet.
        if (
          !purchasePriceStr &&
          typeof data.latestBidPrice === "number" &&
          data.latestBidPrice > 0
        ) {
          setPurchasePriceStr(data.latestBidPrice.toString());
        }
        // Auto-fill pallet name if empty and Jobalots gives us a title.
        if (!palletName && typeof data.title === "string") {
          setPalletName(data.title);
        }
      } catch (err) {
        if (cancelled) return;
        setLookupError(err instanceof Error ? err.message : "Lookup neizdevās");
      } finally {
        if (!cancelled) setLookupLoading(false);
      }
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // We intentionally do NOT depend on purchasePriceStr/palletName so the
    // user can edit those without retriggering a lookup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobalotsUrl]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFileName(f?.name ?? null);
    setParsedPreview(null);
    setSummary(null);
    setPalletId(null);
    setError(null);
    if (!f) return;

    try {
      const buf = await f.arrayBuffer();
      const parsed = parseManifestWorkbook(buf);
      setParsedPreview(parsed);
      if (!palletName) {
        setPalletName(
          parsed.manifestSku !== "UNKNOWN"
            ? parsed.manifestSku
            : f.name.replace(/\.[^.]+$/, "")
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neizdevās izlasīt failu");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser) return;
    if (!parsedPreview) {
      setError("Vispirms izvēlies Excel failu.");
      return;
    }
    if (!urlOk) {
      setError("Jobalots URL formāts nav derīgs.");
      return;
    }
    if (parsedPreview.rows.length === 0) {
      setError(
        parsedPreview.errors[0]?.message ||
          "Failā neizdevās atrast nevienu derīgu rindu."
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const f = fileInput.current?.files?.[0];
      const fname = f?.name ?? fileName ?? "manifest.xlsx";

      const purchasePriceParsed = purchasePriceStr.trim()
        ? Number(purchasePriceStr.replace(",", "."))
        : null;
      const purchasePrice =
        purchasePriceParsed != null && Number.isFinite(purchasePriceParsed)
          ? purchasePriceParsed
          : lookup?.latestBidPrice ?? null;

      const newPalletId = await createPallet({
        manifestSku: parsedPreview.manifestSku,
        name: palletName || lookup?.title || parsedPreview.manifestSku,
        source,
        originalFileName: fname,
        totalProducts: parsedPreview.rows.length,
        totalReferencePrice: parsedPreview.totalReferencePrice,
        currency: lookup?.currency || parsedPreview.currency,
        jobalotsUrl: jobalotsUrl.trim() || null,
        purchasePrice,
        reservePrice: lookup?.reservePrice ?? null,
        location: lookup?.location ?? null,
        weightKg: lookup?.weightKg ?? null,
        palletCondition: lookup?.condition ?? null,
        createdBy: appUser.uid,
      });
      const { inserted } = await bulkInsertProductsForPallet(
        newPalletId,
        parsedPreview.rows
      );
      const missingData = parsedPreview.rows.filter(
        (r) => !r.title || r.referencePrice === 0
      ).length;
      const sum = buildImportSummary(
        parsedPreview,
        inserted,
        0,
        missingData,
        fname,
        palletName || parsedPreview.manifestSku
      );
      setSummary(sum);
      setPalletId(newPalletId);
      await logAudit({
        userId: appUser.uid,
        userEmail: appUser.email,
        action: "manifest_imported",
        entityType: "pallet",
        entityId: newPalletId,
        after: {
          fileName: fname,
          manifestSku: parsedPreview.manifestSku,
          imported: inserted,
          jobalotsUrl: jobalotsUrl.trim() || null,
          purchasePrice,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Imports neizdevās");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <h1 className="text-xl font-semibold text-slate-900">Manifesti</h1>
      <p className="mt-1 text-sm text-slate-500">
        Augšupielādē Jobalots Excel manifestu un publisko paletes URL — sistēma
        izveidos paleti, importēs produktus un (vēlāk) palaidīs AI bagātinājumu.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-4 grid max-w-3xl grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4"
      >
        <Field label="Excel fails (.xlsx)">
          <input
            ref={fileInput}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={onFileChange}
            className="block w-full text-sm"
          />
          {fileName && <div className="mt-1 text-xs text-slate-500">{fileName}</div>}
          {parsedPreview && (
            <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              Atpazīts: <strong>{parsedPreview.rows.length}</strong> produkti ·
              Manifest SKU <span className="font-mono">{parsedPreview.manifestSku}</span> ·
              Total RRP{" "}
              <strong className="tabular">
                {parsedPreview.totalReferencePrice.toFixed(2)}{" "}
                {parsedPreview.currency}
              </strong>
              {parsedPreview.errors.length > 0 && (
                <span className="ml-2 text-amber-700">
                  ({parsedPreview.errors.length} brīdinājumi)
                </span>
              )}
            </div>
          )}
        </Field>

        <Field label="Paletes nosaukums">
          <input
            type="text"
            value={palletName}
            onChange={(e) => setPalletName(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="piem. YELLOW30026 — LED mirrors & lighting"
          />
        </Field>

        <Field label="Jobalots publiska URL (paletes lapa)">
          <input
            type="url"
            value={jobalotsUrl}
            onChange={(e) => setJobalotsUrl(e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm ${
              urlOk ? "border-slate-300" : "border-red-400"
            }`}
            placeholder="https://jobalots.com/en/products/YELLOW30026..."
          />
          {!urlOk && (
            <p className="mt-1 text-xs text-red-700">
              URL jābūt formātā <code>https://jobalots.com/en/products/…</code>
            </p>
          )}
          {lookupLoading && (
            <p className="mt-1 text-[11px] text-slate-500">
              Lasa no Jobalots…
            </p>
          )}
          {lookupError && (
            <p className="mt-1 text-[11px] text-amber-700">
              Lookup neizdevās: {lookupError} (vari turpināt manuāli)
            </p>
          )}
          {lookup && (
            <div className="mt-2 flex gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3">
              {lookup.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lookup.coverImage}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded object-cover ring-1 ring-emerald-200"
                />
              )}
              <div className="min-w-0 text-xs text-emerald-900">
                <div className="truncate font-medium">{lookup.title || lookup.manifestSku}</div>
                <div className="mt-0.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
                  {lookup.latestBidPrice != null && (
                    <span>
                      Iegādes (latest bid):{" "}
                      <strong className="tabular">
                        {lookup.latestBidPrice.toFixed(2)} {lookup.currency || "EUR"}
                      </strong>
                      {lookup.isWinner && (
                        <span className="ml-1 rounded-full bg-emerald-200 px-1.5 py-0 text-[9px] font-semibold uppercase text-emerald-900">
                          Win
                        </span>
                      )}
                    </span>
                  )}
                  {lookup.rrp != null && (
                    <span>
                      Total RRP:{" "}
                      <strong className="tabular">{lookup.rrp.toFixed(2)}</strong>
                    </span>
                  )}
                  {lookup.location && <span>Location: {lookup.location}</span>}
                  {lookup.weightKg != null && (
                    <span>Weight: {lookup.weightKg} kg</span>
                  )}
                  {lookup.condition && <span>Condition: {lookup.condition}</span>}
                  {lookup.reservePrice != null && (
                    <span>Reserve: {lookup.reservePrice.toFixed(2)}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </Field>

        <Field label="Iegādes summa (EUR) — opcionāli">
          <input
            type="text"
            value={purchasePriceStr}
            onChange={(e) => setPurchasePriceStr(e.target.value)}
            className="w-48 rounded-md border border-slate-300 px-3 py-2 text-sm tabular"
            placeholder="piem. 242.43"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Ja zini, ievadi manuāli. Vēlāk Jobalots fetcher pārrakstīs šo lauku automātiski.
          </p>
        </Field>

        <Field label="Avots">
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-48 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {error}
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={busy || !parsedPreview}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:bg-slate-400"
          >
            {busy ? "Importē…" : "Importēt manifestu"}
          </button>
        </div>
      </form>

      {summary && palletId && (
        <div className="mt-4 max-w-3xl space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm font-semibold text-emerald-900">
            Imports veiksmīgs — palete izveidota
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <Dt>Manifest SKU</Dt>
            <Dd mono>{summary.manifestSku}</Dd>
            <Dt>Paletes nosaukums</Dt>
            <Dd>{summary.palletName}</Dd>
            <Dt>Fails</Dt>
            <Dd mono>{summary.fileName}</Dd>
            <Dt>Produkti importēti</Dt>
            <Dd tabular>{summary.importedCount}</Dd>
            <Dt>Trūkst datu</Dt>
            <Dd tabular>{summary.missingDataCount}</Dd>
            <Dt>Kļūdas</Dt>
            <Dd tabular>{summary.errorCount}</Dd>
            <Dt>Total RRP</Dt>
            <Dd tabular>
              {summary.totalReferencePrice.toFixed(2)} {summary.currency}
            </Dd>
          </dl>
          {summary.errors.length > 0 && (
            <details className="text-xs text-slate-700">
              <summary>Brīdinājumi ({summary.errors.length})</summary>
              <ul className="mt-2 max-h-40 list-inside list-disc overflow-auto rounded-md bg-white p-2">
                {summary.errors.map((e, i) => (
                  <li key={i}>
                    Rinda {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <div className="flex gap-2 pt-2">
            <Link
              href={`/skirosana/${palletId}`}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
            >
              Atvērt Šķirošanā
            </Link>
            <button
              type="button"
              onClick={() => {
                setSummary(null);
                setPalletId(null);
                setParsedPreview(null);
                setFileName(null);
                setPalletName("");
                setJobalotsUrl("");
                setPurchasePriceStr("");
                if (fileInput.current) fileInput.current.value = "";
              }}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs"
            >
              Importēt vēl vienu
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// List of imported manifests (cards)
// ---------------------------------------------------------------------------

interface ManifestCardData {
  pallet: Pallet;
  productCount: number;
  soldCount: number;
  soldRevenue: number;
  inStoreCount: number;
  notListedCount: number;
  disposedCount: number;
  totalFinalPrice: number;
}

function ManifestList() {
  const [data, setData] = useState<ManifestCardData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const pallets = await listPallets();
        const productsPerPallet = await Promise.all(
          pallets.map((p) => listProducts({ palletId: p.id }))
        );
        const cards: ManifestCardData[] = pallets.map((p, i) =>
          buildCardData(p, productsPerPallet[i] || [])
        );
        setData(cards);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Neizdevās ielādēt");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <section className="text-sm text-slate-500">Ielāde…</section>;
  if (error) {
    return (
      <section className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        {error}
      </section>
    );
  }
  if (!data || data.length === 0) {
    return (
      <section className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Vēl nav neviena importēta manifesta.
      </section>
    );
  }
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Importētie manifesti</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data.map((c) => (
          <ManifestCard key={c.pallet.id} data={c} />
        ))}
      </div>
    </section>
  );
}

function buildCardData(pallet: Pallet, products: Product[]): ManifestCardData {
  let soldCount = 0;
  let soldRevenue = 0;
  let inStoreCount = 0;
  let notListedCount = 0;
  let disposedCount = 0;
  let totalFinalPrice = 0;
  for (const p of products) {
    if (p.finalPrice) totalFinalPrice += p.finalPrice;
    switch (p.listingStatus) {
      case "sold":
        soldCount++;
        if (p.soldPrice) soldRevenue += p.soldPrice;
        break;
      case "listed_in_store":
        inStoreCount++;
        break;
      case "disposed":
        disposedCount++;
        break;
      case "not_listed":
      case "listing_approved":
        notListedCount++;
        break;
    }
  }
  return {
    pallet,
    productCount: products.length,
    soldCount,
    soldRevenue,
    inStoreCount,
    notListedCount,
    disposedCount,
    totalFinalPrice,
  };
}

function ManifestCard({ data }: { data: ManifestCardData }) {
  const { pallet } = data;
  // Predicted profit heuristic: 50% of the planned selling-prices sum.
  const predictedProfit = data.totalFinalPrice * 0.5;
  // Actual realised P&L = soldRevenue − purchasePrice (when known).
  const realisedPnL =
    pallet.purchasePrice != null
      ? data.soldRevenue - pallet.purchasePrice
      : null;
  const purchaseRecovered =
    pallet.purchasePrice != null && pallet.purchasePrice > 0
      ? data.soldRevenue / pallet.purchasePrice
      : null;
  return (
    <article className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/skirosana/${pallet.id}`}
            className="block truncate text-sm font-semibold text-slate-900 hover:underline"
          >
            {pallet.name}
          </Link>
          <div className="text-xs text-slate-500">
            <span className="font-mono">{pallet.manifestSku}</span>
            {pallet.source && ` · ${pallet.source}`}
          </div>
        </div>
        {pallet.jobalotsUrl && (
          <a
            href={pallet.jobalotsUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-md border border-slate-300 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-50"
          >
            Jobalots ↗
          </a>
        )}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-y-1 text-xs">
        <Dt>Iegādes summa</Dt>
        <Dd tabular>
          {pallet.purchasePrice != null
            ? `${pallet.purchasePrice.toFixed(2)} ${pallet.currency}`
            : "—"}
        </Dd>
        <Dt>Total RRP</Dt>
        <Dd tabular>
          {pallet.totalReferencePrice.toFixed(2)} {pallet.currency}
        </Dd>
        <Dt>Plānotā cenu summa</Dt>
        <Dd tabular>
          {data.totalFinalPrice.toFixed(2)} {pallet.currency}
        </Dd>
        <Dt>Prognozētā peļņa (50%)</Dt>
        <Dd tabular className="font-semibold text-emerald-700">
          {predictedProfit.toFixed(2)} {pallet.currency}
        </Dd>
      </dl>

      <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-700">
        Pārdotas <strong className="tabular">{data.soldCount}</strong> gab., ietirgots{" "}
        <strong className="tabular">{data.soldRevenue.toFixed(2)}</strong>{" "}
        {pallet.currency}
        {realisedPnL != null && data.soldCount > 0 && (
          <span
            className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              realisedPnL >= 0
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-800"
            }`}
            title={
              purchaseRecovered != null
                ? `Atpelnīts ${(purchaseRecovered * 100).toFixed(0)}% no iegādes`
                : ""
            }
          >
            {realisedPnL >= 0 ? "+" : ""}
            {realisedPnL.toFixed(2)} {pallet.currency}
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5">
        <FilterPill
          href={`/skirosana/${pallet.id}?listing=listed_in_store`}
          label="Veikalā"
          count={data.inStoreCount}
          tone="emerald"
        />
        <FilterPill
          href={`/skirosana/${pallet.id}?listing=not_listed`}
          label="Nav veikalā"
          count={data.notListedCount}
          tone="slate"
        />
        <FilterPill
          href={`/skirosana/${pallet.id}?listing=sold`}
          label="Pārdotās"
          count={data.soldCount}
          tone="blue"
        />
        <FilterPill
          href={`/skirosana/${pallet.id}?listing=disposed`}
          label="Utilizētās"
          count={data.disposedCount}
          tone="red"
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span>{data.productCount} produkti</span>
        <Link
          href={`/skirosana/${pallet.id}`}
          className="font-medium text-slate-900 hover:underline"
        >
          Atvērt →
        </Link>
      </div>
    </article>
  );
}

function FilterPill({
  href,
  label,
  count,
  tone,
}: {
  href: string;
  label: string;
  count: number;
  tone: "emerald" | "slate" | "blue" | "red";
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
      : tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100"
      : tone === "red"
      ? "border-red-200 bg-red-50 text-red-800 hover:bg-red-100"
      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100";
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-md border px-2 py-1 text-[11px] ${cls}`}
    >
      <span>{label}</span>
      <span className="tabular font-semibold">{count}</span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Dt({ children }: { children: React.ReactNode }) {
  return <dt className="text-slate-500">{children}</dt>;
}

function Dd({
  children,
  mono,
  tabular,
  className,
}: {
  children: React.ReactNode;
  mono?: boolean;
  tabular?: boolean;
  className?: string;
}) {
  return (
    <dd
      className={[
        "text-slate-900",
        mono ? "font-mono text-[11px]" : "",
        tabular ? "tabular" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </dd>
  );
}
