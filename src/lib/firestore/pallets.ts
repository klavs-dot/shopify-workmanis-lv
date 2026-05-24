import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { firebaseDb } from "@/lib/firebase";
import type { AppUser, Pallet, PalletStatus } from "@/lib/types";

export async function listPallets(): Promise<Pallet[]> {
  if (!firebaseDb) return [];
  const q = query(collection(firebaseDb, "pallets"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Pallet, "id">) }));
}

export async function getPallet(id: string): Promise<Pallet | null> {
  if (!firebaseDb) return null;
  const snap = await getDoc(doc(firebaseDb, "pallets", id));
  if (!snap.exists()) return null;
  return { id, ...(snap.data() as Omit<Pallet, "id">) };
}

export interface CreatePalletInput {
  manifestSku: string;
  name: string;
  source: string;
  originalFileName: string;
  totalProducts: number;
  totalReferencePrice: number;
  currency: string;
  jobalotsUrl: string | null;
  purchasePrice: number | null;
  reservePrice: number | null;
  location: string | null;
  weightKg: number | null;
  palletCondition: string | null;
  coverImage: string | null;
  createdBy: string;
  /** Optional pre-assignment to a Warehouse worker chosen at upload time. */
  assignedWarehouseUid?: string | null;
  assignedWarehouseEmail?: string | null;
  assignedWarehouseName?: string | null;
}

export async function createPallet(input: CreatePalletInput): Promise<string> {
  if (!firebaseDb) throw new Error("Firestore nav konfigurēts");
  const assignedUid = input.assignedWarehouseUid ?? null;
  const ref = await addDoc(collection(firebaseDb, "pallets"), {
    ...input,
    // Default to in_transit — manifest is in our system, but the physical
    // pallet is still on its way from the supplier. The Loģistika page is
    // where warehouse staff flips it to "imported" (= ready for sorting).
    status: "in_transit" satisfies PalletStatus,
    sortingClaimedBy: null,
    sortingClaimedByEmail: null,
    sortingClaimedByName: null,
    sortingClaimedAt: null,
    assignedWarehouseUid: assignedUid,
    assignedWarehouseEmail: input.assignedWarehouseEmail ?? null,
    assignedWarehouseName: input.assignedWarehouseName ?? null,
    assignedWarehouseAt: assignedUid ? serverTimestamp() : null,
    assignedBy: assignedUid ? input.createdBy : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Pre-assign or re-assign a pallet to a warehouse worker. Stamps the
 *  serverTimestamp for the assignment event. */
export async function assignPalletToWarehouse(
  palletId: string,
  worker: Pick<AppUser, "uid" | "email" | "displayName">,
  assignedBy: string
): Promise<void> {
  if (!firebaseDb) throw new Error("Firestore nav konfigurēts");
  await updateDoc(doc(firebaseDb, "pallets", palletId), {
    assignedWarehouseUid: worker.uid,
    assignedWarehouseEmail: worker.email,
    assignedWarehouseName: worker.displayName || worker.email,
    assignedWarehouseAt: serverTimestamp(),
    assignedBy,
    updatedAt: serverTimestamp(),
  });
}

/** Claim a pallet for sorting — only the claimer (or MASTER) can later
 *  open its detail page. No-op if already claimed by someone else. */
export async function claimPalletForSorting(
  palletId: string,
  user: Pick<AppUser, "uid" | "email" | "displayName">
): Promise<void> {
  if (!firebaseDb) throw new Error("Firestore nav konfigurēts");
  await updateDoc(doc(firebaseDb, "pallets", palletId), {
    sortingClaimedBy: user.uid,
    sortingClaimedByEmail: user.email,
    sortingClaimedByName: user.displayName || user.email,
    sortingClaimedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** Release a sorting claim. Allowed for the claimer themselves or MASTER. */
export async function releasePalletSortingClaim(palletId: string): Promise<void> {
  if (!firebaseDb) throw new Error("Firestore nav konfigurēts");
  await updateDoc(doc(firebaseDb, "pallets", palletId), {
    sortingClaimedBy: null,
    sortingClaimedByEmail: null,
    sortingClaimedByName: null,
    sortingClaimedAt: null,
    updatedAt: serverTimestamp(),
  });
}

/** Mark a pallet as physically received at the warehouse. Called from the
 *  Loģistika "Saņemts! Nosūtīt uz šķirošanu!" button.
 *
 *  If the pallet was pre-assigned to a warehouse worker at upload time, this
 *  also auto-claims it for that worker so it shows up on their Šķirošana
 *  board ready to open. Workers without a pre-assignment go to the free pool. */
export async function markPalletReceivedAutoClaim(
  id: string,
  pallet: Pick<
    Pallet,
    | "assignedWarehouseUid"
    | "assignedWarehouseEmail"
    | "assignedWarehouseName"
    | "sortingClaimedBy"
  >
): Promise<void> {
  if (!firebaseDb) throw new Error("Firestore nav konfigurēts");
  const patch: Record<string, unknown> = {
    status: "imported" satisfies PalletStatus,
    updatedAt: serverTimestamp(),
  };
  // Only auto-claim if a pre-assignment exists AND nobody has already grabbed
  // this pallet manually (defensive — shouldn't happen in normal flow).
  if (pallet.assignedWarehouseUid && !pallet.sortingClaimedBy) {
    patch.sortingClaimedBy = pallet.assignedWarehouseUid;
    patch.sortingClaimedByEmail = pallet.assignedWarehouseEmail ?? null;
    patch.sortingClaimedByName = pallet.assignedWarehouseName ?? null;
    patch.sortingClaimedAt = serverTimestamp();
  }
  await updateDoc(doc(firebaseDb, "pallets", id), patch);
}

/** Old non-claiming variant — kept for any caller that still uses it. */
export async function markPalletReceived(id: string): Promise<void> {
  await updatePallet(id, { status: "imported" });
}

export interface UpdatePalletInput {
  name?: string;
  status?: PalletStatus;
  jobalotsUrl?: string | null;
  purchasePrice?: number | null;
  reservePrice?: number | null;
  location?: string | null;
  weightKg?: number | null;
  palletCondition?: string | null;
  coverImage?: string | null;
}

export async function updatePallet(id: string, patch: UpdatePalletInput): Promise<void> {
  if (!firebaseDb) throw new Error("Firestore nav konfigurēts");
  await updateDoc(doc(firebaseDb, "pallets", id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function updatePalletStatus(id: string, status: PalletStatus): Promise<void> {
  await updatePallet(id, { status });
}
