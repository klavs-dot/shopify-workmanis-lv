"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { useAuth } from "@/lib/auth/AuthProvider";
import { listPallets, markPalletReceived } from "@/lib/firestore/pallets";
import { logAudit } from "@/lib/firestore/audit";
import { hasPermission } from "@/lib/auth/roles";
import type { Pallet } from "@/lib/types";

export default function LogistikaPage() {
  return (
    <RequireRole allow={["MASTER", "ADMIN", "WAREHOUSE", "VIEWER"]}>
      <AppShell>
        <LogistikaContent />
      </AppShell>
    </RequireRole>
  );
}

function LogistikaContent() {
  const { appUser } = useAuth();
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const canReceive = hasPermission(appUser?.role, "receivePallets");

  const refresh = async () => {
    setLoading(true);
    try {
      const all = await listPallets();
      setPallets(all.filter((p) => p.status === "in_transit"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neizdevās ielādēt");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const receive = async (pallet: Pallet) => {
    if (!appUser) return;
    setBusyId(pallet.id);
    try {
      await markPalletReceived(pallet.id);
      await logAudit({
        userId: appUser.uid,
        userEmail: appUser.email,
        action: "pallet_received",
        entityType: "pallet",
        entityId: pallet.id,
        before: { status: "in_transit" },
        after: { status: "imported" },
      });
      setToast(`Palete ${pallet.manifestSku} nosūtīta uz Šķirošanu ✓`);
      await refresh();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Loģistika</h1>
          <p className="text-sm text-slate-500">
            Importētie manifesti, kuru paletes vēl nav fiziski saņemtas noliktavā.
          </p>
        </div>
        {toast && (
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-800">
            {toast}
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Ielāde…</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : pallets.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Pašlaik nav neviena manifesta ceļā. Visas paletes saņemtas. 🎉
          {" "}
          <Link
            href="/manifesti"
            className="font-medium text-slate-900 underline-offset-2 hover:underline"
          >
            Importēt jaunu manifestu →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {pallets.map((p) => (
            <article
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{p.name}</span>
                  <span className="inline-flex items-center rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900">
                    🚚 Ceļā, gaidām piegādi!
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  Manifest SKU <span className="font-mono">{p.manifestSku}</span>
                  {p.source && ` · ${p.source}`}
                  {" · "}
                  {p.totalProducts} produkti
                  {" · "}
                  Total RRP{" "}
                  <span className="tabular">{p.totalReferencePrice.toFixed(2)}</span>{" "}
                  {p.currency}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  {p.purchasePrice != null && (
                    <>
                      Iegādes summa:{" "}
                      <span className="tabular">{p.purchasePrice.toFixed(2)}</span>{" "}
                      {p.currency}
                    </>
                  )}
                  {p.location && <> · No: {p.location}</>}
                  {p.weightKg != null && <> · {p.weightKg} kg</>}
                  {p.palletCondition && <> · {p.palletCondition}</>}
                  {p.createdAt?.toDate && (
                    <>
                      {" · "}
                      Importēta{" "}
                      {p.createdAt.toDate().toLocaleDateString("lv-LV", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {p.jobalotsUrl && (
                  <a
                    href={p.jobalotsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-amber-100"
                  >
                    Jobalots ↗
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => receive(p)}
                  disabled={!canReceive || busyId === p.id}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:bg-slate-300"
                >
                  {busyId === p.id
                    ? "Sūta…"
                    : "✓ Saņemts! Nosūtīt uz Šķirošanu!"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!canReceive && pallets.length > 0 && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600">
          Tava loma ir tikai-skatīšanās. Lai apstiprinātu saņemšanu, vajadzīga MASTER, ADMIN vai WAREHOUSE loma.
        </div>
      )}
    </div>
  );
}
