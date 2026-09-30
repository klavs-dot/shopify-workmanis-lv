import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { CATEGORIES, findCategoryBySlug } from "@/lib/categories";
import { DEFAULT_PRODUCT_LIST_QUERY, productListHref } from "@/lib/catalog-query";
import { getCategoryProducts } from "@/lib/shopify";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

// Only the 8 known categories exist. Product lists come from the 60 s catalog
// cache; ISR (`revalidate`) only applies in mock mode — with Shopify the
// layout's cart count makes every page per-request (see app/layout.tsx).
export const dynamicParams = false;
export const revalidate = 60;

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
  const { products, total, unavailable } = await getCategoryProducts(slug);

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
        {!unavailable && (
          <div className="mt-2 text-xs text-neutral-500">
            {total} {total === 1 ? "prece" : "preces"}
          </div>
        )}
      </header>

      <ProductGrid
        products={products}
        emptyMessage={
          unavailable
            ? "Preces šobrīd neizdevās ielādēt. Lūdzu, mēģini vēlreiz pēc brīža."
            : "Šajā kategorijā vēl nav produktu. Atgriezies drīzumā!"
        }
      />

      {/* Category pages show the first page only; the full, filterable list
       *  lives in the catalogue. */}
      {total > products.length && (
        <div className="mt-6 text-center">
          <Link
            href={productListHref(DEFAULT_PRODUCT_LIST_QUERY, { cat: category.slug })}
            className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
          >
            Skatīt visas {total} preces katalogā →
          </Link>
        </div>
      )}
    </Container>
  );
}
