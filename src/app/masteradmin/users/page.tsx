"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { useAuth } from "@/lib/auth/AuthProvider";
import { listUsers } from "@/lib/firestore/users";
import { ROLE_BADGE_CLASS, ROLE_LABEL } from "@/lib/auth/roles";
import type { AppUser, UserRole, UserStatus } from "@/lib/types";

export default function MasterAdminUsersPage() {
  return (
    <RequireRole allow={["MASTER"]}>
      <AppShell>
        <UsersContent />
      </AppShell>
    </RequireRole>
  );
}

function UsersContent() {
  const { firebaseUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      setUsers(await listUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neizdevās ielādēt");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const patchUser = async (
    uid: string,
    patch: { role?: UserRole; status?: UserStatus; displayName?: string }
  ) => {
    if (!firebaseUser) return;
    setBusyUid(uid);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid, ...patch }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Neizdevās");
      }
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setBusyUid(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Lietotāji</h1>
          <p className="text-sm text-slate-500">Pārvaldi visus sistēmas lietotājus.</p>
        </div>
        <Link
          href="/masteradmin/users/new"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Izveidot lietotāju
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Ielāde…</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="app-table w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2">E-pasts</th>
                <th className="px-4 py-2">Vārds</th>
                <th className="px-4 py-2">Loma</th>
                <th className="px-4 py-2">Statuss</th>
                <th className="px-4 py-2">Pēdējais login</th>
                <th className="px-4 py-2 text-right">Darbības</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={6}>
                    Vēl nav neviena lietotāja. Izveido pirmo MASTER ar{" "}
                    <code>npm run seed:master</code>.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.uid} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-mono text-xs text-slate-700">{u.email}</td>
                    <td className="px-4 py-2 text-slate-900">{u.displayName}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                          ROLE_BADGE_CLASS[u.role]
                        }`}
                      >
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {u.status === "active" ? (
                        <span className="text-xs text-emerald-700">Aktīvs</span>
                      ) : (
                        <span className="text-xs text-red-700">Deaktivizēts</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {u.lastLogin?.toDate ? u.lastLogin.toDate().toLocaleString("lv-LV") : "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="inline-flex gap-1">
                        <select
                          defaultValue={u.role}
                          disabled={busyUid === u.uid}
                          onChange={(e) => patchUser(u.uid, { role: e.target.value as UserRole })}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                        >
                          <option value="MASTER">Master</option>
                          <option value="ADMIN">Admin</option>
                          <option value="WAREHOUSE">Warehouse</option>
                          <option value="VIEWER">Viewer</option>
                        </select>
                        <button
                          type="button"
                          disabled={busyUid === u.uid}
                          onClick={() =>
                            patchUser(u.uid, {
                              status: u.status === "active" ? "disabled" : "active",
                            })
                          }
                          className={`rounded-md px-2 py-1 text-xs font-medium ${
                            u.status === "active"
                              ? "bg-red-50 text-red-700 hover:bg-red-100"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {u.status === "active" ? "Deaktivizēt" : "Aktivizēt"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
