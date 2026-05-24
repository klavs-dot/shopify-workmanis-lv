"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import {
  DEFAULT_FILTER_STATE,
  ProductFilters,
  type FilterState,
} from "@/components/product/ProductFilters";
import { MOCK_PRODUCTS } from "@/lib/mock-products";
import { cn } from "@/lib/utils";

type Sort = "featured" | "newest" | "price_asc" | "price_desc";

export default function ProductsPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const visible = useMemo(() => {
    let out = MOCK_PRODUCTS.slice();
    if (filters.category) {
      out = out.filter((p) => p.categorySlug === filters.category);
    }
    if (filters.condition) {
      out = out.filter((p) => p.condition === filters.condition);
    }
    const maxPriceN = filters.maxPrice ? parseFloat(filters.maxPrice) : NaN;
    if (Number.isFinite(maxPriceN) && maxPriceN > 0) {
      out = out.filter((p) => p.price.amount <= maxPriceN);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter((p) =>
        [p.title, p.brand ?? "", p.shortDescription ?? ""].some((s) =>
          s.toLowerCase().includes(q)
        )
      );
    }
    switch (sort) {
      case "newest":
        out.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
        break;
      case "price_asc":
        out.sort((a, b) => a.price.amount - b.price.amount);
        break;
      case "price_desc":
        out.sort((a, b) => b.price.amount - a.price.amount);
        break;
      default:
        // featured: discounted first, then newest
        out.sort((a, b) => {
          const aD = a.compareAtPrice ? 1 : 0;
          const bD = b.compareAtPrice ? 1 : 0;
          if (bD !== aD) return bD - aD;
          return b.publishedAt.localeCompare(a.publishedAt);
        });
    }
    return out;
  }, [filters, search, sort]);

  return (
    <Container className="py-8 md:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
          Visi produkti
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Atrastas {visible.length} preces. Filtrē, sortē un izvēlies.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Meklēt preci, brendu vai aprakstu…"
            className="w-full rounded-md border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
          aria-label="Sortēšana"
        >
          <option value="featured">Ieteiktas</option>
          <option value="newest">Jaunākās</option>
          <option value="price_asc">Cena: lētākās pirmās</option>
          <option value="price_desc">Cena: dārgākās pirmās</option>
        </select>
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtri
        </button>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Desktop filters */}
        <div className="hidden lg:block">
          <ProductFilters
            state={filters}
            onChange={setFilters}
            onReset={() => setFilters(DEFAULT_FILTER_STATE)}
          />
        </div>

        {/* Grid */}
        <div>
          <ProductGrid
            products={visible}
            emptyMessage="Nevienai precei nav atbilstības. Pamēģini citus filtrus."
          />
        </div>
      </div>

      {/* Mobile filters drawer */}
      <div
        aria-hidden={!mobileFiltersOpen}
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileFiltersOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div
          onClick={() => setMobileFiltersOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/40 transition",
            mobileFiltersOpen ? "opacity-100" : "opacity-0"
          )}
        />
        <aside
          className={cn(
            "absolute inset-y-0 right-0 w-80 max-w-full overflow-y-auto bg-white shadow-xl transition-transform",
            mobileFiltersOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex items-center justify-between border-b border-neutral-200 p-4">
            <div className="text-sm font-semibold">Filtri</div>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              aria-label="Aizvērt filtrus"
              className="rounded-md p-2 hover:bg-neutral-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4">
            <ProductFilters
              state={filters}
              onChange={setFilters}
              onReset={() => setFilters(DEFAULT_FILTER_STATE)}
            />
          </div>
        </aside>
      </div>
    </Container>
  );
}
