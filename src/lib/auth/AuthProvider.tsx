"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";

import { firebaseAuth, firebaseDb, firebaseConfigured } from "@/lib/firebase";
import type { AppUser } from "@/lib/types";

interface AuthContextValue {
  loading: boolean;
  firebaseUser: FirebaseUser | null;
  appUser: AppUser | null;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  loading: true,
  firebaseUser: null,
  appUser: null,
  configured: firebaseConfigured,
  signIn: async () => {
    throw new Error("AuthProvider not mounted");
  },
  signOut: async () => {
    throw new Error("AuthProvider not mounted");
  },
  refreshAppUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);

  const loadAppUser = useCallback(async (user: FirebaseUser) => {
    if (!firebaseDb) {
      setAppUser(null);
      return;
    }
    const snap = await getDoc(doc(firebaseDb, "users", user.uid));
    if (!snap.exists()) {
      setAppUser(null);
      return;
    }
    setAppUser({ uid: user.uid, ...(snap.data() as Omit<AppUser, "uid">) });
  }, []);

  useEffect(() => {
    if (!firebaseAuth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await loadAppUser(user);
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [loadAppUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!firebaseAuth || !firebaseDb) {
      throw new Error(
        "Firebase nav konfigurēts. Aizpildi .env.local — skat .env.example."
      );
    }
    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
    await updateDoc(doc(firebaseDb, "users", cred.user.uid), {
      lastLogin: serverTimestamp(),
    }).catch(() => {
      // user doc may not exist yet on very first MASTER seed before doc create
    });
  }, []);

  const signOut = useCallback(async () => {
    if (!firebaseAuth) return;
    await fbSignOut(firebaseAuth);
  }, []);

  const refreshAppUser = useCallback(async () => {
    if (firebaseUser) await loadAppUser(firebaseUser);
  }, [firebaseUser, loadAppUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      firebaseUser,
      appUser,
      configured: firebaseConfigured,
      signIn,
      signOut,
      refreshAppUser,
    }),
    [loading, firebaseUser, appUser, signIn, signOut, refreshAppUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
