"use client";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";

export default function SettingsPage() {
  return (
    <RequireRole allow={["MASTER"]}>
      <AppShell>
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Sistēmas iestatījumi</h1>
            <p className="text-sm text-slate-500">
              Šeit nākotnē — Shopify savienojums, AI iestatījumi, izmaksu koeficienti.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-sm font-medium text-slate-700">Shopify integration</div>
            <p className="mt-1 text-xs text-slate-500">Shopify integration coming later.</p>
            <button
              type="button"
              disabled
              className="mt-3 cursor-not-allowed rounded-md bg-slate-200 px-3 py-1.5 text-xs text-slate-500"
            >
              Connect Shopify
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-sm font-medium text-slate-700">AI enrichment</div>
            <p className="mt-1 text-xs text-slate-500">AI enrichment coming later.</p>
          </div>
        </div>
      </AppShell>
    </RequireRole>
  );
}
