// Public surface of the Shopify data layer (server-only). Pages, server
// components and server actions import from "@/lib/shopify"; the modules
// behind it are implementation detail.
//
// IMPORTANT: this layer only ever talks to the Storefront API (catalog read +
// cart). Admin API access lives in apps/admin and must never be imported
// here — the access scope leak would be a major security problem.
//
//   config.ts   env → mode ("mock" | "mock-shop" | "live"), endpoint, token
//   client.ts   shopifyFetch (auth headers, errors), cachedCatalogRead
//               (data cache for catalog reads), getBuyerIp
//   queries.ts  GraphQL documents + fragments (catalog and cart)
//   types.ts    raw Storefront response shapes
//   mappers.ts  Storefront → app types (Product, Money, ProductImage)
//   catalog.ts  catalog reads used by pages (mock fallback built in)
//   cart.ts     Storefront Cart API operations (stateless, take a cart id)
//   cart-session.ts  "14d_cart" cookie + the current shopper's cart

export {
  getShopifyConfig,
  getShopifyMode,
  isShopifyConfigured,
  type ShopifyConfig,
  type ShopifyMode,
} from "./config";

export {
  CATALOG_REVALIDATE_SECONDS,
  SHOPIFY_TAGS,
  ShopifyError,
  cachedCatalogRead,
  getBuyerIp,
  shopifyFetch,
  type ShopifyCatalogTag,
  type ShopifyFetchOptions,
} from "./client";

export {
  getCategories,
  getCategoryProducts,
  getFeaturedProducts,
  getProductBySlug,
  getProductSlugs,
  getProducts,
  getRelatedProducts,
  type CategoryListResult,
  type CategoryWithCount,
  type ProductListResult,
} from "./catalog";

export {
  addCartLines,
  createCart,
  getCartById,
  mapCart,
  removeCartLines,
  updateCartLines,
  type CartLineInput,
  type CartLineUpdateInput,
  type CartMutationResult,
} from "./cart";

export {
  CART_COOKIE,
  clearCartId,
  getCart,
  hasCartCookie,
  readCartId,
  saveCartId,
  type CartState,
} from "./cart-session";

export { htmlToPlainText, mapImage, mapMoney, mapProduct } from "./mappers";

export { CART_FRAGMENT, CART_FRAGMENTS, CART_MUTATION_ERRORS } from "./queries";

export type {
  ShopifyCart,
  ShopifyCartLine,
  ShopifyCartMutationPayload,
  ShopifyCartWarning,
  ShopifyImage,
  ShopifyMoney,
  ShopifyUserError,
} from "./types";
