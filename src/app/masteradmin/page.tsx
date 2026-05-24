"use client";

import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";

export default function MasterAdminHome() {
  return (
    <RequireRole allow={["MASTER"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">MasterAdmin</h1>
            <p className="text-sm text-slate-500">
              Slēpta sadaļa — tikai MASTER lomai. Šis ceļš nav redzams parastajā navigācijā.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Card href="/masteradmin/users" title="Lietotāji" desc="Skats, izveide, lomas, statuss." />
            <Card href="/masteradmin/users/new" title="Izveidot lietotāju" desc="Pievienot jaunu lietotāju." />
            <Card href="/darbibu-vesture" title="Darbību vēsture" desc="Visu darbību ieraksti (pēdējie 6 mēneši)." />
            <Card href="/masteradmin/settings" title="Sistēmas iestatījumi" desc="Konfigurācija, Shopify (vēlāk)." />
          </div>
        </div>
      </AppShell>
    </RequireRole>
  );
}

function Card({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
    >
      <div className="font-medium text-slate-900">{title}</div>
      <div className="text-xs text-slate-500">{desc}</div>
    </Link>
  );
}
