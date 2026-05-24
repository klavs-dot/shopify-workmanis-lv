"use client";

import { useCallback, useEffect, useState } from "react";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  AUDIT_PAGE_SIZE,
  AUDIT_RETENTION_MONTHS,
  fetchAuditPage,
} from "@/lib/firestore/auditQuery";
import { labelForAction, labelForEntity } from "@/lib/auditLabels";
import { ROLE_BADGE_CLASS, ROLE_LABEL } from "@/lib/auth/roles";
import type { AuditLog } from "@/lib/types";

export default function ActivityHistoryPage() {
  return (
    <RequireRole allow={["MASTER", "ADMIN", "WAREHOUSE", "VIEWER"]}>
      <AppShell>
        <ActivityHistoryContent />
      </AppShell>
    </RequireRole>
  );
}

function ActivityHistoryContent() {
  const { appUser } = useAuth();
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [cursorStack, setCursorStack] = useState<
    QueryDocumentSnapshot<DocumentData>[]
  >([]); // last doc of each previous page
  const [hasMore, setHasMore] = useState(false);

  // VIEWER role can technically reach this page (sidebar shows it to all),
  // but Firestore rules deny their reads. We surface a friendly message.
  const isViewer = appUser?.role === "VIEWER";
  const isWarehouse = appUser?.role === "WAREHOUSE";

  const load = useCallback(
    async (direction: "first" | "next" | "back") => {
      if (!appUser) return;
      if (isViewer) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        let startAfterDoc: QueryDocumentSnapshot<DocumentData> | null = null;
        let endBeforeDoc: QueryDocumentSnapshot<DocumentData> | null = null;
        if (direction === "next") {
          startAfterDoc = cursorStack[cursorStack.length - 1] ?? null;
        } else if (direction === "back") {
          // Go back by reusing the previous cursor (or null for first page).
          startAfterDoc = cursorStack[cursorStack.length - 2] ?? null;
        }

        const page = await fetchAuditPage({
          userId: isWarehouse ? appUser.uid : undefined,
          startAfterDoc,
          endBeforeDoc,
        });
        setRows(page.rows);
        setHasMore(page.hasMore);
        if (direction === "first") {
          setCursorStack(page.docs.length ? [page.docs[page.docs.length - 1]] : []);
          setPageIndex(0);
        } else if (direction === "next") {
          setCursorStack((s) =>
            page.docs.length ? [...s, page.docs[page.docs.length - 1]] : s
          );
          setPageIndex((i) => i + 1);
        } else if (direction === "back") {
          setCursorStack((s) => s.slice(0, -1));
          setPageIndex((i) => Math.max(0, i - 1));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Neizdevās ielādēt";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [appUser, isViewer, isWarehouse, cursorStack]
  );

  useEffect(() => {
    void load("first");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser?.uid]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Darbību vēsture</h1>
        <p className="text-sm text-slate-500">
          {isWarehouse
            ? `Tava darbību vēsture (pēdējie ${AUDIT_RETENTION_MONTHS} mēneši).`
            : `Visu lietotāju darbības (pēdējie ${AUDIT_RETENTION_MONTHS} mēneši).`}{" "}
          Pa {AUDIT_PAGE_SIZE} ierakstiem lapā.
        </p>
      </div>

      {isViewer ? (
        <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
          Viewer lomai darbību vēsture nav pieejama.
        </div>
      ) : loading ? (
        <div className="text-sm text-slate-500">Ielāde…</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
          {pageIndex === 0
            ? "Vēl nav ierakstu."
            : "Vairāk ierakstu nav."}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="app-table w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2">Laiks</th>
                  {!isWarehouse && <th className="px-3 py-2">Lietotājs</th>}
                  <th className="px-3 py-2">Darbība</th>
                  <th className="px-3 py-2">Objekts</th>
                  <th className="px-3 py-2">ID</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((log) => (
                  <tr key={log.id} className="border-t border-slate-100 align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">
                      {log.createdAt?.toDate
                        ? log.createdAt.toDate().toLocaleString("lv-LV")
                        : "—"}
                    </td>
                    {!isWarehouse && (
                      <td className="px-3 py-2 text-xs text-slate-700">
                        {log.userEmail || log.userId}
                      </td>
                    )}
                    <td className="px-3 py-2 text-xs text-slate-900">
                      <div className="font-medium">{labelForAction(log.action)}</div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {log.action}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">
                      {labelForEntity(log.entityType)}
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-500">
                      {log.entityId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              Lapa <span className="font-semibold">{pageIndex + 1}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => load("back")}
                disabled={pageIndex === 0 || loading}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                ← Atpakaļ
              </button>
              <button
                type="button"
                onClick={() => load("next")}
                disabled={!hasMore || loading}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                Uz priekšu →
              </button>
            </div>
          </div>
        </>
      )}

      {appUser && (
        <div className="text-[11px] text-slate-500">
          Loma:{" "}
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
              ROLE_BADGE_CLASS[appUser.role]
            }`}
          >
            {ROLE_LABEL[appUser.role]}
          </span>
        </div>
      )}
    </div>
  );
}
