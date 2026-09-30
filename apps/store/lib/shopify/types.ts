// Raw Storefront API response shapes — exactly what the GraphQL documents
// in ./queries.ts select, nothing more. Mapped into the app types
// (@/types/product etc.) by ./mappers.ts; UI code never sees these.

export interface ShopifyMoney {
  /** Decimal string, e.g. "19.99". */
  amount: string;
  currencyCode: string;
}

export interface ShopifyImage {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}

export interface ShopifyMetafieldValue {
  value: string;
}

export interface ShopifyConnection<T> {
  nodes: T[];
}

export interface ShopifyPageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface ShopifyProductVariant {
  id: string;
  availableForSale: boolean;
  /** Null when the token lacks unauthenticated_read_product_inventory or
   *  inventory isn't tracked. */
  quantityAvailable: number | null;
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
}

/** Fields selected by PRODUCT_CARD_FRAGMENT (lists, cards, related). */
export interface ShopifyProductCard {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  availableForSale: boolean;
  publishedAt: string;
  tags: string[];
  /** Plain text (Shopify strips the HTML). */
  description: string;
  seo: { description: string | null } | null;
  images: ShopifyConnection<ShopifyImage>;
  collections: ShopifyConnection<{ handle: string }>;
  selectedOrFirstAvailableVariant: ShopifyProductVariant | null;
  /** custom.condition — one of the ProductCondition values. */
  condition: ShopifyMetafieldValue | null;
  /** custom.customer_note — plain text shown to shoppers. */
  customerNote: ShopifyMetafieldValue | null;
}

/** Fields selected by PRODUCT_DETAIL_FRAGMENT (product page). */
export interface ShopifyProductDetail extends ShopifyProductCard {
  descriptionHtml: string;
  gallery: ShopifyConnection<ShopifyImage>;
}

export interface ShopifyCollection {
  handle: string;
  title: string;
  image: ShopifyImage | null;
}

// ---- Cart (selected by CART_FRAGMENT) ----

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  cost: {
    totalAmount: ShopifyMoney;
    amountPerQuantity: ShopifyMoney;
    compareAtAmountPerQuantity: ShopifyMoney | null;
  };
  /** ProductVariant is the only merchandise type the store sells. */
  merchandise: {
    id: string;
    title: string;
    availableForSale: boolean;
    quantityAvailable: number | null;
    price: ShopifyMoney;
    image: ShopifyImage | null;
    product: {
      id: string;
      handle: string;
      title: string;
      featuredImage: ShopifyImage | null;
    };
  };
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: ShopifyMoney;
    totalAmount: ShopifyMoney;
  };
  lines: ShopifyConnection<ShopifyCartLine>;
}

export interface ShopifyUserError {
  field: string[] | null;
  message: string;
  code: string | null;
}

export interface ShopifyCartWarning {
  code: string;
  message: string;
  target: string;
}

/** Common payload of cartCreate / cartLinesAdd / cartLinesUpdate /
 *  cartLinesRemove. */
export interface ShopifyCartMutationPayload {
  cart: ShopifyCart | null;
  userErrors: ShopifyUserError[];
  warnings?: ShopifyCartWarning[];
}
