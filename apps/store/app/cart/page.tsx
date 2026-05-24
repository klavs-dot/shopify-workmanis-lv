import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Grozs",
  description: "Tavu izvēlēto preču grozs un checkout.",
  robots: { index: false, follow: false },
};

// Cart UI is intentionally a placeholder. We will wire it to Shopify
// cartCreate / cartLinesAdd and use the returned checkoutUrl. Until then,
// the page renders the empty-state and a path back to the catalogue.
export default function CartPage() {
  return (
    <Container className="py-10 md:py-16">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
          Grozs
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Pievieno preces no kataloga, lai redzētu tās šeit.
        </p>
      </header>

      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 py-16 text-center">
        <ShoppingBag className="h-10 w-10 text-neutral-400" />
        <div>
          <div className="text-base font-semibold text-neutral-900">
            Tavs grozs vēl ir tukšs
          </div>
          <p className="mt-1 max-w-sm text-sm text-neutral-600">
            Pārlūko jaunākos piedāvājumus un pievieno preces grozam — pirkumu
            pabeigsi drošā Shopify checkout vidē (pieslēgšana drīzumā).
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <LinkButton href="/products" variant="primary">
            Skatīt produktus
          </LinkButton>
          <LinkButton href="/categories" variant="outline">
            Pārlūkot kategorijas
          </LinkButton>
        </div>
      </div>
    </Container>
  );
}
