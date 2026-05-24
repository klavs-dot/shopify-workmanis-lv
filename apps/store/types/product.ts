// 14d.lv public storefront product model.
//
// IMPORTANT: This is the PUBLIC product shape — it must NOT include any of the
// admin-only fields from apps/admin (purchasePrice, manifestSku, AI status,
// internal notes, etc.). The admin↔store boundary is the Shopify Storefront
// API (or, for now, this mock data layer).

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

/** Money is always denominated. We keep it as a primitive number + currency
 *  rather than a class so it serialises cleanly across server/client. */
export interface Money {
  amount: number;
  currency: "EUR";
}

export interface ProductImage {
  url: string;
  alt: string;
  /** Width/height let next/image avoid layout shift. */
  width?: number;
  height?: number;
}

export interface Product {
  /** Stable URL slug, e.g. "fenchilin-hollywood-led-spogulis". */
  slug: string;
  /** Shopify product id will replace this when integration lands. */
  id: string;
  title: string;
  brand?: string;
  categorySlug: string;
  /** Short HTML-safe description for the product page body. */
  description: string;
  /** Plain-text 1-line subtitle for the card and meta description. */
  shortDescription?: string;
  /** Bulleted technical points rendered on the product page. */
  highlights?: string[];

  price: Money;
  /** Original / RRP price, when there is a visible discount. */
  compareAtPrice?: Money;

  condition: ProductCondition;
  availability: ProductAvailability;
  /** How many units the store currently has. Cards may show "Tikai 3 atlikušas". */
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
