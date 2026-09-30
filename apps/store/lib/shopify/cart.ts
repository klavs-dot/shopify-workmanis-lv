import "server-only";

import { maxCartQuantity, type Cart, type CartItem } from "@/types/cart";

import { ShopifyError, getBuyerIp, shopifyFetch } from "./client";
import { getShopifyMode } from "./config";
import { mapImage, mapMoney } from "./mappers";
import {
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_QUERY,
} from "./queries";
import type {
  ShopifyCart,
  ShopifyCartLine,
  ShopifyCartMutationPayload,
  ShopifyCartWarning,
  ShopifyUserError,
} from "./types";

// Storefront Cart API operations. Stateless: every function takes the cart
// id explicitly — reading/writing the "14d_cart" cookie is ./cart-session.ts.
// All requests are uncached (cache: "no-store") and, on the real store,
// carry the shopper's IP (Shopify-Storefront-Buyer-IP) so Shopify's bot
// protection sees the buyer rather than our server.
//
// Error policy: transport / GraphQL failures throw ShopifyError; Shopify's
// userErrors and warnings are returned for the caller to translate.

export interface CartLineInput {
  /** ProductVariant GID. */
  merchandiseId: string;
  quantity: number;
}

export interface CartLineUpdateInput {
  /** CartLine GID. */
  id: string;
  quantity: number;
}

export interface CartMutationResult {
  /** The cart after the mutation; null when Shopify rejected it. */
  cart: Cart | null;
  userErrors: ShopifyUserError[];
  warnings: ShopifyCartWarning[];
  /** Shopify no longer knows the cart id (expired, or already checked out). */
  cartMissing: boolean;
}

/** Shopify's name for the variant of a single-variant product. */
const DEFAULT_VARIANT_TITLE = "Default Title";

async function cartRequest<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  // headers() only exists inside a request; scripts/tests get no buyer IP.
  const buyerIp =
    getShopifyMode() === "live" ? await getBuyerIp().catch(() => null) : null;
  return shopifyFetch<T>({ query, variables, buyerIp });
}

function mapCartLine(line: ShopifyCartLine): CartItem | null {
  const m = line.merchandise;
  // Only ProductVariant merchandise is selected; anything else arrives empty.
  if (!m?.id || !m.product) return null;
  const image = m.image ?? m.product.featuredImage;
  return {
    lineId: line.id,
    variantId: m.id,
    productSlug: m.product.handle,
    productTitle: m.product.title,
    variantTitle:
      m.title && m.title !== DEFAULT_VARIANT_TITLE ? m.title : undefined,
    productImage: image ? mapImage(image, m.product.title) : undefined,
    unitPrice: mapMoney(line.cost.amountPerQuantity),
    lineTotal: mapMoney(line.cost.totalAmount),
    quantity: line.quantity,
    maxQuantity: maxCartQuantity(m.quantityAvailable),
    available: m.availableForSale,
  };
}

export function mapCart(cart: ShopifyCart): Cart {
  return {
    id: cart.id,
    items: cart.lines.nodes
      .map(mapCartLine)
      .filter((item): item is CartItem => item !== null),
    totalQuantity: cart.totalQuantity,
    subtotal: mapMoney(cart.cost.subtotalAmount),
    checkoutUrl: cart.checkoutUrl,
  };
}

function toResult(
  mutation: string,
  payload: ShopifyCartMutationPayload | null
): CartMutationResult {
  // Null payload = the mutation itself was denied (e.g. the token lacks the
  // unauthenticated_write_checkouts scope) — an error, not a user error.
  if (!payload) throw new ShopifyError(`${mutation} returned no payload`);
  const userErrors = payload.userErrors ?? [];
  return {
    cart: payload.cart ? mapCart(payload.cart) : null,
    userErrors,
    warnings: payload.warnings ?? [],
    cartMissing:
      !payload.cart && userErrors.some((e) => e.field?.includes("cartId")),
  };
}

/** The cart, or null when Shopify doesn't know the id (expired / checked
 *  out). Throws ShopifyError when the Storefront API can't be reached. */
export async function getCartById(cartId: string): Promise<Cart | null> {
  const data = await cartRequest<{ cart: ShopifyCart | null }>(CART_QUERY, { cartId });
  return data.cart ? mapCart(data.cart) : null;
}

/** New cart with the given lines. The buyer country pre-selects Latvia as
 *  the delivery country in checkout. */
export async function createCart(lines: CartLineInput[]): Promise<CartMutationResult> {
  const data = await cartRequest<{ cartCreate: ShopifyCartMutationPayload | null }>(
    CART_CREATE_MUTATION,
    { input: { lines, buyerIdentity: { countryCode: "LV" } } }
  );
  return toResult("cartCreate", data.cartCreate);
}

/** Adds lines; Shopify merges a variant that is already in the cart into
 *  its existing line. */
export async function addCartLines(
  cartId: string,
  lines: CartLineInput[]
): Promise<CartMutationResult> {
  const data = await cartRequest<{ cartLinesAdd: ShopifyCartMutationPayload | null }>(
    CART_LINES_ADD_MUTATION,
    { cartId, lines }
  );
  return toResult("cartLinesAdd", data.cartLinesAdd);
}

export async function updateCartLines(
  cartId: string,
  lines: CartLineUpdateInput[]
): Promise<CartMutationResult> {
  const data = await cartRequest<{ cartLinesUpdate: ShopifyCartMutationPayload | null }>(
    CART_LINES_UPDATE_MUTATION,
    { cartId, lines }
  );
  return toResult("cartLinesUpdate", data.cartLinesUpdate);
}

export async function removeCartLines(
  cartId: string,
  lineIds: string[]
): Promise<CartMutationResult> {
  const data = await cartRequest<{ cartLinesRemove: ShopifyCartMutationPayload | null }>(
    CART_LINES_REMOVE_MUTATION,
    { cartId, lineIds }
  );
  return toResult("cartLinesRemove", data.cartLinesRemove);
}
