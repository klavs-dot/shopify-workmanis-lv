import Image from "next/image";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { discountPercent, formatMoney, savings } from "@/lib/format-money";
import { cn } from "@/lib/utils";
import {
  PRODUCT_AVAILABILITY_LABEL,
  type Product,
} from "@/types/product";

// Kompakta produkta kartīte jobalots.com stilā.
// Badge hierarhija: sarkanais −% ir primārais, dzeltenais "piezīmes" tūlīt
// zem tā vienā kolonnā (lai mobilajā tie nesaduras). Pārdotām precēm —
// grayscale bilde, bez hover zoom, solīds statusa pill.
export function ProductCard({ product }: { product: Product }) {
  const cover = product.images[0];
  const hover = product.images[1];
  const discount = discountPercent(product.price, product.compareAtPrice);
  const saved = savings(product.price, product.compareAtPrice);
  const isUnavailable =
    product.availability === "sold" || product.availability === "coming_soon";
  const hasNote = !!product.customerNote;

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-md border border-neutral-200 bg-white transition hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
        isUnavailable && "opacity-90"
      )}
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-50">
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className={cn(
              "object-cover transition-transform duration-200 motion-reduce:transition-none",
              isUnavailable
                ? "grayscale"
                : "group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
            )}
          />
        ) : null}

        {/* Second photo swap on hover — signals there's more to inspect */}
        {hover && !isUnavailable && (
          <Image
            src={hover.url}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none"
          />
        )}

        {/* Badge stack — discount primary, note secondary, one column */}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {discount && (
            <div className="rounded bg-red-600 px-2 py-0.5 text-xs font-extrabold tabular text-white shadow-sm">
              −{discount}%
            </div>
          )}
          {hasNote && (
            <div className="inline-flex items-center gap-1 rounded bg-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-950 shadow-sm">
              <AlertTriangle className="h-3 w-3" />
              <span className="hidden sm:inline">Apskati piezīmes!</span>
              <span className="sm:hidden">Piezīme</span>
            </div>
          )}
        </div>

        {/* Sold / coming soon — solid pill, unmistakable */}
        {isUnavailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/55">
            <span className="rounded bg-neutral-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              {PRODUCT_AVAILABILITY_LABEL[product.availability]}
            </span>
          </div>
        )}

        {/* "Apskatīt" reveal bar on hover */}
        {!isUnavailable && (
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-neutral-900/90 py-1.5 text-center text-xs font-semibold text-white transition-transform duration-200 group-hover:translate-y-0 motion-reduce:hidden">
            Apskatīt →
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        {product.brand && (
          <div className="text-[10px] uppercase tracking-wider text-neutral-500">
            {product.brand}
          </div>
        )}
        <div className="line-clamp-2 min-h-[2.25rem] text-xs font-medium leading-tight text-neutral-900 md:text-[13px]">
          {product.title}
        </div>

        <div className="mt-auto flex flex-wrap items-baseline gap-x-1.5">
          <span
            className={cn(
              "tabular font-extrabold",
              product.compareAtPrice
                ? "text-lg text-red-700"
                : "text-base text-neutral-900"
            )}
          >
            {formatMoney(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="tabular text-[11px] text-neutral-400 line-through">
              {formatMoney(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Absolute savings — often the stronger trigger than % */}
        {saved && saved.amount >= 10 && (
          <div className="text-[10px] font-medium text-emerald-700">
            Ietaupi {formatMoney(saved)}
          </div>
        )}

        {product.stockQty != null &&
          product.stockQty > 0 &&
          product.stockQty <= 5 &&
          !isUnavailable && (
            <div className="inline-flex w-fit items-center rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-200">
              {product.stockQty === 1
                ? "Pēdējais eksemplārs"
                : `Tikai ${product.stockQty} gab. noliktavā`}
            </div>
          )}
      </div>
    </Link>
  );
}
