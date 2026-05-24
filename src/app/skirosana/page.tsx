"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  listPallets,
  claimPalletForSorting,
  releasePalletSortingClaim,
} from "@/lib/firestore/pallets";
import { listProducts } from "@/lib/firestore/products";
import { Boxes } from "lucide-react";
import { logAudit } from "@/lib/firestore/audit";
import { PalletBadge } from "@/components/StatusBadge";
import type { Pallet, Product } from "@/lib/types";

interface Row {
  pallet: Pallet;
  total: number;
  unsorted: number; // not_listed + listing_approved (anything not yet on shelf)
}

export default function SkirosanaPage() {
  return (
    <RequireRole allow={["MASTER", "ADMIN", "WAREHOUSE", "VIEWER"]}>
      <AppShell>
        <SkirosanaList />
      </AppShell>
    </RequireRole>
  );
}

function SkirosanaList() {
  const { appUser } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const pallets = (await listPallets()).filter(
        (p) => p.status !== "in_transit"
      );
      const all = await Promise.all(pallets.map((p) => listProducts({ palletId: p.id })));
      setRows(pallets.map((p, i) => buildRow(p, all[i] || [])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neizdevās ielādēt");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const visible = useMemo(() => {
    if (!rows) return [];
    if (showAll) return rows;
    return rows.filter((r) => r.unsorted > 0);
  }, [rows, showAll]);

  const claim = async (pallet: Pallet) => {
    if (!appUser) return;
    setBusyId(pallet.id);
    try {
      await claimPalletForSorting(pallet.id, appUser);
      await logAudit({
        userId: appUser.uid,
        userEmail: appUser.email,
        action: "pallet_sorting_claimed",
        entityType: "pallet",
        entityId: pallet.id,
        after: {
          sortingClaimedBy: appUser.uid,
          sortingClaimedByName: appUser.displayName || appUser.email,
        },
      });
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setBusyId(null);
    }
  };

  const release = async (pallet: Pallet) => {
    if (!appUser) return;
    setBusyId(pallet.id);
    try {
      await releasePalletSortingClaim(pallet.id);
      await logAudit({
        userId: appUser.uid,
        userEmail: appUser.email,
        action: "pallet_sorting_released",
        entityType: "pallet",
        entityId: pallet.id,
        before: {
          sortingClaimedBy: pallet.sortingClaimedBy,
          sortingClaimedByName: pallet.sortingClaimedByName,
        },
      });
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Šķirošana</h1>
          <p className="text-sm text-slate-500">
            {showAll
              ? "Visi importētie manifesti, kas ir saņemti noliktavā."
              : "Manifesti, kuriem vēl ir nesašķiroti produkti."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs"
          >
            {showAll ? "Tikai nesašķirotos" : "Rādīt visus"}
          </button>
          <Link
            href="/manifesti"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
          >
            + Importēt manifestu
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Ielāde…</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
          {showAll
            ? "Vēl nav nevienas saņemtas paletes."
            : "Visi saņemtie manifesti jau ir sašķiroti. 🎉"}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((r) => (
            <PalletCard
              key={r.pallet.id}
              row={r}
              currentUid={appUser?.uid}
              isMaster={appUser?.role === "MASTER"}
              busy={busyId === r.pallet.id}
              onClaim={() => claim(r.pallet)}
              onRelease={() => release(r.pallet)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PalletCard({
  row,
  currentUid,
  isMaster,
  busy,
  onClaim,
  onRelease,
}: {
  row: Row;
  currentUid: string | undefined;
  isMaster: boolean;
  busy: boolean;
  onClaim: () => void;
  onRelease: () => void;
}) {
  const { pallet, total, unsorted } = row;
  const claimedByMe = !!currentUid && pallet.sortingClaimedBy === currentUid;
  const claimedBySomeone = !!pallet.sortingClaimedBy;
  const canOpen = claimedByMe || isMaster;
  // Pulse red if there are still unsorted products on this pallet — i.e.
  // anything that isn't yet listed_in_store / sold / out_of_stock / disposed.
  const pulse = unsorted > 0;

  // Card classes
  const baseClasses =
    "flex flex-col overflow-hidden rounded-lg border-2 bg-white shadow-sm transition";
  const stateClasses = pulse
    ? "pulse-red-ring"
    : "border-slate-200 hover:border-slate-300 hover:shadow";

  const CoverImage = (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
      {pallet.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pallet.coverImage}
          alt={`${pallet.name} cover`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
          <Boxes className="h-12 w-12" />
          <div className="mt-1 font-mono text-[10px]">{pallet.manifestSku}</div>
        </div>
      )}
      {/* Status badge floating over the image */}
      <div className="absolute right-2 top-2">
        <PalletBadge status={pallet.status} />
      </div>
      {pallet.jobalotsUrl && (
        <a
          href={pallet.jobalotsUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-700 shadow-sm hover:bg-white"
        >
          Jobalots ↗
        </a>
      )}
    </div>
  );

  const TitleBlock = (
    <div className="min-w-0">
      <div className="truncate text-sm font-semibold text-slate-900">
        {pallet.name}
      </div>
      <div className="text-xs text-slate-500">
        <span className="font-mono">{pallet.manifestSku}</span>
        {pallet.source && ` · ${pallet.source}`}
      </div>
    </div>
  );

  return (
    <article className={`${baseClasses} ${stateClasses}`}>
      {canOpen ? (
        <Link
          href={`/skirosana/${pallet.id}`}
          className="block hover:opacity-95"
        >
          {CoverImage}
        </Link>
      ) : (
        CoverImage
      )}

      <div className="flex flex-1 flex-col p-4">
        {canOpen ? (
          <Link
            href={`/skirosana/${pallet.id}`}
            className="block hover:opacity-95"
          >
            {TitleBlock}
          </Link>
        ) : (
          <div className="opacity-90">{TitleBlock}</div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <Stat label="Produkti" value={String(total)} />
          <Stat
            label="Nesašķirotie"
            value={String(unsorted)}
            tone={unsorted > 0 ? "amber" : "slate"}
          />
        </div>

      {/* Claim section */}
      <div className="mt-3 border-t border-slate-100 pt-3">
        {!claimedBySomeone ? (
          <button
            type="button"
            onClick={onClaim}
            disabled={busy}
            className="w-full rounded-md bg-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 disabled:bg-slate-300"
          >
            {busy ? "Paņem…" : "🙋 Paņemt uz šķirošanu"}
          </button>
        ) : (
          <div className="space-y-2">
            <div
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs ${
                claimedByMe
                  ? "bg-emerald-50 text-emerald-900"
                  : "bg-blue-50 text-blue-900"
              }`}
            >
              <Avatar name={pallet.sortingClaimedByName ?? "?"} />
              <div className="min-w-0">
                <div className="truncate font-semibold">
                  {claimedByMe ? "Šķiro: Tu" : `Šķiro: ${pallet.sortingClaimedByName}`}
                </div>
                {pallet.sortingClaimedAt?.toDate && (
                  <div className="text-[10px] opacity-70">
                    Paņemts{" "}
                    {pallet.sortingClaimedAt
                      .toDate()
                      .toLocaleString("lv-LV", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-1.5">
              {canOpen && (
                <Link
                  href={`/skirosana/${pallet.id}`}
                  className="flex-1 rounded-md bg-slate-900 px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-slate-800"
                >
                  Atvērt →
                </Link>
              )}
              {(claimedByMe || isMaster) && (
                <button
                  type="button"
                  onClick={onRelease}
                  disabled={busy}
                  className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  title={isMaster && !claimedByMe ? "MASTER override release" : "Atlaist claim"}
                >
                  {claimedByMe ? "Atlaist" : "↺"}
                </button>
              )}
              {!canOpen && (
                <div className="flex-1 rounded-md bg-slate-100 px-3 py-1.5 text-center text-xs text-slate-500">
                  🔒 Atvērt var tikai atbildīgais
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </article>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
      {initials || "?"}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "amber" | "slate";
}) {
  const cls =
    tone === "amber"
      ? "bg-amber-50 text-amber-900 border-amber-200"
      : "bg-slate-50 text-slate-700 border-slate-200";
  return (
    <div className={`rounded-md border px-2 py-1.5 ${cls}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="tabular text-sm font-semibold">{value}</div>
    </div>
  );
}

function buildRow(pallet: Pallet, products: Product[]): Row {
  let unsorted = 0;
  for (const p of products) {
    if (p.listingStatus === "not_listed" || p.listingStatus === "listing_approved") {
      unsorted++;
    }
  }
  return { pallet, total: products.length, unsorted };
}
