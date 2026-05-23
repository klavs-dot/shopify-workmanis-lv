"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function RootRedirect() {
  const router = useRouter();
  const { loading, firebaseUser } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(firebaseUser ? "/dashboard" : "/login");
  }, [loading, firebaseUser, router]);

  return (
    <div className="flex h-screen items-center justify-center text-sm text-slate-500">
      Ielāde…
    </div>
  );
}
