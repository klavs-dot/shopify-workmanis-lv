import "server-only";

// Env → Storefront API connection settings. The single place that decides
// which backend the store talks to:
//
//   SHOPIFY_STORE_DOMAIN unset          → "mock"      lib/mock-products.ts
//   SHOPIFY_STORE_DOMAIN=mock.shop      → "mock-shop" https://mock.shop/api (no auth, dev/testing)
//   SHOPIFY_STORE_DOMAIN=xxx.myshopify.com + SHOPIFY_STOREFRONT_PRIVATE_TOKEN
//                                       → "live"      https://xxx.myshopify.com/api/<version>/graphql.json
//
// A real domain without a token stays "live": every Storefront request then
// fails (shopifyFetch throws), so the site shows its "catalog unavailable"
// state. It never falls back to the mock catalogue — fake listings on the
// real domain would be worse than a visible outage.
//
// Env is read on every call (cheap) rather than at module load, so a missing
// value never crashes the build and tests can flip it per process.

export type ShopifyMode = "mock" | "mock-shop" | "live";

export interface ShopifyConfig {
  mode: ShopifyMode;
  /** GraphQL endpoint; null in "mock" mode. */
  endpoint: string | null;
  /** Private Storefront token; only set in "live" mode (null there when
   *  SHOPIFY_STOREFRONT_PRIVATE_TOKEN is missing — requests then fail). */
  privateToken: string | null;
  apiVersion: string;
}

const DEFAULT_API_VERSION = "2026-07";
const MOCK_SHOP_DOMAIN = "mock.shop";

let warnedMissingToken = false;

/** Accepts "xxx.myshopify.com", "https://xxx.myshopify.com/" etc. */
function normalizeDomain(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

export function getShopifyConfig(): ShopifyConfig {
  const domain = normalizeDomain(process.env.SHOPIFY_STORE_DOMAIN ?? "");
  const apiVersion =
    process.env.SHOPIFY_API_VERSION?.trim() || DEFAULT_API_VERSION;

  if (!domain) {
    return { mode: "mock", endpoint: null, privateToken: null, apiVersion };
  }

  if (domain === MOCK_SHOP_DOMAIN) {
    return {
      mode: "mock-shop",
      endpoint: "https://mock.shop/api",
      privateToken: null,
      apiVersion,
    };
  }

  const privateToken = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN?.trim() || null;
  if (!privateToken && !warnedMissingToken) {
    warnedMissingToken = true;
    console.error(
      "[shopify] SHOPIFY_STORE_DOMAIN is set but SHOPIFY_STOREFRONT_PRIVATE_TOKEN is empty — Storefront requests will fail."
    );
  }

  return {
    mode: "live",
    endpoint: `https://${domain}/api/${apiVersion}/graphql.json`,
    privateToken,
    apiVersion,
  };
}

export function getShopifyMode(): ShopifyMode {
  return getShopifyConfig().mode;
}

/** True when the catalog (and cart) come from a Storefront API — either the
 *  real store or mock.shop. False = local mock data, ordering disabled. */
export function isShopifyConfigured(): boolean {
  return getShopifyMode() !== "mock";
}
