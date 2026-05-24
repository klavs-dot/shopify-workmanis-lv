"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Package,
  Layers,
  CheckSquare,
  Trash2,
  LogOut,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLE_BADGE_CLASS, ROLE_LABEL, hasPermission } from "@/lib/auth/roles";
import { RobotLogo } from "@/components/RobotLogo";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  visible?: () => boolean;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { appUser, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? "/";

  const items: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/manifesti",
      label: "Manifesti",
      icon: FileSpreadsheet,
      visible: () => hasPermission(appUser?.role, "importManifest"),
    },
    { href: "/skirosana", label: "Šķirošana", icon: Layers },
    { href: "/products", label: "Produkti", icon: Package },
    {
      href: "/approval",
      label: "Approval",
      icon: CheckSquare,
      visible: () =>
        hasPermission(appUser?.role, "approveProducts") || appUser?.role === "WAREHOUSE",
    },
    { href: "/utilizetas", label: "Utilizētās preces", icon: Trash2 },
  ];

  const visibleItems = items.filter((i) => (i.visible ? i.visible() : true));

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="border-b border-slate-200 p-4">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-3 text-center"
          >
            <RobotLogo className="h-28 w-28" />
            <div>
              <div className="text-2xl font-extrabold tracking-tight text-slate-900">
                WORKMANIS
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                Shopify Pallet Operations
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          {visibleItems.map((it) => {
            const active = pathname === it.href || pathname.startsWith(it.href + "/");
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          {appUser && (
            <div className="mb-2 space-y-1">
              <div className="truncate text-xs font-medium text-slate-900">
                {appUser.displayName || appUser.email}
              </div>
              <div className="truncate text-[11px] text-slate-500">{appUser.email}</div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                  ROLE_BADGE_CLASS[appUser.role]
                }`}
              >
                {ROLE_LABEL[appUser.role]}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.push("/login");
            }}
            className="flex w-full items-center gap-2 rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            Iziet
          </button>
          {appUser?.role === "MASTER" && (
            <Link
              href="/masteradmin"
              className="mt-2 flex items-center gap-2 rounded-md border border-purple-200 bg-purple-50 px-2 py-1.5 text-xs text-purple-800 hover:bg-purple-100"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              MasterAdmin
            </Link>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <RobotLogo className="h-12 w-12 shrink-0" />
              <div className="leading-tight">
                <div className="text-lg font-extrabold tracking-tight text-slate-900">
                  WORKMANIS
                </div>
                <div className="text-[10px] text-slate-500">
                  Shopify Pallet Operations
                </div>
              </div>
            </Link>
            {appUser && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                  ROLE_BADGE_CLASS[appUser.role]
                }`}
              >
                {ROLE_LABEL[appUser.role]}
              </span>
            )}
          </div>
          <nav className="mt-2 flex gap-1 overflow-x-auto">
            {visibleItems.map((it) => {
              const active = pathname === it.href || pathname.startsWith(it.href + "/");
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`shrink-0 rounded-md px-3 py-1.5 text-xs ${
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
