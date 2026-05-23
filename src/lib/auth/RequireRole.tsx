"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

import { useAuth } from "@/lib/auth/AuthProvider";
import type { UserRole } from "@/lib/types";

interface RequireRoleProps {
  allow: UserRole[];
  children: React.ReactNode;
  /** If true, do not auto-redirect; render fallback inline instead. */
  inline?: boolean;
  fallback?: React.ReactNode;
}

export function RequireRole({ allow, children, inline = false, fallback }: RequireRoleProps) {
  const { loading, firebaseUser, appUser, configured } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || inline) return;
    if (!configured) return;
    if (!firebaseUser) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
  }, [loading, firebaseUser, configured, inline, pathname, router]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        Ielāde…
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Firebase nav konfigurēts.</strong> Aizpildi <code>.env.local</code>
        {" "}(skat <code>.env.example</code>) un pārstartē <code>npm run dev</code>.
      </div>
    );
  }

  if (!firebaseUser || !appUser) {
    return fallback ?? null;
  }

  if (!allow.includes(appUser.role)) {
    return (
      fallback ?? (
        <div className="rounded-md border border-red-300 bg-red-50 p-6 text-sm text-red-900">
          <strong>Access denied.</strong> Šī sadaļa ir pieejama tikai šādām lomām:{" "}
          {allow.join(", ")}. Tava loma ir <code>{appUser.role}</code>.
        </div>
      )
    );
  }

  return <>{children}</>;
}
