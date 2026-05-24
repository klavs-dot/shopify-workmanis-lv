import Image from "next/image";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { discountPercent, formatMoney } from "@/lib/format-money";
import { cn } from "@/lib/utils";
import {
  PRODUCT_AVAILABILITY_LABEL,
  type Product,
} from "@/types/product";

// Kompakta produkta kartīte jobalots.com stilā:
// - sarkans atlaides badge augšējā kreisajā stūrī
// - dzeltens "Svarīgi! Apskati piezīmes!" badge augšējā labajā stūrī, ja ir
//   customerNote (no admin sistēmas — sk. apps/admin)
// - nosaukums + cena + salīdz cena
// - BEZ condition vai availability badges uz kartītes (skar tikai detaļu lapu)
export function ProductCard({ product }: { product: Product }) {
  const cover = product.images[0];
  const discount = discountPercent(product.price, product.compareAtPrice);
  const isUnavailable =
    product.availability === "sold" || product.availability === "coming_soon";
  const hasNote = !!product.customerNote;

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-md border border-neutral-200 bg-white transition hover:border-neutral-400",
        isUnavailable && "opacity-75"
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
            className="object-cover transition duration-200 group-hover:scale-[1.03]"
          />
        ) : null}

        {/* Discount badge — sarkans, augšējais kreisais stūris */}
        {discount && (
          <div className="absolute left-2 top-2 rounded bg-red-600 px-2 py-0.5 text-xs font-extrabold tabular text-white shadow-sm">
            −{discount}%
          </div>
        )}

        {/* Customer note badge — dzeltens, augšējais labais stūris */}
        {hasNote && (
          <div
            className="absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-950 shadow-sm"
            title={product.customerNote ?? undefined}
          >
            <AlertTriangle className="h-3 w-3" />
            <span className="hidden sm:inline">Apskati piezīmes!</span>
            <span className="sm:hidden">Piezīme</span>
          </div>
        )}

        {/* Sold/coming overlay */}
        {isUnavailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-semibold uppercase tracking-wider text-neutral-700">
            {PRODUCT_AVAILABILITY_LABEL[product.availability]}
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

        <div className="mt-auto flex items-baseline gap-1.5">
          <span className="tabular text-base font-extrabold text-neutral-900">
            {formatMoney(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="tabular text-[11px] text-neutral-400 line-through">
              {formatMoney(product.compareAtPrice)}
            </span>
          )}
        </div>

        {product.stockQty != null &&
          product.stockQty > 0 &&
          product.stockQty <= 5 && (
            <div className="text-[10px] font-medium text-red-700">
              Tikai {product.stockQty} atlikušas
            </div>
          )}
      </div>
    </Link>
  );
}
