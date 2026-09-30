import "server-only";

import { unstable_cache } from "next/cache";
import { headers } from "next/headers";

import { getShopifyConfig } from "./config";

// Low-level Storefront API transport. Everything else in lib/shopify builds
// on shopifyFetch(); pages and components never call it directly.
//
// Caching contract:
//   - shopifyFetch itself never caches (fetch cache: "no-store").
//   - catalog reads → wrapped in cachedCatalogRead(): Next data cache via
//     unstable_cache, revalidate 60 s, tagged "shopify" + "products" /
//     "collections" (purged by app/api/revalidate on webhooks). Only the
//     mapped result of a successful read is stored. Caching the raw fetch
//     instead would also store Shopify's HTTP 200 error bodies (THROTTLED,
//     INTERNAL_SERVER_ERROR) and serve them to everyone for the whole window.
//   - cart reads/mutations → plain shopifyFetch, optionally with buyerIp.
// Never pass buyerIp on a catalog read: reading it (getBuyerIp) makes the
// page dynamic.

/** Default ISR window for catalog reads (seconds). */
export const CATALOG_REVALIDATE_SECONDS = 60;

export const SHOPIFY_TAGS = {
  all: "shopify",
  products: "products",
  collections: "collections",
} as const;

const REQUEST_TIMEOUT_MS = 10_000;

export class ShopifyError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ShopifyError";
    this.status = status;
  }
}

interface GraphQLError {
  message: string;
  path?: Array<string | number>;
  extensions?: { code?: string };
}

interface GraphQLResponse<T> {
  data?: T | null;
  errors?: GraphQLError[];
}

export type ShopifyCatalogTag =
  | typeof SHOPIFY_TAGS.products
  | typeof SHOPIFY_TAGS.collections;

export interface ShopifyFetchOptions {
  query: string;
  variables?: Record<string, unknown>;
  /** Forwarded as Shopify-Storefront-Buyer-IP (live mode only). For
   *  request-scoped cart calls; catalog reads never pass it. */
  buyerIp?: string | null;
}

/** POST a GraphQL document to the configured Storefront API (uncached).
 *  Throws ShopifyError when Shopify isn't configured or the private token is
 *  missing, on HTTP errors and on GraphQL errors without data. Partial data
 *  (e.g. a field hidden by a missing access scope) is returned with a
 *  server-log warning. */
export async function shopifyFetch<T>(options: ShopifyFetchOptions): Promise<T> {
  const config = getShopifyConfig();
  if (!config.endpoint) {
    throw new ShopifyError("Shopify Storefront API nav konfigurēts.");
  }

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (config.mode === "live") {
    if (!config.privateToken) {
      throw new ShopifyError("SHOPIFY_STOREFRONT_PRIVATE_TOKEN nav iestatīts.");
    }
    requestHeaders["Shopify-Storefront-Private-Token"] = config.privateToken;
    if (options.buyerIp) {
      requestHeaders["Shopify-Storefront-Buyer-IP"] = options.buyerIp;
    }
  }

  let res: Response;
  try {
    res = await fetch(config.endpoint, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify({
        query: options.query,
        variables: options.variables ?? {},
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (err) {
    throw new ShopifyError(
      `Shopify Storefront pieprasījums neizdevās: ${(err as Error).message}`
    );
  }

  if (!res.ok) {
    throw new ShopifyError(`Shopify Storefront HTTP ${res.status}`, res.status);
  }

  let json: GraphQLResponse<T>;
  try {
    json = (await res.json()) as GraphQLResponse<T>;
  } catch {
    throw new ShopifyError("Shopify Storefront atbilde nav derīgs JSON", res.status);
  }

  if (json.errors?.length) {
    const message = json.errors
      .map((e) => (e.path ? `${e.message} (${e.path.join(".")})` : e.message))
      .join("; ");
    if (!json.data) throw new ShopifyError(message, res.status);
    console.warn(`[shopify] partial response: ${message}`);
  }
  if (!json.data) {
    throw new ShopifyError("Shopify Storefront atbilde bez data lauka", res.status);
  }
  return json.data;
}

/** Wraps a catalog loader in the Next data cache (unstable_cache), keyed by
 *  `name` + the loader's arguments + the Storefront endpoint (so switching
 *  stores or API versions never serves the other store's entries).
 *
 *  Only resolved values are stored: a throw is never cached, and when a
 *  background refresh of a stale entry throws, the previous entry keeps
 *  being served until a later refresh succeeds. Arguments and results must
 *  be JSON-serialisable. */
export function cachedCatalogRead<Args extends unknown[], R>(
  name: string,
  tags: ShopifyCatalogTag[],
  load: (...args: Args) => Promise<R>
): (...args: Args) => Promise<R> {
  const cached = unstable_cache(
    (_endpoint: string | null, ...args: Args) => load(...args),
    ["shopify", name],
    { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [SHOPIFY_TAGS.all, ...tags] }
  );
  return (...args: Args) => cached(getShopifyConfig().endpoint, ...args);
}

/** Client IP for the Shopify-Storefront-Buyer-IP header. Request-scoped:
 *  reads next/headers, so only call it from server actions / route handlers
 *  / already-dynamic pages (cart), never from cached catalog reads. */
export async function getBuyerIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || null;
}
