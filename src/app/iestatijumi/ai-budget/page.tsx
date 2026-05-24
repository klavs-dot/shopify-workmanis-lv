"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  DEFAULT_DAILY_CAP_USD,
  getAiBudgetConfig,
  getTodaySpend,
  setAiBudgetConfig,
} from "@/lib/firestore/aiBudget";
import { DEFAULT_PRICE_PER_M_TOKENS } from "@/lib/ai/pricing";
import type { AiBudgetConfig, AiCostStats } from "@/lib/types";

export default function AiBudgetPage() {
  return (
    <RequireRole allow={["MASTER", "ADMIN"]}>
      <AppShell>
        <Content />
      </AppShell>
    </RequireRole>
  );
}

function Content() {
  const { appUser } = useAuth();
  const isMaster = appUser?.role === "MASTER";

  const [config, setConfig] = useState<AiBudgetConfig | null>(null);
  const [stats, setStats] = useState<AiCostStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Editable form state
  const [capStr, setCapStr] = useState<string>(String(DEFAULT_DAILY_CAP_USD));
  const [priceInputStr, setPriceInputStr] = useState<string>(
    String(DEFAULT_PRICE_PER_M_TOKENS.input)
  );
  const [priceOutputStr, setPriceOutputStr] = useState<string>(
    String(DEFAULT_PRICE_PER_M_TOKENS.output)
  );

  useEffect(() => {
    (async () => {
      try {
        const [c, s] = await Promise.all([getAiBudgetConfig(), getTodaySpend()]);
        setConfig(c);
        setStats(s);
        setCapStr(String(c.dailyCapUsd ?? DEFAULT_DAILY_CAP_USD));
        if (c.pricePerInputUsd != null)
          setPriceInputStr(String(c.pricePerInputUsd));
        if (c.pricePerOutputUsd != null)
          setPriceOutputStr(String(c.pricePerOutputUsd));
      } catch (err) {
        setToast(err instanceof Error ? err.message : "Neizdevās ielādēt");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cap = config?.dailyCapUsd ?? DEFAULT_DAILY_CAP_USD;
  const spent = stats?.totalCostUsd ?? 0;
  const remaining = Math.max(0, cap - spent);
  const pct = cap > 0 ? Math.min(100, (spent / cap) * 100) : 0;
  const overBudget = spent >= cap;
  const nearLimit = pct >= 80 && !overBudget;

  const save = async () => {
    if (!appUser) return;
    const newCap = parseFloat(capStr.replace(",", "."));
    if (!Number.isFinite(newCap) || newCap < 0) {
      setToast("Limita formāts nav derīgs (skaitlis ≥ 0)");
      return;
    }
    const inP = parseFloat(priceInputStr.replace(",", "."));
    const outP = parseFloat(priceOutputStr.replace(",", "."));
    setSaving(true);
    setToast(null);
    try {
      await setAiBudgetConfig(
        {
          dailyCapUsd: newCap,
          pricePerInputUsd: Number.isFinite(inP) ? inP : undefined,
          pricePerOutputUsd: Number.isFinite(outP) ? outP : undefined,
        },
        appUser.uid
      );
      const c = await getAiBudgetConfig();
      setConfig(c);
      setToast("Saglabāts ✓");
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Neizdevās saglabāt");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-slate-500">Ielāde…</div>;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/iestatijumi"
          className="text-xs text-slate-500 underline-offset-2 hover:underline"
        >
          ← Atpakaļ uz Iestatījumiem
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">AI budžets</h1>
        <p className="text-sm text-slate-500">
          Claude Opus 4.7 enrichment dienas tēriņi. Ja sasniedz limitu, jauni
          enrichment pieprasījumi tiek atteikti līdz pusnaktij (Eiropas/Rīgas
          laiks).
        </p>
      </div>

      <section
        className={`rounded-lg border-2 p-4 ${
          overBudget
            ? "border-red-300 bg-red-50"
            : nearLimit
            ? "border-amber-300 bg-amber-50"
            : "border-emerald-200 bg-emerald-50"
        }`}
      >
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-sm font-medium text-slate-700">
            Šodien iztērēts
          </div>
          <div className="tabular text-2xl font-extrabold text-slate-900">
            ${spent.toFixed(2)}{" "}
            <span className="text-sm font-normal text-slate-500">
              / ${cap.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-white">
          <div
            className={`h-full rounded-full transition-all ${
              overBudget
                ? "bg-red-500"
                : nearLimit
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-2 text-xs text-slate-700">
          {overBudget ? (
            <span className="font-medium text-red-800">
              ⛔ Limits sasniegts. Jauni AI pieprasījumi tiek atteikti.
            </span>
          ) : (
            <>
              Atlikuši{" "}
              <strong className="tabular">${remaining.toFixed(2)}</strong> šodien.
            </>
          )}
        </div>

        {stats && (
          <dl className="mt-3 grid grid-cols-2 gap-y-1 text-xs text-slate-600 sm:grid-cols-4">
            <dt>Produktu skaits</dt>
            <dd className="tabular text-slate-900">{stats.productCount}</dd>
            <dt>Input tokens</dt>
            <dd className="tabular text-slate-900">
              {stats.inputTokens.toLocaleString("lv-LV")}
            </dd>
            <dt>Output tokens</dt>
            <dd className="tabular text-slate-900">
              {stats.outputTokens.toLocaleString("lv-LV")}
            </dd>
            <dt>Cache read</dt>
            <dd className="tabular text-slate-900">
              {stats.cacheReadInputTokens.toLocaleString("lv-LV")}
            </dd>
          </dl>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Konfigurācija</h2>
        {!isMaster && (
          <p className="mt-1 text-xs text-amber-700">
            Konfigurāciju var mainīt tikai MASTER lietotājs.
          </p>
        )}

        <div className="mt-3 space-y-3">
          <Field label="Dienas limits (USD)">
            <input
              type="text"
              value={capStr}
              onChange={(e) => setCapStr(e.target.value)}
              disabled={!isMaster}
              className="w-48 rounded-md border border-slate-300 px-3 py-1.5 text-sm tabular disabled:bg-slate-50 disabled:text-slate-500"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Default 50 USD. Sasniedzot šo, enrich-pallet un enrich-product
              endpoints atgriezīs 429 kļūdu.
            </p>
          </Field>

          <details className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <summary className="cursor-pointer text-xs font-medium text-slate-700">
              Cenu override (advanced)
            </summary>
            <p className="mt-2 text-[11px] text-slate-500">
              Default: input ${DEFAULT_PRICE_PER_M_TOKENS.input} /M, output $
              {DEFAULT_PRICE_PER_M_TOKENS.output} /M. Maini, ja Anthropic
              pārveidos cenas (pārbaudi www.anthropic.com/pricing).
            </p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Field label="Input USD / 1M tokens">
                <input
                  type="text"
                  value={priceInputStr}
                  onChange={(e) => setPriceInputStr(e.target.value)}
                  disabled={!isMaster}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm tabular disabled:bg-slate-50"
                />
              </Field>
              <Field label="Output USD / 1M tokens">
                <input
                  type="text"
                  value={priceOutputStr}
                  onChange={(e) => setPriceOutputStr(e.target.value)}
                  disabled={!isMaster}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm tabular disabled:bg-slate-50"
                />
              </Field>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              Cache create/read cenas automātiski tiek aprēķinātas no input
              (×1.25 un ×0.10).
            </p>
          </details>

          {isMaster && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? "Saglabā…" : "Saglabāt"}
              </button>
              {toast && (
                <span className="text-xs text-slate-700">{toast}</span>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
