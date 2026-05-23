"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { firebaseDb } from "@/lib/firebase";
import type { AuditLog } from "@/lib/types";

export default function AuditLogPage() {
  return (
    <RequireRole allow={["MASTER"]}>
      <AppShell>
        <AuditContent />
      </AppShell>
    </RequireRole>
  );
}

function AuditContent() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!firebaseDb) return;
      try {
        const q = query(
          collection(firebaseDb, "auditLogs"),
          orderBy("createdAt", "desc"),
          limit(200)
        );
        const snap = await getDocs(q);
        setLogs(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AuditLog, "id">) }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Neizdevās");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Audit log</h1>
        <p className="text-sm text-slate-500">Pēdējie 200 ieraksti.</p>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Ielāde…</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      ) : logs.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
          Vēl nav ierakstu.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="app-table w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">Laiks</th>
                <th className="px-3 py-2">Lietotājs</th>
                <th className="px-3 py-2">Darbība</th>
                <th className="px-3 py-2">Objekts</th>
                <th className="px-3 py-2">ID</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {log.createdAt?.toDate
                      ? log.createdAt.toDate().toLocaleString("lv-LV")
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-700">{log.userEmail}</td>
                  <td className="px-3 py-2 text-xs font-mono text-slate-900">{log.action}</td>
                  <td className="px-3 py-2 text-xs text-slate-700">{log.entityType}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-slate-500">{log.entityId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
