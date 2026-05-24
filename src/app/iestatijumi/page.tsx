"use client";

import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function IestatijumiHome() {
  return (
    <RequireRole allow={["MASTER", "ADMIN"]}>
      <AppShell>
        <IestatijumiContent />
      </AppShell>
    </RequireRole>
  );
}

function IestatijumiContent() {
  const { appUser } = useAuth();
  const isMaster = appUser?.role === "MASTER";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Iestatījumi</h1>
        <p className="text-sm text-slate-500">
          {isMaster
            ? "Lietotāju pārvalde, Shopify savienojums un sistēmas konfigurācija."
            : "Šeit vari pievienot Warehouse darbiniekus un apskatīt esošos."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card
          href="/iestatijumi/lietotaji"
          title="Lietotāji"
          desc={
            isMaster
              ? "Visu lietotāju saraksts. Pievienot Admin, Warehouse, Viewer."
              : "Warehouse darbinieki. Pievienot jaunu."
          }
        />
        <Card
          href="/iestatijumi/lietotaji/jauns"
          title="Pievienot lietotāju"
          desc={
            isMaster
              ? "Izveidot Admin, Warehouse vai Viewer."
              : "Izveidot Warehouse darbinieku."
          }
        />
        <Card
          href="/iestatijumi/ai-budget"
          title="AI budžets"
          desc="Šodienas tēriņi + dienas limits (Claude Opus 4.7 enrichment)."
        />
        {isMaster && (
          <>
            <Card
              href="/iestatijumi/shopify"
              title="Shopify savienojums"
              desc="Pievienot vai pārvaldīt Shopify Admin API piekļuvi."
            />
            <Card
              href="/darbibu-vesture"
              title="Darbību vēsture"
              desc="Visu lietotāju darbības (pēdējie 6 mēneši)."
            />
          </>
        )}
      </div>
    </div>
  );
}

function Card({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
    >
      <div className="font-medium text-slate-900">{title}</div>
      <div className="mt-0.5 text-xs text-slate-500">{desc}</div>
    </Link>
  );
}
