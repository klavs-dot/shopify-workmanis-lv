import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { productListHref, type ProductListQuery } from "@/lib/catalog-query";

const LINK_CLASSES =
  "inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";

// Iepriekšējā / nākamā lapa katalogā — tīras saites (server-renderētas),
// strādā arī bez JS un ir indeksējamas.
export function CatalogPagination({
  query,
  page,
  pageCount,
}: {
  query: ProductListQuery;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;
  const hasPrev = page > 1;
  const hasNext = page < pageCount;

  return (
    <nav
      aria-label="Lapas"
      className="mt-8 flex items-center justify-between gap-3 border-t border-neutral-200 pt-4"
    >
      {hasPrev ? (
        <Link
          href={productListHref(query, { page: page - 1 })}
          rel="prev"
          className={LINK_CLASSES}
        >
          <ChevronLeft className="h-4 w-4" />
          Iepriekšējā
        </Link>
      ) : (
        <span />
      )}
      <span className="text-xs text-neutral-500 tabular">
        Lapa {page} no {pageCount}
      </span>
      {hasNext ? (
        <Link
          href={productListHref(query, { page: page + 1 })}
          rel="next"
          className={LINK_CLASSES}
        >
          Nākamā
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
