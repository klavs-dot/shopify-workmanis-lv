import {
  collection,
  endBefore,
  getDocs,
  limit,
  limitToLast,
  orderBy,
  query,
  startAfter,
  Timestamp,
  where,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";

import { firebaseDb } from "@/lib/firebase";
import type { AuditLog } from "@/lib/types";

export const AUDIT_PAGE_SIZE = 50;
export const AUDIT_RETENTION_MONTHS = 6;

function sixMonthsAgo(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - AUDIT_RETENTION_MONTHS);
  return d;
}

export interface FetchAuditOptions {
  /** When set, fetch only entries authored by this user (Warehouse view). */
  userId?: string;
  /** Cursor for "next page" — last document of the previous page. */
  startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null;
  /** Cursor for "previous page" — first document of the current page. */
  endBeforeDoc?: QueryDocumentSnapshot<DocumentData> | null;
}

export interface AuditPage {
  rows: AuditLog[];
  docs: QueryDocumentSnapshot<DocumentData>[];
  hasMore: boolean;
}

export async function fetchAuditPage(opts: FetchAuditOptions = {}): Promise<AuditPage> {
  if (!firebaseDb) return { rows: [], docs: [], hasMore: false };

  const cutoff = Timestamp.fromDate(sixMonthsAgo());
  const filters = [where("createdAt", ">=", cutoff)];
  if (opts.userId) filters.push(where("userId", "==", opts.userId));

  // Pull one extra doc to know whether a next page exists.
  const pageWindow = AUDIT_PAGE_SIZE + 1;

  const constraints = [
    ...filters,
    orderBy("createdAt", "desc"),
    ...(opts.endBeforeDoc
      ? [endBefore(opts.endBeforeDoc), limitToLast(pageWindow)]
      : opts.startAfterDoc
      ? [startAfter(opts.startAfterDoc), limit(pageWindow)]
      : [limit(pageWindow)]),
  ];

  const snap = await getDocs(query(collection(firebaseDb, "auditLogs"), ...constraints));

  const allDocs = snap.docs;
  const hasMore = allDocs.length > AUDIT_PAGE_SIZE;
  // When paginating backwards, the extra doc sits at the start; otherwise at end.
  const pageDocs = opts.endBeforeDoc
    ? hasMore
      ? allDocs.slice(allDocs.length - AUDIT_PAGE_SIZE)
      : allDocs
    : allDocs.slice(0, AUDIT_PAGE_SIZE);

  const rows = pageDocs.map(
    (d) => ({ id: d.id, ...(d.data() as Omit<AuditLog, "id">) }) as AuditLog
  );

  return { rows, docs: pageDocs, hasMore };
}
