import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ChevronRight, ShoppingCart } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductGrid } from "@/components/product/ProductGrid";
import { discountPercent, formatMoney } from "@/lib/format-money";
import { findCategoryBySlug } from "@/lib/categories";
import {
  findProductBySlug,
  findRelatedProducts,
  MOCK_PRODUCTS,
} from "@/lib/mock-products";
import { PRODUCT_AVAILABILITY_LABEL } from "@/types/product";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Pre-render all known product pages at build time.
export function generateStaticParams() {
  return MOCK_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = findProductBySlug(slug);
  if (!product) return { title: "Prece nav atrasta" };
  return {
    title: product.title,
    description:
      product.shortDescription ||
      product.description.slice(0, 160),
    openGraph: {
      title: product.title,
      description: product.shortDescription ?? undefined,
      images: product.images[0]
        ? [
            {
              url: product.images[0].url,
              width: product.images[0].width,
              height: product.images[0].height,
              alt: product.images[0].alt,
            },
          ]
        : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = findProductBySlug(slug);
  if (!product) notFound();

  const category = findCategoryBySlug(product.categorySlug);
  const related = findRelatedProducts(product, 4);
  const discount = discountPercent(product.price, product.compareAtPrice);
  const isAvailable = product.availability === "in_stock";

  const availabilityTone =
    product.availability === "in_stock"
      ? "success"
      : product.availability === "reserved"
      ? "warning"
      : product.availability === "sold"
      ? "danger"
      : "info";

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
        <Link href="/products" className="hover:text-neutral-700">
          Produkti
        </Link>
        {category && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link
              href={`/categories/${category.slug}`}
              className="hover:text-neutral-700"
            >
              {category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="line-clamp-1 text-neutral-700">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} />

        <div className="flex flex-col gap-4">
          {product.brand && (
            <div className="text-xs uppercase tracking-wider text-neutral-500">
              {product.brand}
            </div>
          )}
          <h1 className="text-2xl font-bold leading-snug tracking-tight text-neutral-900 md:text-3xl">
            {product.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={availabilityTone}>
              {PRODUCT_AVAILABILITY_LABEL[product.availability]}
            </Badge>
            {product.stockQty != null && product.stockQty > 0 && product.stockQty <= 5 && (
              <span className="text-xs font-medium text-orange-700">
                Tikai {product.stockQty} atlikušas
              </span>
            )}
          </div>

          <div className="mt-2 flex items-baseline gap-3">
            <span className="tabular text-3xl font-extrabold text-neutral-900">
              {formatMoney(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="tabular text-base text-neutral-400 line-through">
                {formatMoney(product.compareAtPrice)}
              </span>
            )}
            {discount && (
              <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-extrabold tabular text-white">
                −{discount}%
              </span>
            )}
          </div>

          {product.shortDescription && (
            <p className="text-sm text-neutral-700">{product.shortDescription}</p>
          )}

          {/* Customer note — prominent yellow alert above the buy buttons so
           *  the shopper sees it before reaching for the cart. */}
          {product.customerNote && (
            <div
              role="alert"
              className="mt-2 flex items-start gap-3 rounded-md border-2 border-amber-300 bg-amber-50 p-3 text-sm"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Svarīgi! Apskati piezīmes
                </div>
                <p className="mt-0.5 text-sm text-amber-950">
                  {product.customerNote}
                </p>
              </div>
            </div>
          )}

          {/* Add to cart — currently a placeholder; will wire to Shopify cart soon. */}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!isAvailable}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 sm:flex-none"
              title={
                isAvailable
                  ? "Drīzumā pieslēgsim Shopify checkout"
                  : "Šobrīd nav pieejams"
              }
            >
              <ShoppingCart className="h-4 w-4" />
              {isAvailable ? "Pievienot grozam" : "Nav pieejams"}
            </button>
            <LinkButton href="/products" variant="outline" size="lg">
              ← Atpakaļ uz katalogu
            </LinkButton>
          </div>
          <div className="text-[11px] text-neutral-500">
            Pirkumu pabeigsi drošā Shopify checkout vidē (pieslēgšana drīzumā).
          </div>

          {/* Highlights */}
          {product.highlights && product.highlights.length > 0 && (
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-neutral-800">
              {product.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          )}

          {/* Long description */}
          <section className="mt-6 border-t border-neutral-200 pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Apraksts
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-800">
              {product.description}
            </p>
          </section>

          {/* Delivery teaser */}
          <section className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-700">
            <div className="font-semibold text-neutral-900">Piegāde</div>
            <p className="mt-1">
              Sūtām visā Latvijā. Plašāka informācija —{" "}
              <Link
                href="/delivery"
                className="font-medium text-neutral-900 underline-offset-2 hover:underline"
              >
                Piegādes lapā
              </Link>
              .
            </p>
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 md:text-2xl">
            Līdzīgi produkti
          </h2>
          <div className="mt-6">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </Container>
  );
}
