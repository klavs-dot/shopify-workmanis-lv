import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getFeaturedProducts, getLatestProducts } from "@/lib/mock-products";

export function FeaturedProducts() {
  const featured = getFeaturedProducts(8);
  return (
    <section className="bg-neutral-50 py-12 md:py-16">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
              Nedēļas piedāvājumi
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Atlasīti par labākajām cenām. Ierobežots daudzums.
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-medium text-neutral-700 underline-offset-2 hover:text-neutral-900 hover:underline"
          >
            Visi produkti →
          </Link>
        </div>
        <div className="mt-6">
          <ProductGrid products={featured} />
        </div>
      </Container>
    </section>
  );
}

export function LatestProducts() {
  const latest = getLatestProducts(4);
  return (
    <section className="py-12 md:py-16">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
              Tikko pievienoti
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Jauni produkti regulāri. Seko līdzi, lai nepazaudē atradumu.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <ProductGrid products={latest} />
        </div>
      </Container>
    </section>
  );
}
