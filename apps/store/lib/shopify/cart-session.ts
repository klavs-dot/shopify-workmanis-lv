import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import type { Cart } from "@/types/cart";

import { getCartById } from "./cart";
import { isShopifyConfigured } from "./config";

// The shopper's cart = a Shopify cart id in the "14d_cart" cookie (httpOnly,
// so client JS never sees it). Reading works anywhere request-scoped;
// writing/deleting only inside server actions and route handlers — a server
// component can't change cookies, so a render that finds a dead cart id
// reports it as `stale` and leaves the cleanup to an action.
//
// Reading the cookie makes the route dynamic, so everything here is a no-op
// while Shopify isn't configured (mock mode keeps static pages).

export const CART_COOKIE = "14d_cart";

const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Shopify cart GIDs look like "gid://shopify/Cart/<token>?key=<secret>". */
const CART_ID_PATTERN = /^gid:\/\/shopify\/Cart\/[\w.~%?=&-]+$/;

export interface CartState {
  /** Null when there is no cart (or it couldn't be loaded). */
  cart: Cart | null;
  /** The cookie holds an id Shopify no longer knows (expired, checked out,
   *  malformed) — it should be dropped. */
  stale: boolean;
  /** The Storefront API request failed; the cart may still exist. */
  unavailable: boolean;
}

const NO_CART: CartState = { cart: null, stale: false, unavailable: false };

function parseCartId(raw: string | undefined): string | null {
  if (!raw || raw.length > 512 || !CART_ID_PATTERN.test(raw)) return null;
  return raw;
}

/** Whether a cart cookie is present at all (valid or not). */
export async function hasCartCookie(): Promise<boolean> {
  return (await cookies()).has(CART_COOKIE);
}

/** Cart id from the cookie, or null when absent or not a Shopify cart GID. */
export async function readCartId(): Promise<string | null> {
  return parseCartId((await cookies()).get(CART_COOKIE)?.value);
}

/** Stores the cart id for 30 days (re-saving slides the expiry). Server
 *  actions / route handlers only. In a server action, changing a cookie also
 *  makes Next re-render the current page, which refreshes the header count. */
export async function saveCartId(cartId: string): Promise<void> {
  (await cookies()).set(CART_COOKIE, cartId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
}

/** Server actions / route handlers only. */
export async function clearCartId(): Promise<void> {
  (await cookies()).delete(CART_COOKIE);
}

/** The current shopper's cart. Memoised per request, so the header count,
 *  the product page and /cart share one Storefront call. Never throws. */
export const getCart = cache(async (): Promise<CartState> => {
  if (!isShopifyConfigured()) return NO_CART;

  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (!raw) return NO_CART;

  const cartId = parseCartId(raw);
  if (!cartId) return { cart: null, stale: true, unavailable: false };

  try {
    const cart = await getCartById(cartId);
    return cart ? { cart, stale: false, unavailable: false } : { ...NO_CART, stale: true };
  } catch (err) {
    console.error("[shopify] cart:", err instanceof Error ? err.message : err);
    return { ...NO_CART, unavailable: true };
  }
});
