import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { CATEGORIES, findCategoryBySlug } from "@/lib/categories";
import { findProductsByCategory } from "@/lib/mock-products";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = findCategoryBySlug(slug);
  if (!category) return { title: "Kategorija nav atrasta" };
  return {
    title: category.name,
    description:
      category.tagline ??
      `${category.name} kategorijas preces 14D veikalā.`,
  };
}

export default async function CategoryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const category = findCategoryBySlug(slug);
  if (!category) notFound();
  const products = findProductsByCategory(slug);

  return (
    <Container className="py-8 md:py-10">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex items-center gap-1 text-xs text-neutral-500"
      >
        <Link href="/" className="hover:text-neutral-700">
          Sākums
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/categories" className="hover:text-neutral-700">
          Kategorijas
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-neutral-700">{category.name}</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
          {category.name}
        </h1>
        {category.tagline && (
          <p className="mt-1 text-sm text-neutral-600">{category.tagline}</p>
        )}
        <div className="mt-2 text-xs text-neutral-500">
          {products.length} {products.length === 1 ? "prece" : "preces"}
        </div>
      </header>

      <ProductGrid
        products={products}
        emptyMessage="Šajā kategorijā vēl nav produktu. Atgriezies drīzumā!"
      />
    </Container>
  );
}
