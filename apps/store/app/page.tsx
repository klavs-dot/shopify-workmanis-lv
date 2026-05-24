import { Hero } from "@/components/home/Hero";
import { TrustSection } from "@/components/home/TrustSection";
import { CategorySection } from "@/components/home/CategorySection";
import { FeaturedProducts, LatestProducts } from "@/components/home/FeaturedProducts";
import { HowItWorks } from "@/components/home/HowItWorks";

// Home stays statically rendered until we wire up live Shopify data.
export const revalidate = 3600;

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustSection />
      <FeaturedProducts />
      <CategorySection />
      <LatestProducts />
      <HowItWorks />
    </>
  );
}
