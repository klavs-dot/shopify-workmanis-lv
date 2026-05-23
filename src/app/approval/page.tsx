"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/lib/auth/RequireRole";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ApprovalBadge, WarehouseBadge } from "@/components/StatusBadge";
import { listProducts, updateProduct } from "@/lib/firestore/products";
import { logAudit } from "@/lib/firestore/audit";
import { hasPermission } from "@/lib/auth/roles";
import type { ApprovalStatus, Product, WarehouseStatus } from "@/lib/types";

export default function ApprovalPage() {
  return (
    <RequireRole allow={["MASTER", "ADMIN", "WAREHOUSE"]}>
      <AppShell>
        <ApprovalQueue />
      </AppShell>
    </RequireRole>
  );
}

function ApprovalQueue() {
  const { appUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      // Queue = draft + waiting_approval, plus any flagged warehouse states
      const [draft, waiting] = await Promise.all([
        listProducts({ approvalStatus: "draft", limitTo: 200 }),
        listProducts({ approvalStatus: "waiting_approval", limitTo: 200 }),
      ]);
      setProducts([...waiting, ...draft]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neizdevās");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const canApprove = hasPermission(appUser?.role, "approveProducts");

  const act = async (
    p: Product,
    patch: { approvalStatus?: ApprovalStatus; warehouseStatus?: WarehouseStatus },
    action: Parameters<typeof logAudit>[0]["action"]
  ) => {
    if (!appUser) return;
    setBusyId(p.id);
    try {
      await updateProduct(p.id, patch);
      await logAudit({
        userId: appUser.uid,
        userEmail: appUser.email,
        action,
        entityType: "product",
        entityId: p.id,
        before: { ...p },
        after: patch,
      });
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Approval queue</h1>
        <p className="text-sm text-slate-500">
          Produkti, kas gaida lēmumu — draft un waiting_approval. Maksimums 400.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Ielāde…</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Nekā nav rindā 🎉
        </div>
      ) : (
        <ul className="space-y-2">
          {products.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/products/${p.id}`}
                    className="block truncate font-medium text-slate-900 hover:underline"
                  >
                    {p.title}
                  </Link>
                  <div className="text-xs text-slate-500">
                    {p.brand} · ASIN {p.asin || "—"} · Ref{" "}
                    <span className="tabular">{p.referencePrice.toFixed(2)}</span>{" "}
                    · Final{" "}
                    <strong className="tabular">
                      {p.finalPrice?.toFixed(2) ?? "—"}
                    </strong>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <ApprovalBadge status={p.approvalStatus} />
                    <WarehouseBadge status={p.warehouseStatus} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <ActionBtn
                    label="Approve"
                    cls="bg-emerald-600 text-white"
                    disabled={!canApprove || busyId === p.id}
                    onClick={() =>
                      act(p, { approvalStatus: "approved" }, "product_approved")
                    }
                  />
                  <ActionBtn
                    label="Bundle"
                    cls="bg-indigo-600 text-white"
                    disabled={!canApprove || busyId === p.id}
                    onClick={() =>
                      act(p, { approvalStatus: "bundle" }, "product_sent_to_bundle")
                    }
                  />
                  <ActionBtn
                    label="Outlet"
                    cls="bg-orange-600 text-white"
                    disabled={!canApprove || busyId === p.id}
                    onClick={() =>
                      act(p, { approvalStatus: "outlet" }, "product_sent_to_outlet")
                    }
                  />
                  <ActionBtn
                    label="Reject"
                    cls="bg-red-600 text-white"
                    disabled={!canApprove || busyId === p.id}
                    onClick={() =>
                      act(p, { approvalStatus: "rejected" }, "product_rejected")
                    }
                  />
                  <ActionBtn
                    label="Needs photo"
                    cls="bg-yellow-100 text-yellow-800"
                    disabled={busyId === p.id}
                    onClick={() =>
                      act(
                        p,
                        { warehouseStatus: "needs_photo" },
                        "warehouse_status_changed"
                      )
                    }
                  />
                  <ActionBtn
                    label="Missing"
                    cls="bg-red-100 text-red-800"
                    disabled={busyId === p.id}
                    onClick={() =>
                      act(
                        p,
                        { warehouseStatus: "missing" },
                        "product_marked_missing"
                      )
                    }
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActionBtn({
  label,
  cls,
  onClick,
  disabled,
}: {
  label: string;
  cls: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${cls} disabled:opacity-50`}
    >
      {label}
    </button>
  );
}
