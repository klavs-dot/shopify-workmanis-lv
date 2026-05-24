import { Hero } from "@/components/home/Hero";
import { TrustSection } from "@/components/home/TrustSection";
import { CategorySection } from "@/components/home/CategorySection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";

// Sākumlapa — tīrs jobalots.com stils:
// Hero (melnais banner) → TrustSection (kompakts strip) → Kategorijas → Piedāvājumi
export const revalidate = 3600;

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustSection />
      <CategorySection />
      <FeaturedProducts />
    </>
  );
}
