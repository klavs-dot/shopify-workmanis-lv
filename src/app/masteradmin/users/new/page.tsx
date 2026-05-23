"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { UserRole } from "@/lib/types";

export default function NewUserPage() {
  return (
    <RequireRole allow={["MASTER"]}>
      <AppShell>
        <NewUserForm />
      </AppShell>
    </RequireRole>
  );
}

function NewUserForm() {
  const { firebaseUser } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("WAREHOUSE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setSubmitting(true);
    setError(null);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, password, displayName, role }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Neizdevās");
      }
      router.push("/masteradmin/users");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Jauns lietotājs</h1>
        <p className="text-sm text-slate-500">
          Izveido Firebase Auth ierakstu un atbilstošu /users dokumentu.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <Field label="E-pasts">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Vārds">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Sākotnējā parole (min 8 simboli)">
          <input
            type="text"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
            minLength={8}
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Lietotājs to varēs nomainīt vēlāk.
          </p>
        </Field>
        <Field label="Loma">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="MASTER">Master</option>
            <option value="ADMIN">Admin</option>
            <option value="WAREHOUSE">Warehouse</option>
            <option value="VIEWER">Viewer</option>
          </select>
        </Field>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.push("/masteradmin/users")}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            Atcelt
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:bg-slate-400"
          >
            {submitting ? "Veido…" : "Izveidot lietotāju"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
