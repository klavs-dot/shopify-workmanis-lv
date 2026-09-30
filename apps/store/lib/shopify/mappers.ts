import "server-only";

import { CATEGORIES } from "@/lib/categories";
import {
  PRODUCT_CONDITION_LABEL,
  type Money,
  type Product,
  type ProductCondition,
  type ProductImage,
} from "@/types/product";

import type {
  ShopifyImage,
  ShopifyMoney,
  ShopifyProductCard,
  ShopifyProductDetail,
} from "./types";

// Storefront API objects → app types. The rules (agreed in the integration
// plan, keep in sync with obsidian 11_STORE_LAUNCH_TODO):
//   condition    metafield custom.condition → tag "condition:<value>" → DEFAULT_CONDITION
//   category     first collection whose handle is a category slug → tag "cat:<slug>" → FALLBACK_CATEGORY_SLUG
//   price        selected/first variant price; compareAtPrice only when higher
//   availability availableForSale=false → "sold", otherwise "in_stock"
//   stockQty     variant.quantityAvailable, undefined when Shopify hides it
//   description  descriptionHtml → plain text (never rendered as HTML)

/** Used when a product has no condition metafield/tag. "Lietots" is the
 *  neutral choice: it neither claims the item is new nor that it's faulty. */
export const DEFAULT_CONDITION: ProductCondition = "used";

/** Products that match no category land in "Citi piedāvājumi". */
export const FALLBACK_CATEGORY_SLUG = "citi-piedavajumi";

const CATEGORY_SLUGS = new Set(CATEGORIES.map((c) => c.slug));

export function mapMoney(money: ShopifyMoney): Money {
  const amount = Number.parseFloat(money.amount);
  return {
    amount: Number.isFinite(amount) ? amount : 0,
    currency: money.currencyCode,
  };
}

export function mapImage(image: ShopifyImage, fallbackAlt: string): ProductImage {
  return {
    url: image.url,
    alt: image.altText?.trim() || fallbackAlt,
    width: image.width ?? undefined,
    height: image.height ?? undefined,
  };
}

function tagValue(tags: string[], prefix: string): string | undefined {
  const p = prefix.toLowerCase();
  const tag = tags.find((t) => t.trim().toLowerCase().startsWith(p));
  return tag?.trim().slice(p.length).trim() || undefined;
}

const CONDITION_BY_LABEL = new Map(
  (Object.entries(PRODUCT_CONDITION_LABEL) as [ProductCondition, string][]).map(
    ([value, label]) => [label.toLowerCase(), value]
  )
);

/** Accepts the enum value ("open_box", "open-box") or its LV label
 *  ("Atvērts iepakojums"). A list-type metafield ('["new"]') uses its
 *  first entry. */
function parseCondition(raw: string | undefined): ProductCondition | undefined {
  if (!raw) return undefined;
  let value = raw.trim();
  if (value.startsWith("[")) {
    try {
      const list = JSON.parse(value) as unknown;
      value = Array.isArray(list) && typeof list[0] === "string" ? list[0] : "";
    } catch {
      return undefined;
    }
  }
  const lower = value.toLowerCase();
  const key = lower.replace(/[\s-]+/g, "_");
  if (Object.hasOwn(PRODUCT_CONDITION_LABEL, key)) return key as ProductCondition;
  return CONDITION_BY_LABEL.get(lower);
}

function resolveCondition(node: ShopifyProductCard): ProductCondition {
  return (
    parseCondition(node.condition?.value) ??
    parseCondition(tagValue(node.tags, "condition:")) ??
    DEFAULT_CONDITION
  );
}

function resolveCategory(node: ShopifyProductCard): string {
  const fromCollection = node.collections.nodes.find((c) =>
    CATEGORY_SLUGS.has(c.handle)
  );
  if (fromCollection) return fromCollection.handle;
  const fromTag = tagValue(node.tags, "cat:")?.toLowerCase();
  if (fromTag && CATEGORY_SLUGS.has(fromTag)) return fromTag;
  return FALLBACK_CATEGORY_SLUG;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  laquo: "«",
  raquo: "»",
  euro: "€",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code =
        entity[1]?.toLowerCase() === "x"
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/** Shopify descriptionHtml → plain text that keeps paragraph and list
 *  structure for `whitespace-pre-line`. The result is rendered as a React
 *  text node (escaped), so leftover markup can never execute. */
export function htmlToPlainText(html: string): string {
  const text = html
    .replace(/<(script|style|template)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/(p|h[1-6]|ul|ol|blockquote|table)>/gi, "\n\n")
    .replace(/<\/(div|li|tr)>/gi, "\n")
    .replace(/<[^>]*>/g, "");
  return decodeEntities(text)
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isDetail(
  node: ShopifyProductCard | ShopifyProductDetail
): node is ShopifyProductDetail {
  return "descriptionHtml" in node;
}

/** Storefront product → app Product. Returns null for products without a
 *  purchasable variant (can't be priced or added to a cart). */
export function mapProduct(
  node: ShopifyProductCard | ShopifyProductDetail
): Product | null {
  const variant = node.selectedOrFirstAvailableVariant;
  if (!variant) return null;

  const price = mapMoney(variant.price);
  const compareAt = variant.compareAtPrice ? mapMoney(variant.compareAtPrice) : null;

  const imageNodes = isDetail(node) ? node.gallery.nodes : node.images.nodes;
  const description = isDetail(node)
    ? htmlToPlainText(node.descriptionHtml) || node.description
    : node.description;

  const qty = variant.quantityAvailable;
  const note = node.customerNote?.value.trim();

  return {
    slug: node.handle,
    handle: node.handle,
    id: node.id,
    variantId: variant.id,
    title: node.title,
    brand: node.vendor.trim() || undefined,
    categorySlug: resolveCategory(node),
    description,
    shortDescription: node.seo?.description?.trim() || undefined,
    price,
    compareAtPrice:
      compareAt && compareAt.amount > price.amount ? compareAt : undefined,
    condition: resolveCondition(node),
    availability: node.availableForSale ? "in_stock" : "sold",
    stockQty: typeof qty === "number" ? Math.max(0, qty) : undefined,
    customerNote: note || null,
    images: imageNodes.map((img, i) =>
      mapImage(img, i === 0 ? node.title : `${node.title} — bilde ${i + 1}`)
    ),
    publishedAt: node.publishedAt,
  };
}
