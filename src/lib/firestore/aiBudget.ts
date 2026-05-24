// Client-side helpers for the AI budget feature. The serverside increment
// (after each enrichment) lives in the API route — it uses firebase-admin and
// FieldValue.increment() for atomic adds.

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { firebaseDb } from "@/lib/firebase";
import { todayKeyRiga } from "@/lib/ai/pricing";
import type { AiBudgetConfig, AiCostStats } from "@/lib/types";

const BUDGET_DOC = "system/aiBudget";

export const DEFAULT_DAILY_CAP_USD = 50;

export async function getAiBudgetConfig(): Promise<AiBudgetConfig> {
  if (!firebaseDb) return defaultConfig();
  const snap = await getDoc(doc(firebaseDb, BUDGET_DOC));
  if (!snap.exists()) return defaultConfig();
  return snap.data() as AiBudgetConfig;
}

export async function setAiBudgetConfig(
  patch: Partial<Omit<AiBudgetConfig, "updatedAt">>,
  callerUid: string
): Promise<void> {
  if (!firebaseDb) throw new Error("Firestore nav konfigurēts");
  await setDoc(
    doc(firebaseDb, BUDGET_DOC),
    {
      ...patch,
      updatedAt: serverTimestamp(),
      updatedBy: callerUid,
    },
    { merge: true }
  );
}

export async function getTodaySpend(): Promise<AiCostStats | null> {
  if (!firebaseDb) return null;
  const id = todayKeyRiga();
  const snap = await getDoc(doc(firebaseDb, "aiCostStats", id));
  if (!snap.exists()) return null;
  return { ...(snap.data() as AiCostStats), date: id };
}

function defaultConfig(): AiBudgetConfig {
  return {
    dailyCapUsd: DEFAULT_DAILY_CAP_USD,
    updatedAt: null,
    updatedBy: null,
  };
}
