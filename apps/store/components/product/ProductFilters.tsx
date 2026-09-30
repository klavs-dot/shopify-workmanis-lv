"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { CATEGORIES } from "@/lib/categories";
import {
  PRODUCT_SORT_LABEL,
  productListHref,
  type ProductListQuery,
  type ProductSort,
} from "@/lib/catalog-query";
import { cn } from "@/lib/utils";
import {
  PRODUCT_CONDITION_LABEL,
  type ProductCondition,
} from "@/types/product";

// /products filtri. Stāvoklis dzīvo URL (?q=&cat=&condition=&min=&max=&sort=),
// sarakstu renderē server lapa — šie klienta komponenti tikai nomaina URL.
// router.push iet caur transition, tāpēc vecais saraksts paliek redzams, kamēr
// ielādējas jaunais; `pending` vien pieklusina vadīklas.
//
// Kamēr navigācija vēl notiek, vadīklas rāda jau izvēlēto vērtību (optimistic
// query), un nākamā izmaiņa tiek būvēta uz tās — divas ātras izmaiņas pēc
// kārtas (piem. stāvoklis, tad kategorija) saskaitās, nevis otrā aizstāj pirmo.
// Rīkjosla un filtri (arī mobilajā atvilktnē) dala vienu stāvokli caur
// <CatalogNavigationProvider>.

interface CatalogNavigation {
  /** URL query plus any changes still being navigated to. */
  query: ProductListQuery;
  navigate: (patch: Partial<ProductListQuery>) => void;
  pending: boolean;
}

const CatalogNavigationContext = createContext<CatalogNavigation | null>(null);

/** Wraps the /products toolbar + filters (server page passes the parsed URL
 *  query). Renders no DOM of its own. */
export function CatalogNavigationProvider({
  query,
  children,
}: {
  query: ProductListQuery;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Pending patches are re-applied on top of each newly committed URL query
  // until their own navigation finishes.
  const [optimisticQuery, applyPatch] = useOptimistic(
    query,
    (current: ProductListQuery, patch: Partial<ProductListQuery>) => ({
      ...current,
      ...patch,
    })
  );

  const navigate = (patch: Partial<ProductListQuery>) => {
    const href = productListHref(optimisticQuery, patch);
    startTransition(() => {
      applyPatch(patch);
      router.push(href, { scroll: false });
    });
  };

  return (
    <CatalogNavigationContext.Provider
      value={{ query: optimisticQuery, navigate, pending }}
    >
      {children}
    </CatalogNavigationContext.Provider>
  );
}

function useCatalogNavigation(): CatalogNavigation {
  const ctx = useContext(CatalogNavigationContext);
  if (!ctx) {
    throw new Error("ProductFilters/ProductToolbar must be inside <CatalogNavigationProvider>");
  }
  return ctx;
}

function parsePriceInput(value: string): number | null {
  const n = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Sidebar (desktop) / drawer (mobile) filters. */
export function ProductFilters() {
  const { query, navigate, pending } = useCatalogNavigation();
  const hasFilters = Boolean(
    query.cat || query.condition || query.min != null || query.max != null
  );

  return (
    <aside
      aria-busy={pending}
      className={cn("space-y-6 text-sm transition-opacity", pending && "opacity-60")}
    >
      <FilterBlock title="Kategorija">
        <select
          value={query.cat}
          onChange={(e) => navigate({ cat: e.target.value })}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2"
        >
          <option value="">Visas kategorijas</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </FilterBlock>

      <FilterBlock title="Stāvoklis">
        <select
          value={query.condition}
          onChange={(e) =>
            navigate({ condition: e.target.value as ProductCondition | "" })
          }
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2"
        >
          <option value="">Visi stāvokļi</option>
          {(Object.entries(PRODUCT_CONDITION_LABEL) as [ProductCondition, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
        </select>
      </FilterBlock>

      <FilterBlock title="Cena (EUR)">
        {/* Remount when the URL changes (e.g. "Notīrīt filtrus") so the
         *  inputs never show stale values. */}
        <PriceForm
          key={`${query.min ?? ""}-${query.max ?? ""}`}
          min={query.min}
          max={query.max}
          onApply={(min, max) => navigate({ min, max })}
        />
      </FilterBlock>

      <button
        type="button"
        disabled={!hasFilters}
        onClick={() => navigate({ cat: "", condition: "", min: null, max: null })}
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Notīrīt filtrus
      </button>
    </aside>
  );
}

function PriceForm({
  min,
  max,
  onApply,
}: {
  min: number | null;
  max: number | null;
  onApply: (min: number | null, max: number | null) => void;
}) {
  const [minValue, setMinValue] = useState(min?.toString() ?? "");
  const [maxValue, setMaxValue] = useState(max?.toString() ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply(parsePriceInput(minValue), parsePriceInput(maxValue));
      }}
    >
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={minValue}
          onChange={(e) => setMinValue(e.target.value)}
          placeholder="no"
          aria-label="Minimālā cena (EUR)"
          className="w-full min-w-0 rounded-md border border-neutral-300 bg-white px-3 py-2 tabular"
        />
        <span className="text-neutral-400">–</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={maxValue}
          onChange={(e) => setMaxValue(e.target.value)}
          placeholder="līdz"
          aria-label="Maksimālā cena (EUR)"
          className="w-full min-w-0 rounded-md border border-neutral-300 bg-white px-3 py-2 tabular"
        />
      </div>
      <button
        type="submit"
        className="mt-2 w-full rounded-md bg-neutral-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
      >
        Rādīt
      </button>
    </form>
  );
}

function FilterBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {title}
      </div>
      {children}
    </div>
  );
}

/** Search + sort row, plus the mobile filters button and drawer. */
export function ProductToolbar() {
  const { query, navigate, pending } = useCatalogNavigation();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  // Controlled search field that follows the URL (back/forward) without
  // clobbering what the visitor is typing in between.
  const [search, setSearch] = useState(query.q);
  const [syncedQ, setSyncedQ] = useState(query.q);
  if (query.q !== syncedQ) {
    setSyncedQ(query.q);
    setSearch(query.q);
  }

  return (
    <>
      <div
        aria-busy={pending}
        className={cn(
          "flex flex-wrap items-center gap-2 transition-opacity",
          pending && "opacity-60"
        )}
      >
        {/* Plain GET form as a no-JS fallback; with JS we navigate in place. */}
        <form
          role="search"
          action="/products"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ q: search.trim() });
          }}
          className="relative flex-1 min-w-[200px]"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            name="q"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Meklēt preci, brendu vai aprakstu…"
            aria-label="Meklēt preces"
            className="w-full rounded-md border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
          />
          {query.cat && <input type="hidden" name="cat" value={query.cat} />}
          {query.condition && (
            <input type="hidden" name="condition" value={query.condition} />
          )}
          {query.min != null && <input type="hidden" name="min" value={query.min} />}
          {query.max != null && <input type="hidden" name="max" value={query.max} />}
          {query.sort !== "featured" && (
            <input type="hidden" name="sort" value={query.sort} />
          )}
        </form>
        <select
          value={query.sort}
          onChange={(e) => navigate({ sort: e.target.value as ProductSort })}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
          aria-label="Sortēšana"
        >
          {(Object.entries(PRODUCT_SORT_LABEL) as [ProductSort, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
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
            <ProductFilters />
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-6 w-full rounded-md bg-neutral-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Rādīt rezultātus
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
