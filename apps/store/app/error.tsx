"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Button, LinkButton } from "@/components/ui/Button";

// Kļūdu robeža lapām (header/footer paliek). Parasti — īslaicīga Shopify
// nepieejamība; "Mēģināt vēlreiz" pārrenderē segmentu bez pilnas pārlādes.
export default function ErrorPage({
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
    <Container className="py-10 md:py-16">
      <div
        role="alert"
        className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 py-16 text-center"
      >
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 md:text-2xl">
            Kaut kas nogāja greizi
          </h1>
          <p className="mt-1 max-w-sm text-sm text-neutral-600">
            Lapu šobrīd neizdevās ielādēt. Lūdzu, mēģini vēlreiz pēc brīža —
            ja kļūda atkārtojas, raksti mums.
          </p>
          {error.digest && (
            <p className="mt-2 text-[11px] text-neutral-400">
              Kļūdas kods: <span className="tabular">{error.digest}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="primary" onClick={() => reset()}>
            <RotateCcw className="h-4 w-4" />
            Mēģināt vēlreiz
          </Button>
          <LinkButton href="/" variant="outline">
            Uz sākumlapu
          </LinkButton>
        </div>
      </div>
    </Container>
  );
}
