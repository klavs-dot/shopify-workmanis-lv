"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { useAuth } from "@/lib/auth/AuthProvider";
import { parseManifestWorkbook, buildImportSummary } from "@/lib/manifest";
import { createPallet } from "@/lib/firestore/pallets";
import { bulkInsertProductsForPallet } from "@/lib/firestore/products";
import { logAudit } from "@/lib/firestore/audit";
import type { ImportSummary } from "@/lib/types";

export default function ImportPage() {
  return (
    <RequireRole allow={["MASTER", "ADMIN"]}>
      <AppShell>
        <ImportContent />
      </AppShell>
    </RequireRole>
  );
}

function ImportContent() {
  const { appUser } = useAuth();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [palletName, setPalletName] = useState("");
  const [source, setSource] = useState("Jobalots");
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [palletId, setPalletId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFileName(f?.name ?? null);
    if (f && !palletName) {
      setPalletName(f.name.replace(/\.[^.]+$/, ""));
    }
    setSummary(null);
    setPalletId(null);
    setError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser) return;
    const f = fileInput.current?.files?.[0];
    if (!f) {
      setError("Izvēlies Excel failu.");
      return;
    }
    setBusy(true);
    setError(null);
    setSummary(null);
    try {
      const buf = await f.arrayBuffer();
      const parsed = parseManifestWorkbook(buf);
      if (parsed.rows.length === 0) {
        throw new Error(
          parsed.errors[0]?.message || "Failā neizdevās atrast nevienu derīgu rindu."
        );
      }
      const newPalletId = await createPallet({
        manifestSku: parsed.manifestSku,
        name: palletName || parsed.manifestSku,
        source,
        originalFileName: f.name,
        totalProducts: parsed.rows.length,
        totalReferencePrice: parsed.totalReferencePrice,
        currency: parsed.currency,
        createdBy: appUser.uid,
      });
      const { inserted } = await bulkInsertProductsForPallet(newPalletId, parsed.rows);
      const missingData = parsed.rows.filter(
        (r) => !r.title || r.referencePrice === 0
      ).length;
      const sum = buildImportSummary(
        parsed,
        inserted,
        0,
        missingData,
        f.name,
        palletName || parsed.manifestSku
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
          fileName: f.name,
          manifestSku: parsed.manifestSku,
          imported: inserted,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Imports neizdevās");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Manifest imports</h1>
        <p className="text-sm text-slate-500">
          Augšupielādē Excel manifestu — sistēma izlasīs darblapu &quot;Worksheet&quot; (vai pirmo
          pieejamo) un izveidos jaunu paleti ar produktu rindām.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="grid max-w-2xl grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4"
      >
        <label className="block">
          <span className="text-xs font-medium text-slate-700">Paletes nosaukums</span>
          <input
            type="text"
            value={palletName}
            onChange={(e) => setPalletName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="piem. RED19276 — Jobalots mix"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-700">Avots</span>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Jobalots"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-700">Excel fails (.xlsx)</span>
          <input
            ref={fileInput}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={onFileChange}
            className="mt-1 block w-full text-sm"
          />
          {fileName && <div className="mt-1 text-xs text-slate-500">{fileName}</div>}
        </label>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {error}
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:bg-slate-400"
          >
            {busy ? "Importē…" : "Importēt"}
          </button>
        </div>
      </form>

      {summary && palletId && (
        <div className="max-w-2xl space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm font-semibold text-emerald-900">
            Imports veiksmīgs
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-slate-600">Manifest SKU</dt>
            <dd className="font-mono">{summary.manifestSku}</dd>
            <dt className="text-slate-600">Paletes nosaukums</dt>
            <dd>{summary.palletName}</dd>
            <dt className="text-slate-600">Fails</dt>
            <dd className="font-mono text-xs">{summary.fileName}</dd>
            <dt className="text-slate-600">Rindas failā</dt>
            <dd className="tabular">{summary.totalRows}</dd>
            <dt className="text-slate-600">Importēti produkti</dt>
            <dd className="tabular">{summary.importedCount}</dd>
            <dt className="text-slate-600">Trūkst datu</dt>
            <dd className="tabular">{summary.missingDataCount}</dd>
            <dt className="text-slate-600">Duplikāti</dt>
            <dd className="tabular">{summary.duplicateCount}</dd>
            <dt className="text-slate-600">Kļūdas</dt>
            <dd className="tabular">{summary.errorCount}</dd>
            <dt className="text-slate-600">Kopējais ref. cena</dt>
            <dd className="tabular">
              {summary.totalReferencePrice.toFixed(2)} {summary.currency}
            </dd>
          </dl>

          {summary.errors.length > 0 && (
            <details className="text-xs text-slate-700">
              <summary>Kļūdas ({summary.errors.length})</summary>
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
              href={`/pallets/${palletId}`}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
            >
              Atvērt paleti
            </Link>
            <Link
              href="/pallets"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs"
            >
              Uz visām paletēm
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
