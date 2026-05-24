import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getFeaturedProducts } from "@/lib/mock-products";

// One-liner section header (kā jobalots.com). Padding kompakts, lai zem
// fold ietilpst pirmā produktu rinda.
export function FeaturedProducts() {
  const featured = getFeaturedProducts(10);
  return (
    <section className="py-8 md:py-10">
      <Container>
        <div className="flex items-end justify-between gap-2 border-b border-neutral-200 pb-3">
          <h2 className="text-lg font-bold tracking-tight text-neutral-900 md:text-xl">
            Aktuālie piedāvājumi
          </h2>
          <Link
            href="/products"
            className="text-xs font-medium text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline md:text-sm"
          >
            Visi produkti →
          </Link>
        </div>
        <div className="mt-4">
          <ProductGrid products={featured} />
        </div>
      </Container>
    </section>
  );
}
