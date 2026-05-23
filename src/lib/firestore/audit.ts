import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase";
import type { AuditAction, AuditEntityType } from "@/lib/types";

export interface AuditEntryInput {
  userId: string;
  userEmail: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

export async function logAudit(entry: AuditEntryInput): Promise<void> {
  if (!firebaseDb) return;
  try {
    await addDoc(collection(firebaseDb, "auditLogs"), {
      ...entry,
      before: entry.before ?? null,
      after: entry.after ?? null,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // Audit log must not break the user-facing action; just warn.
    console.warn("audit log write failed", err);
  }
}
