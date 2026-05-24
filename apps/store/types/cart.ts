import type { Money, Product } from "./product";

export interface CartItem {
  productSlug: string;
  /** Cached at the time of "Add to cart" so the cart row renders even if the
   *  product is later updated server-side. The checkout call still hits
   *  Shopify with the authoritative variantId. */
  productTitle: string;
  productImage?: string;
  unitPrice: Money;
  quantity: number;
  /** Shopify variant id — required when we wire up the real checkout. */
  variantId?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: Money;
  /** Shopify-hosted checkout URL, populated when checkout is created. */
  checkoutUrl?: string;
}

export const EMPTY_CART: Cart = {
  items: [],
  subtotal: { amount: 0, currency: "EUR" },
};

export function cartItemFromProduct(
  product: Pick<Product, "slug" | "title" | "images" | "price">,
  quantity = 1
): CartItem {
  return {
    productSlug: product.slug,
    productTitle: product.title,
    productImage: product.images[0]?.url,
    unitPrice: product.price,
    quantity,
  };
}
