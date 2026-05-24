"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Copy, Check } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { useAuth } from "@/lib/auth/AuthProvider";
import { generateFriendlyPassword } from "@/lib/passwordGen";

export default function NewWarehouseWorkerPage() {
  return (
    <RequireRole allow={["MASTER", "ADMIN"]}>
      <AppShell>
        <Form />
      </AppShell>
    </RequireRole>
  );
}

function Form() {
  const { firebaseUser } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(() => generateFriendlyPassword());
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    displayName: string;
    email: string;
    password: string;
  } | null>(null);

  // Reset the copy-confirmation feedback whenever the password changes.
  useEffect(() => {
    setCopied(false);
  }, [password]);

  const displayName = `${firstName} ${lastName}`.trim();

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard might be unavailable (HTTP, permissions) — silently ignore.
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    if (!firstName.trim() || !lastName.trim()) {
      setError("Lūdzu, ievadi gan vārdu, gan uzvārdu.");
      return;
    }
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
        body: JSON.stringify({
          email: email.trim(),
          password,
          displayName,
          role: "WAREHOUSE",
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Neizdevās");
      }
      setCreated({ displayName, email: email.trim(), password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className="max-w-xl space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm font-semibold text-emerald-900">
            Darbinieks izveidots ✓
          </div>
          <p className="mt-1 text-xs text-emerald-800">
            Nodod šos pieslēgšanās datus darbiniekam manuāli. Parole vairs nebūs
            redzama — saglabā vai uzraksti tūlīt.
          </p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-slate-500">Vārds</dt>
            <dd className="font-medium text-slate-900">{created.displayName}</dd>
            <dt className="text-slate-500">E-pasts</dt>
            <dd className="font-mono text-xs text-slate-900">{created.email}</dd>
            <dt className="text-slate-500">Parole</dt>
            <dd className="font-mono text-sm font-semibold text-slate-900">
              {created.password}
            </dd>
          </dl>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/noliktavas-darbinieki")}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Uz darbinieku sarakstu
          </button>
          <button
            type="button"
            onClick={() => {
              setCreated(null);
              setFirstName("");
              setLastName("");
              setEmail("");
              setPassword(generateFriendlyPassword());
            }}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            Pievienot vēl vienu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Pievienot noliktavas darbinieku
        </h1>
        <p className="text-sm text-slate-500">
          Izveido WAREHOUSE lomu ar Firebase Auth ierakstu. Parole tiek
          ģenerēta automātiski, bet vari to nomainīt.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Vārds">
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Uzvārds">
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <Field label="E-pasts">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="vards.uzvards@workmanis.lv"
          />
        </Field>

        <Field label="Sākotnējā parole">
          <div className="flex items-center gap-2">
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
            />
            <button
              type="button"
              onClick={() => setPassword(generateFriendlyPassword())}
              title="Ģenerēt jaunu paroli"
              className="rounded-md border border-slate-300 bg-white p-2 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4 text-slate-700" />
            </button>
            <button
              type="button"
              onClick={copyPassword}
              title="Kopēt paroli"
              className="rounded-md border border-slate-300 bg-white p-2 hover:bg-slate-50"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-700" />
              ) : (
                <Copy className="h-4 w-4 text-slate-700" />
              )}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Vari spiest 🔄 lai ģenerētu jaunu. Saglabā paroli pirms turpini —
            vēlāk to redzēs tikai darbinieks pats.
          </p>
        </Field>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.push("/noliktavas-darbinieki")}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            Atcelt
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:bg-slate-400"
          >
            {submitting ? "Veido…" : "Izveidot darbinieku"}
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
