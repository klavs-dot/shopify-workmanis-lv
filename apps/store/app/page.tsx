import type { Metadata } from "next";

import { Hero } from "@/components/home/Hero";
import { TrustSection } from "@/components/home/TrustSection";
import { CategorySection } from "@/components/home/CategorySection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";

// Sākumlapa — tīrs jobalots.com stils:
// Hero (melnais banner) → TrustSection (kompakts strip) → Kategorijas → Piedāvājumi
// Kategoriju skaiti un piedāvājumi nāk no Shopify kataloga — data cache 60 s
// (+ tūlītēja pārbūve caur /api/revalidate webhook). `revalidate` (ISR) darbojas
// tikai mock režīmā: ar Shopify galvenes groza skaits (cookie) padara katru
// lapu dinamisku — sk. app/layout.tsx.
export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

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
