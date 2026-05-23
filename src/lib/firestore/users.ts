import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { firebaseDb } from "@/lib/firebase";
import type { AppUser, UserRole, UserStatus } from "@/lib/types";

export async function listUsers(): Promise<AppUser[]> {
  if (!firebaseDb) return [];
  const q = query(collection(firebaseDb, "users"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<AppUser, "uid">) }));
}

export async function getUser(uid: string): Promise<AppUser | null> {
  if (!firebaseDb) return null;
  const snap = await getDoc(doc(firebaseDb, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<AppUser, "uid">) };
}

export interface CreateUserDocInput {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status?: UserStatus;
  createdBy?: string | null;
}

export async function createUserDoc(input: CreateUserDocInput): Promise<void> {
  if (!firebaseDb) throw new Error("Firestore nav konfigurēts");
  await setDoc(doc(firebaseDb, "users", input.uid), {
    email: input.email,
    displayName: input.displayName,
    role: input.role,
    status: input.status ?? "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: input.createdBy ?? null,
    lastLogin: null,
  });
}

export interface UpdateUserDocInput {
  displayName?: string;
  role?: UserRole;
  status?: UserStatus;
}

export async function updateUserDoc(uid: string, patch: UpdateUserDocInput): Promise<void> {
  if (!firebaseDb) throw new Error("Firestore nav konfigurēts");
  await updateDoc(doc(firebaseDb, "users", uid), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}
