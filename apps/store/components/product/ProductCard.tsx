import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { discountPercent, formatMoney } from "@/lib/format-money";
import { cn } from "@/lib/utils";
import {
  PRODUCT_AVAILABILITY_LABEL,
  PRODUCT_CONDITION_LABEL,
  type Product,
} from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
  const cover = product.images[0];
  const discount = discountPercent(product.price, product.compareAtPrice);
  const isUnavailable =
    product.availability === "sold" || product.availability === "coming_soon";

  const availabilityTone =
    product.availability === "in_stock"
      ? "success"
      : product.availability === "reserved"
      ? "warning"
      : product.availability === "sold"
      ? "danger"
      : "info";

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:border-neutral-300 hover:shadow-md",
        isUnavailable && "opacity-80"
      )}
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : null}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {discount && (
            <Badge tone="accent" className="!bg-[--color-accent] !text-white !ring-transparent">
              −{discount}%
            </Badge>
          )}
          {product.condition !== "new" && (
            <Badge tone="neutral">{PRODUCT_CONDITION_LABEL[product.condition]}</Badge>
          )}
        </div>

        {/* Availability overlay for sold/coming */}
        {isUnavailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-semibold text-neutral-700">
            {PRODUCT_AVAILABILITY_LABEL[product.availability]}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {product.brand && (
          <div className="text-[11px] uppercase tracking-wider text-neutral-500">
            {product.brand}
          </div>
        )}
        <div className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-neutral-900">
          {product.title}
        </div>

        <div className="mt-auto flex items-baseline gap-2">
          <span className="tabular text-base font-extrabold text-neutral-900">
            {formatMoney(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="tabular text-xs text-neutral-400 line-through">
              {formatMoney(product.compareAtPrice)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-600">
          <Badge tone={availabilityTone}>
            {PRODUCT_AVAILABILITY_LABEL[product.availability]}
          </Badge>
          {product.stockQty != null &&
            product.stockQty > 0 &&
            product.stockQty <= 5 && (
              <span className="text-orange-700">
                Tikai {product.stockQty} atlikušas
              </span>
            )}
        </div>
      </div>
    </Link>
  );
}
