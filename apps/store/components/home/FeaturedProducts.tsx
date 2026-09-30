import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getFeaturedProducts } from "@/lib/shopify";

export async function FeaturedProducts() {
  const { products, unavailable } = await getFeaturedProducts(10);
  return (
    <section className="py-8 md:py-12">
      <Container>
        <SectionHeader
          title="Aktuālie piedāvājumi"
          href="/products"
          linkLabel="Visi produkti"
        />
        <div className="mt-4">
          <ProductGrid
            products={products}
            emptyMessage={
              unavailable
                ? "Katalogu šobrīd neizdevās ielādēt. Lūdzu, mēģini vēlreiz pēc brīža."
                : "Jaunas preces tiek gatavotas publicēšanai — ieskaties vēlāk!"
            }
          />
        </div>
      </Container>
    </section>
  );
}
