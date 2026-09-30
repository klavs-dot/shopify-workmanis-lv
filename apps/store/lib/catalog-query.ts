import { PRODUCT_CONDITION_LABEL, type ProductCondition } from "@/types/product";

// /products URL state — shared by the server page (parsing searchParams),
// the data layer (filtering) and the client filter controls (building the
// next URL). No server-only imports here.
//
//   /products?q=austiņas&cat=elektronika&condition=open_box&min=10&max=100&sort=price_asc&page=2

export type ProductSort = "featured" | "newest" | "price_asc" | "price_desc";

export const PRODUCT_SORT_LABEL: Record<ProductSort, string> = {
  featured: "Ieteiktas",
  newest: "Jaunākās",
  price_asc: "Cena: lētākās pirmās",
  price_desc: "Cena: dārgākās pirmās",
};

export interface ProductListQuery {
  /** Free-text search over title, brand and description. */
  q: string;
  /** Category slug, "" = all. */
  cat: string;
  condition: ProductCondition | "";
  /** EUR price bounds, inclusive. */
  min: number | null;
  max: number | null;
  sort: ProductSort;
  /** 1-based. */
  page: number;
}

export const DEFAULT_PRODUCT_LIST_QUERY: ProductListQuery = {
  q: "",
  cat: "",
  condition: "",
  min: null,
  max: null,
  sort: "featured",
  page: 1,
};

/** Cards per /products page — 60 fills whole rows at 2/3/4/5 columns. */
export const PRODUCTS_PAGE_SIZE = 60;

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function parsePrice(value: string): number | null {
  if (!value) return null;
  const n = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Tolerant parser: unknown or malformed values fall back to defaults
 *  instead of erroring (these URLs get shared and hand-edited). */
export function parseProductListQuery(params: RawSearchParams): ProductListQuery {
  const condition = first(params.condition);
  const sort = first(params.sort);
  const page = Number.parseInt(first(params.page), 10);
  return {
    q: first(params.q).slice(0, 100),
    cat: first(params.cat).toLowerCase(),
    condition:
      Object.hasOwn(PRODUCT_CONDITION_LABEL, condition)
        ? (condition as ProductCondition)
        : "",
    min: parsePrice(first(params.min)),
    max: parsePrice(first(params.max)),
    sort: Object.hasOwn(PRODUCT_SORT_LABEL, sort) ? (sort as ProductSort) : "featured",
    page: Number.isFinite(page) && page > 1 ? page : 1,
  };
}

/** True when anything narrows the list (used for empty-state copy). */
export function hasActiveFilters(query: ProductListQuery): boolean {
  return Boolean(
    query.q || query.cat || query.condition || query.min != null || query.max != null
  );
}

/** Build a /products URL from the current query plus a patch. Any change
 *  other than `page` itself resets pagination to page 1. Defaults are
 *  omitted so URLs stay short and canonical. */
export function productListHref(
  query: ProductListQuery,
  patch: Partial<ProductListQuery> = {}
): string {
  const next: ProductListQuery = {
    ...query,
    ...patch,
    page: "page" in patch ? patch.page ?? 1 : 1,
  };
  const sp = new URLSearchParams();
  if (next.q) sp.set("q", next.q);
  if (next.cat) sp.set("cat", next.cat);
  if (next.condition) sp.set("condition", next.condition);
  if (next.min != null) sp.set("min", String(next.min));
  if (next.max != null) sp.set("max", String(next.max));
  if (next.sort !== "featured") sp.set("sort", next.sort);
  if (next.page > 1) sp.set("page", String(next.page));
  const qs = sp.toString();
  return qs ? `/products?${qs}` : "/products";
}
