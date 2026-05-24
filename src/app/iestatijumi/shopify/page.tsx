"use client";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";

export default function ShopifySettingsPage() {
  return (
    <RequireRole allow={["MASTER"]}>
      <AppShell>
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Shopify savienojums</h1>
            <p className="text-sm text-slate-500">
              Šeit būs Shopify Admin API konfigurācija — OAuth, store domēns, webhook receivers.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-sm font-medium text-slate-700">Shopify integration</div>
            <p className="mt-1 text-xs text-slate-500">
              Posms 6 (vēl nav iebūvēts). Skat. <code>docs/obsidian/07_Shopify_Integration_Future.md</code>.
            </p>
            <button
              type="button"
              disabled
              className="mt-3 cursor-not-allowed rounded-md bg-slate-200 px-3 py-1.5 text-xs text-slate-500"
            >
              Connect Shopify
            </button>
          </div>
        </div>
      </AppShell>
    </RequireRole>
  );
}
