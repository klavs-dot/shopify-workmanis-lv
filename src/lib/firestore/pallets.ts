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
import type { Pallet, PalletStatus } from "@/lib/types";

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
    status: "imported" satisfies PalletStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
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
