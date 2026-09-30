// 14d.lv public storefront product model.
//
// IMPORTANT: This is the PUBLIC product shape — it must NOT include any of the
// admin-only fields from apps/admin (purchasePrice, manifestSku, AI status,
// internal notes, etc.). The admin↔store boundary is the Shopify Storefront
// API — lib/shopify maps Storefront objects into this shape (and falls back
// to lib/mock-products.ts while Shopify isn't configured).

export type ProductCondition =
  | "new"             // Jauns
  | "open_box"        // Atvērts iepakojums
  | "used"            // Lietots
  | "defective"       // Ar defektu
  | "untested";       // Nav pārbaudīts

export const PRODUCT_CONDITION_LABEL: Record<ProductCondition, string> = {
  new: "Jauns",
  open_box: "Atvērts iepakojums",
  used: "Lietots",
  defective: "Ar defektu",
  untested: "Nav pārbaudīts",
};

export type ProductAvailability =
  | "in_stock"        // Pieejams
  | "reserved"        // Rezervēts
  | "sold"            // Pārdots
  | "coming_soon";    // Drīzumā

export const PRODUCT_AVAILABILITY_LABEL: Record<ProductAvailability, string> = {
  in_stock: "Pieejams",
  reserved: "Rezervēts",
  sold: "Pārdots",
  coming_soon: "Drīzumā",
};

/** ISO 4217 code. The store sells in EUR; other codes only show up when
 *  developing against mock.shop (CAD). */
export type CurrencyCode = "EUR" | (string & {});

/** Money is always denominated. We keep it as a primitive number + currency
 *  rather than a class so it serialises cleanly across server/client.
 *  Shopify's MoneyV2.amount is a decimal string — parsed with parseFloat. */
export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export interface ProductImage {
  url: string;
  alt: string;
  /** Width/height let next/image avoid layout shift. */
  width?: number;
  height?: number;
}

export interface Product {
  /** Stable URL slug, e.g. "fenchilin-hollywood-led-spogulis". Always equal
   *  to the Shopify product handle. */
  slug: string;
  /** Shopify product handle (=== slug). Kept explicit for cart/checkout code
   *  that talks to Shopify in its own vocabulary. */
  handle: string;
  /** Shopify product GID ("gid://shopify/Product/…"); "mock-N" on mock data. */
  id: string;
  /** Purchasable Shopify variant GID ("gid://shopify/ProductVariant/…") —
   *  what cartLinesAdd needs. Each 14D listing is a single-variant product;
   *  mock data uses a "mock-variant-N" placeholder that is never sent to
   *  Shopify. */
  variantId: string;
  title: string;
  brand?: string;
  categorySlug: string;
  /** Plain-text description for the product page body (Shopify
   *  descriptionHtml is converted to text — never rendered as HTML). */
  description: string;
  /** Plain-text 1-line subtitle for the card and meta description
   *  (Shopify: SEO description, when set). */
  shortDescription?: string;
  /** Bulleted technical points rendered on the product page. */
  highlights?: string[];

  price: Money;
  /** Original / RRP price, when there is a visible discount. */
  compareAtPrice?: Money;

  condition: ProductCondition;
  availability: ProductAvailability;
  /** How many units the store currently has. Cards may show "Tikai 3 atlikušas".
   *  From Shopify variant.quantityAvailable — undefined when Shopify doesn't
   *  expose it, in which case no stock badges are shown. */
  stockQty?: number;

  /** Public note from the admin system (e.g. "Iepakojums bojāts, prece OK").
   *  When present, the card shows a yellow "Svarīgi! Apskati piezīmes!"
   *  badge and the product page shows a prominent warning panel above the
   *  description. null = no note. */
  customerNote?: string | null;

  images: ProductImage[];
  /** When the product first appeared on the site — drives "Jaunums" badge. */
  publishedAt: string; // ISO date
}
