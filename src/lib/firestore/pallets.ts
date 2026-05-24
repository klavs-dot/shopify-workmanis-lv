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
  createdBy: string;
}

export async function createPallet(input: CreatePalletInput): Promise<string> {
  if (!firebaseDb) throw new Error("Firestore nav konfigurēts");
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
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
 *  Loģistika "Saņemts! Nosūtīt uz šķirošanu!" button. */
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
