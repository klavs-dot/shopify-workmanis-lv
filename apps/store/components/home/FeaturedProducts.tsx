import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getFeaturedProducts } from "@/lib/mock-products";

export function FeaturedProducts() {
  const featured = getFeaturedProducts(10);
  return (
    <section className="py-8 md:py-12">
      <Container>
        <SectionHeader
          title="Aktuālie piedāvājumi"
          href="/products"
          linkLabel="Visi produkti"
        />
        <div className="mt-4">
          <ProductGrid products={featured} />
        </div>
      </Container>
    </section>
  );
}
