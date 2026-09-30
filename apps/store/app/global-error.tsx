"use client";

import Link from "next/link";
import { useEffect } from "react";

import "./globals.css";

// Pēdējā kļūdu robeža — aizstāj arī root layout (tāpēc savs <html>/<body>,
// bez Header/Footer). Nonāk šeit tikai, ja salūzis pats layout.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="lv">
      <body className="flex min-h-screen items-center justify-center bg-white px-4 text-neutral-900 antialiased">
        <main className="max-w-sm text-center">
          <div className="text-2xl font-extrabold tracking-tight">14D</div>
          <h1 className="mt-6 text-xl font-bold tracking-tight">
            Kaut kas nogāja greizi
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Veikalu šobrīd neizdevās ielādēt. Lūdzu, mēģini vēlreiz pēc brīža.
          </p>
          {error.digest && (
            <p className="mt-2 text-[11px] text-neutral-400">
              Kļūdas kods: {error.digest}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Mēģināt vēlreiz
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
            >
              Uz sākumlapu
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
