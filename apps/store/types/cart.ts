import type { Money, ProductImage } from "./product";

// 14d.lv cart model. The cart itself lives in Shopify (Storefront Cart API);
// the browser only keeps its id in the httpOnly "14d_cart" cookie, and
// lib/shopify maps the Storefront cart into these shapes on every read.
// Payment happens in the Shopify-hosted checkout (Cart.checkoutUrl).

export interface CartItem {
  /** Shopify cart line GID — what cartLinesUpdate / cartLinesRemove take. */
  lineId: string;
  /** Shopify variant GID (the line's merchandise). */
  variantId: string;
  productSlug: string;
  productTitle: string;
  /** Variant name; undefined for single-variant products ("Default Title"). */
  variantTitle?: string;
  productImage?: ProductImage;
  unitPrice: Money;
  /** Line cost as Shopify computes it (unit price × quantity). */
  lineTotal: Money;
  quantity: number;
  /** Highest quantity this line may have — see maxCartQuantity(). */
  maxQuantity: number;
  /** False when the item sold out after it was added to the cart. */
  available: boolean;
}

export interface Cart {
  /** Shopify cart GID (stored in the "14d_cart" cookie). */
  id: string;
  items: CartItem[];
  totalQuantity: number;
  /** Before delivery — delivery is chosen in the Shopify checkout. */
  subtotal: Money;
  /** Shopify-hosted checkout for this cart. */
  checkoutUrl: string;
}

/** Most 14D listings are one-off items, so a cart line holds one unit unless
 *  Shopify reports more than one in stock (variant.quantityAvailable). When
 *  Shopify hides the stock level (null) the one-unit rule applies. */
export function maxCartQuantity(quantityAvailable: number | null | undefined): number {
  return typeof quantityAvailable === "number" && quantityAvailable > 1
    ? Math.floor(quantityAvailable)
    : 1;
}
