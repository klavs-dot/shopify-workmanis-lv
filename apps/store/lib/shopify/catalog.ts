import "server-only";

import { cache } from "react";

import { CATEGORIES } from "@/lib/categories";
import { PRODUCTS_PAGE_SIZE, type ProductListQuery } from "@/lib/catalog-query";
import { MOCK_PRODUCTS } from "@/lib/mock-products";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";

import { SHOPIFY_TAGS, cachedCatalogRead, shopifyFetch } from "./client";
import { getShopifyMode } from "./config";
import { mapProduct } from "./mappers";
import {
  CATALOG_PRODUCTS_QUERY,
  COLLECTIONS_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCT_RECOMMENDATIONS_QUERY,
} from "./queries";
import type {
  ShopifyCollection,
  ShopifyConnection,
  ShopifyPageInfo,
  ShopifyProductCard,
  ShopifyProductDetail,
} from "./types";

// Catalog reads for pages and server components. One cached snapshot of all
// sellable products (paginated Storefront reads, revalidated every 60 s and
// on product webhooks) is filtered, sorted and paginated here — the catalog
// is small, so this beats a Storefront round-trip per filter combination
// and keeps the rules identical for Shopify and mock data.
//
// Every Storefront read goes through cachedCatalogRead (client.ts): mapped
// results are cached, failures never are.
//
// Failure policy: list reads never throw — they log and return an empty
// result flagged `unavailable`, so pages render an outage message instead of
// crashing. getProductBySlug throws (there is no sensible empty product
// page; app/error.tsx takes over).

/** Storefront page size for the snapshot (keeps each cached page well under
 *  Next's 2 MB data-cache item limit). */
const SNAPSHOT_PAGE_SIZE = 100;
/** Hard cap on snapshot size — 10 cached requests at most. */
const SNAPSHOT_MAX_PAGES = 10;

interface CatalogSnapshot {
  /** Sellable products, newest first. */
  products: Product[];
  ok: boolean;
}

export interface ProductListResult {
  /** Current page of matching products. */
  products: Product[];
  /** Matching products across all pages. */
  total: number;
  /** Current page, clamped to 1..pageCount. */
  page: number;
  pageCount: number;
  /** Sellable products per category slug, ignoring the active filters. */
  categoryCounts: Record<string, number>;
  /** All sellable products, ignoring the active filters. */
  catalogTotal: number;
  /** True when the Storefront API request failed (not just an empty result). */
  unavailable: boolean;
}

export interface CategoryWithCount extends Category {
  /** Sellable products in this category. */
  productCount: number;
}

export interface CategoryListResult {
  categories: CategoryWithCount[];
  /** True when the Storefront API request failed — the counts are then
   *  meaningless (all 0) and should not be shown. */
  unavailable: boolean;
}

function logError(context: string, err: unknown): void {
  console.error(`[shopify] ${context}:`, err instanceof Error ? err.message : err);
}

/** Lists, counts and recommendations show only products that can be bought.
 *  Sold items stay reachable by direct URL (product page shows "Pārdots"). */
function isListable(product: Product): boolean {
  return product.availability !== "sold";
}

// ---------------------------------------------------------------------------
// Snapshot
// ---------------------------------------------------------------------------

interface SnapshotPage {
  products: Product[];
  /** Cursor for the next page; null on the last one. */
  next: string | null;
}

/** One page of the snapshot, mapped and cached (keyed by cursor). */
const loadSnapshotPage = cachedCatalogRead(
  "catalog-page",
  [SHOPIFY_TAGS.products],
  async (after: string | null): Promise<SnapshotPage> => {
    const data = await shopifyFetch<{
      products: ShopifyConnection<ShopifyProductCard> & { pageInfo: ShopifyPageInfo };
    }>({
      query: CATALOG_PRODUCTS_QUERY,
      variables: { first: SNAPSHOT_PAGE_SIZE, after },
    });
    const { hasNextPage, endCursor } = data.products.pageInfo;
    return {
      products: data.products.nodes
        .map(mapProduct)
        .filter((p): p is Product => p !== null),
      next: hasNextPage && endCursor ? endCursor : null,
    };
  }
);

async function fetchSnapshotFromShopify(): Promise<Product[]> {
  const products: Product[] = [];
  const seen = new Set<string>();
  let after: string | null = null;

  for (let page = 0; page < SNAPSHOT_MAX_PAGES; page++) {
    const { products: batch, next }: SnapshotPage = await loadSnapshotPage(after);
    for (const product of batch) {
      // The search filter is advisory on some backends (mock.shop) — the
      // availability check here is the one that counts.
      if (isListable(product) && !seen.has(product.id)) {
        seen.add(product.id);
        products.push(product);
      }
    }
    if (!next) break;
    after = next;
  }
  return products;
}

/** Per-request memoised; the underlying pages are in the Next data cache. */
const loadCatalog = cache(async (): Promise<CatalogSnapshot> => {
  if (getShopifyMode() === "mock") {
    const products = MOCK_PRODUCTS.filter(isListable).sort((a, b) =>
      b.publishedAt.localeCompare(a.publishedAt)
    );
    return { products, ok: true };
  }
  try {
    return { products: await fetchSnapshotFromShopify(), ok: true };
  } catch (err) {
    logError("catalog snapshot", err);
    return { products: [], ok: false };
  }
});

// ---------------------------------------------------------------------------
// Filtering / sorting
// ---------------------------------------------------------------------------

/** Lowercase + strip diacritics so "austinas" finds "austiņas". */
function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function matchesSearch(product: Product, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const haystack = fold(
    [product.title, product.brand ?? "", product.shortDescription ?? "", product.description].join(
      " "
    )
  );
  return terms.every((t) => haystack.includes(t));
}

/** Discounted first, then newest — the long-standing "Ieteiktas" order. */
function compareFeatured(a: Product, b: Product): number {
  const aDiscount = a.compareAtPrice ? 1 : 0;
  const bDiscount = b.compareAtPrice ? 1 : 0;
  if (bDiscount !== aDiscount) return bDiscount - aDiscount;
  return b.publishedAt.localeCompare(a.publishedAt);
}

function sortProducts(products: Product[], sort: ProductListQuery["sort"]): Product[] {
  const out = products.slice();
  switch (sort) {
    case "newest":
      return out.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    case "price_asc":
      return out.sort((a, b) => a.price.amount - b.price.amount);
    case "price_desc":
      return out.sort((a, b) => b.price.amount - a.price.amount);
    default:
      return out.sort(compareFeatured);
  }
}

function countByCategory(products: Product[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of products) {
    counts[p.categorySlug] = (counts[p.categorySlug] ?? 0) + 1;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** /products listing: filter + sort + paginate the sellable catalog. */
export async function getProducts(query: ProductListQuery): Promise<ProductListResult> {
  const { products: all, ok } = await loadCatalog();
  const terms = fold(query.q).split(/\s+/).filter(Boolean);

  const matching = sortProducts(
    all.filter(
      (p) =>
        (!query.cat || p.categorySlug === query.cat) &&
        (!query.condition || p.condition === query.condition) &&
        (query.min == null || p.price.amount >= query.min) &&
        (query.max == null || p.price.amount <= query.max) &&
        matchesSearch(p, terms)
    ),
    query.sort
  );

  const pageCount = Math.max(1, Math.ceil(matching.length / PRODUCTS_PAGE_SIZE));
  const page = Math.min(Math.max(1, query.page), pageCount);
  const start = (page - 1) * PRODUCTS_PAGE_SIZE;

  return {
    products: matching.slice(start, start + PRODUCTS_PAGE_SIZE),
    total: matching.length,
    page,
    pageCount,
    categoryCounts: countByCategory(all),
    catalogTotal: all.length,
    unavailable: !ok,
  };
}

/** Home page "Aktuālie piedāvājumi". */
export async function getFeaturedProducts(
  limit = 10
): Promise<{ products: Product[]; unavailable: boolean }> {
  const { products, ok } = await loadCatalog();
  return {
    products: sortProducts(products, "featured").slice(0, limit),
    unavailable: !ok,
  };
}

/** Category page: sellable products in one category ("Ieteiktas" order). */
export async function getCategoryProducts(
  slug: string,
  limit = PRODUCTS_PAGE_SIZE
): Promise<{ products: Product[]; total: number; unavailable: boolean }> {
  const { products, ok } = await loadCatalog();
  const inCategory = sortProducts(
    products.filter((p) => p.categorySlug === slug),
    "featured"
  );
  return {
    products: inCategory.slice(0, limit),
    total: inCategory.length,
    unavailable: !ok,
  };
}

/** Handles of sellable products — for generateStaticParams. */
export async function getProductSlugs(): Promise<string[]> {
  const { products } = await loadCatalog();
  return products.map((p) => p.slug);
}

const loadProductByHandle = cachedCatalogRead(
  "product",
  [SHOPIFY_TAGS.products],
  async (handle: string): Promise<Product | null> => {
    const data = await shopifyFetch<{ product: ShopifyProductDetail | null }>({
      query: PRODUCT_BY_HANDLE_QUERY,
      variables: { handle },
    });
    return data.product ? mapProduct(data.product) : null;
  }
);

/** Single product by slug (= Shopify handle), including sold ones.
 *  Returns null when it doesn't exist; throws on Storefront errors. */
export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  if (getShopifyMode() === "mock") {
    return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }
  return loadProductByHandle(slug);
});

const loadRecommendations = cachedCatalogRead(
  "recommendations",
  [SHOPIFY_TAGS.products],
  async (productId: string): Promise<Product[]> => {
    const data = await shopifyFetch<{
      productRecommendations: ShopifyProductCard[] | null;
    }>({
      query: PRODUCT_RECOMMENDATIONS_QUERY,
      variables: { productId },
    });
    return (data.productRecommendations ?? [])
      .map(mapProduct)
      .filter((p): p is Product => p !== null);
  }
);

/** "Līdzīgi produkti": Shopify recommendations, topped up with same-category
 *  products; sellable only, never the product itself. */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const picked = new Map<string, Product>();
  const add = (p: Product | null) => {
    if (p && isListable(p) && p.id !== product.id && picked.size < limit) {
      picked.set(p.id, p);
    }
  };

  if (getShopifyMode() !== "mock") {
    try {
      for (const p of await loadRecommendations(product.id)) add(p);
    } catch (err) {
      logError("recommendations", err);
    }
  }

  if (picked.size < limit) {
    const { products } = await loadCatalog();
    for (const p of sortProducts(products, "featured")) {
      if (p.categorySlug === product.categorySlug) add(p);
    }
  }
  return [...picked.values()];
}

/** Collection handle → image URL, as JSON-serialisable pairs for the cache. */
const fetchCollectionImages = cachedCatalogRead(
  "collection-images",
  [SHOPIFY_TAGS.collections],
  async (): Promise<Array<[string, string]>> => {
    const data = await shopifyFetch<{ collections: ShopifyConnection<ShopifyCollection> }>({
      query: COLLECTIONS_QUERY,
    });
    return data.collections.nodes
      .filter((c) => c.image?.url)
      .map((c): [string, string] => [c.handle, c.image!.url]);
  }
);

const loadCollectionImages = cache(async (): Promise<Map<string, string>> => {
  if (getShopifyMode() === "mock") return new Map();
  try {
    return new Map(await fetchCollectionImages());
  } catch (err) {
    logError("collections", err);
    return new Map();
  }
});

/** The 8 store categories (lib/categories.ts) with sellable-product counts.
 *  A Shopify collection with the same handle and an image overrides the
 *  placeholder cover. */
export async function getCategories(): Promise<CategoryListResult> {
  const [{ products, ok }, images] = await Promise.all([
    loadCatalog(),
    loadCollectionImages(),
  ]);
  const counts = countByCategory(products);
  return {
    categories: CATEGORIES.map((c) => ({
      ...c,
      image: images.get(c.slug) ?? c.image,
      productCount: counts[c.slug] ?? 0,
    })),
    unavailable: !ok,
  };
}
