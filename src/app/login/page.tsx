"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/lib/auth/AuthProvider";

function LoginInner() {
  const { signIn, firebaseUser, loading, configured } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && firebaseUser) router.replace(next);
  }, [loading, firebaseUser, next, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login neizdevās");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">shopify.workmanis.lv</h1>
          <p className="mt-1 text-xs text-slate-500">
            Atsevišķa palešu / Shopify sagatavošanas sistēma.
            <br />
            <strong className="text-slate-700">NAV</strong> Workmanis.lv projekts.
          </p>
        </div>

        {!configured && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            Firebase nav konfigurēts. Aizpildi <code>.env.local</code> (skat{" "}
            <code>.env.example</code>) un pārstartē <code>npm run dev</code>.
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700">E-pasts</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              placeholder="vards@workmanis.lv"
              disabled={!configured || submitting}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">Parole</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              disabled={!configured || submitting}
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!configured || submitting}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:bg-slate-400"
          >
            {submitting ? "Ieiet…" : "Ieiet"}
          </button>
        </form>

        <p className="text-[11px] text-slate-400">
          Pirmā MASTER lietotāja izveide: skat docs/obsidian/03_Authentication_And_Roles.md
          un palaisi <code>npm run seed:master</code>.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
