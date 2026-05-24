// Shopify Storefront API client — PLACEHOLDER.
//
// The public store currently runs on mock data (lib/mock-products.ts).
// When Shopify credentials are available, this module will become the
// single source of truth for product + checkout reads.
//
// IMPORTANT: This file only ever talks to the Storefront API (read + cart).
// Admin API access lives in apps/admin and must never be imported here —
// the access scope leak would be a major security problem.

import type { Product } from "@/types/product";

// ---------------------------------------------------------------------------
// Env (lazy — we don't crash if the values are missing while we're on mocks)
// ---------------------------------------------------------------------------

const STOREFRONT_DOMAIN = process.env.NEXT_PUBLIC_STORE_DOMAIN ?? "";
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? "";
const API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2025-04";

export function isShopifyConfigured(): boolean {
  return Boolean(STOREFRONT_DOMAIN && STOREFRONT_TOKEN);
}

// ---------------------------------------------------------------------------
// Public API (all currently throw or fall back to mocks)
// ---------------------------------------------------------------------------

/** Fetch the product catalogue. The real implementation will paginate via
 *  Storefront API `products(first: 250, after: cursor)`. */
export async function fetchProducts(_opts?: {
  category?: string;
  limit?: number;
}): Promise<Product[]> {
  if (!isShopifyConfigured()) {
    const { MOCK_PRODUCTS } = await import("./mock-products");
    return MOCK_PRODUCTS;
  }
  throw new Error("fetchProducts: Shopify Storefront API integrācija vēl nav iebūvēta.");
}

/** Fetch a single product by slug. Slug maps to Shopify's `handle`. */
export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  if (!isShopifyConfigured()) {
    const { findProductBySlug } = await import("./mock-products");
    return findProductBySlug(slug) ?? null;
  }
  throw new Error("fetchProductBySlug: Shopify Storefront API integrācija vēl nav iebūvēta.");
}

/** Create a Shopify Storefront cart and return a checkout URL. */
export async function createCheckout(_input: {
  items: Array<{ variantId: string; quantity: number }>;
}): Promise<{ checkoutUrl: string }> {
  if (!isShopifyConfigured()) {
    throw new Error(
      "createCheckout: Shopify nav konfigurēts. Šobrīd grozs strādā tikai lokāli."
    );
  }
  // TODO: cartCreate mutation → return cart.checkoutUrl
  throw new Error("createCheckout: vēl nav iebūvēts.");
}

// ---------------------------------------------------------------------------
// Internal — Storefront API helper (left ready for the real implementation)
// ---------------------------------------------------------------------------

interface StorefrontResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/** Generic Storefront fetcher. Kept here so the rest of the file reads as a
 *  clean API surface. */
export async function storefrontFetch<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  if (!isShopifyConfigured()) {
    throw new Error("storefrontFetch: Shopify nav konfigurēts.");
  }
  const res = await fetch(
    `https://${STOREFRONT_DOMAIN}/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
      // Storefront responses are public — cache them at the edge.
      next: { revalidate: 60 },
    }
  );
  if (!res.ok) {
    throw new Error(`Shopify Storefront HTTP ${res.status}`);
  }
  const json = (await res.json()) as StorefrontResponse<T>;
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  if (!json.data) {
    throw new Error("Shopify Storefront atbilde bez data lauka");
  }
  return json.data;
}

// ---------------------------------------------------------------------------
// TODO list (move into 06_SHOPIFY_INTEGRATION as work begins)
// ---------------------------------------------------------------------------
//
// [ ] Shopify Partner app + Storefront API access token
// [ ] DNS — 14d.lv → Vercel; add canonical host to Shopify settings
// [ ] Product mapping: Shopify Product → @/types/product (variants → 1 SKU each)
// [ ] Image proxy / CDN host config in next.config.ts
// [ ] cartCreate + cartLinesAdd mutations
// [ ] cart.checkoutUrl redirect (no local checkout — Shopify hosts it)
// [ ] Inventory + availability mapping (locations, totalInventory)
// [ ] Webhook receiver (admin side: order/create → mark product sold)
// [ ] Multi-language Storefront sections (LV, EN, RU)
// [ ] Multi-currency display once Shopify Markets is configured
