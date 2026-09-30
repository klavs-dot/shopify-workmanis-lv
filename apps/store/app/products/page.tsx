import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { CatalogPagination } from "@/components/product/CatalogPagination";
import {
  CatalogNavigationProvider,
  ProductFilters,
  ProductToolbar,
} from "@/components/product/ProductFilters";
import { TrustSection } from "@/components/home/TrustSection";
import { CATEGORIES } from "@/lib/categories";
import {
  hasActiveFilters,
  parseProductListQuery,
  productListHref,
} from "@/lib/catalog-query";
import { getProducts } from "@/lib/shopify";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Visi produkti",
  description:
    "Visas 14D preces vienuviet — outlet, atvērtas un palešu preces par izdevīgām cenām. Filtrē pēc kategorijas, stāvokļa un cenas.",
  alternates: { canonical: "/products" },
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Katalogs — server komponente. Filtri, meklēšana, kārtošana un lapošana
// dzīvo URL (?q=&cat=&condition=&min=&max=&sort=&page=), tāpēc lapa renderējas
// katram pieprasījumam; pats katalogs nāk no kešota Shopify snapshot (60 s).
export default async function ProductsPage({ searchParams }: PageProps) {
  const query = parseProductListQuery(await searchParams);
  const result = await getProducts(query);
  const filtered = hasActiveFilters(query);

  const emptyMessage = result.unavailable
    ? "Katalogu šobrīd neizdevās ielādēt. Lūdzu, mēģini vēlreiz pēc brīža."
    : filtered
    ? "Nevienai precei nav atbilstības. Pamēģini citus filtrus."
    : "Jaunas preces tiek gatavotas publicēšanai — ieskaties vēlāk!";

  return (
    <Container className="py-8 md:py-10">
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
          Visi produkti
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Atrastas {result.total} preces. Filtrē, sortē un izvēlies.
        </p>
      </header>

      {/* Trust strip — answers the returned-goods objection right where the
       *  buying decision happens. */}
      <TrustSection compact />

      {/* Category chips — faster than the sidebar select, visible on mobile */}
      <div className="mb-4 mt-3 flex gap-1.5 overflow-x-auto pb-1 snap-row">
        <CategoryChip
          href={productListHref(query, { cat: "" })}
          active={!query.cat}
        >
          Visas ({result.catalogTotal})
        </CategoryChip>
        {CATEGORIES.map((c) => {
          const count = result.categoryCounts[c.slug] ?? 0;
          const active = query.cat === c.slug;
          if (count === 0 && !active) return null;
          return (
            <CategoryChip
              key={c.slug}
              href={productListHref(query, { cat: active ? "" : c.slug })}
              active={active}
            >
              {c.name} ({count})
            </CategoryChip>
          );
        })}
      </div>

      <CatalogNavigationProvider query={query}>
        <ProductToolbar />

        <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Desktop filters */}
          <div className="hidden lg:block">
            <ProductFilters />
          </div>

          {/* Grid */}
          <div>
            <ProductGrid products={result.products} emptyMessage={emptyMessage} />
            <CatalogPagination
              query={query}
              page={result.page}
              pageCount={result.pageCount}
            />
          </div>
        </div>
      </CatalogNavigationProvider>
    </Container>
  );
}

function CategoryChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
        active
          ? "bg-neutral-900 text-white"
          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
      )}
    >
      {children}
    </Link>
  );
}
