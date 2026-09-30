// GraphQL documents for the Storefront API. Fragments are plain strings and
// every document appends exactly the fragments it spreads (GraphQL rejects
// duplicate or unused fragment definitions).
//
// @inContext(country: LV, language: LV) makes Shopify Markets return EUR
// prices and LV translations; stores without those simply ignore it.
//
// Product metafields read here must be exposed to the Storefront API in
// Shopify Admin → Settings → Custom data → Products (Storefront access):
//   custom.condition      single line text, one of the ProductCondition values
//   custom.customer_note  multi-line text, shown to shoppers as plain text

export const MONEY_FRAGMENT = /* GraphQL */ `
  fragment Money on MoneyV2 {
    amount
    currencyCode
  }
`;

export const IMAGE_FRAGMENT = /* GraphQL */ `
  fragment ProductImage on Image {
    url
    altText
    width
    height
  }
`;

export const PRODUCT_CARD_FRAGMENT = /* GraphQL */ `
  fragment ProductCard on Product {
    id
    handle
    title
    vendor
    availableForSale
    publishedAt
    tags
    description
    seo {
      description
    }
    images(first: 2) {
      nodes {
        ...ProductImage
      }
    }
    collections(first: 10) {
      nodes {
        handle
      }
    }
    selectedOrFirstAvailableVariant {
      id
      availableForSale
      quantityAvailable
      price {
        ...Money
      }
      compareAtPrice {
        ...Money
      }
    }
    condition: metafield(namespace: "custom", key: "condition") {
      value
    }
    customerNote: metafield(namespace: "custom", key: "customer_note") {
      value
    }
  }
`;

export const PRODUCT_DETAIL_FRAGMENT = /* GraphQL */ `
  fragment ProductDetail on Product {
    ...ProductCard
    descriptionHtml
    gallery: images(first: 20) {
      nodes {
        ...ProductImage
      }
    }
  }
`;

const PRODUCT_CARD_FRAGMENTS =
  PRODUCT_CARD_FRAGMENT + IMAGE_FRAGMENT + MONEY_FRAGMENT;

/** Paginated catalog snapshot, newest first. `available_for_sale:true`
 *  keeps sold one-off items from eating into the page budget. */
export const CATALOG_PRODUCTS_QUERY =
  /* GraphQL */ `
  query CatalogProducts($first: Int!, $after: String)
  @inContext(country: LV, language: LV) {
    products(
      first: $first
      after: $after
      sortKey: CREATED_AT
      reverse: true
      query: "available_for_sale:true"
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ...ProductCard
      }
    }
  }
` + PRODUCT_CARD_FRAGMENTS;

/** Single product by handle — includes sold items (direct URLs keep
 *  working and show "Pārdots"). */
export const PRODUCT_BY_HANDLE_QUERY =
  /* GraphQL */ `
  query ProductByHandle($handle: String!)
  @inContext(country: LV, language: LV) {
    product(handle: $handle) {
      ...ProductDetail
    }
  }
` + PRODUCT_DETAIL_FRAGMENT + PRODUCT_CARD_FRAGMENTS;

export const PRODUCT_RECOMMENDATIONS_QUERY =
  /* GraphQL */ `
  query ProductRecommendations($productId: ID!)
  @inContext(country: LV, language: LV) {
    productRecommendations(productId: $productId) {
      ...ProductCard
    }
  }
` + PRODUCT_CARD_FRAGMENTS;

/** Collections carry the optional category cover image (handle === category
 *  slug from lib/categories.ts). */
export const COLLECTIONS_QUERY =
  /* GraphQL */ `
  query Collections @inContext(country: LV, language: LV) {
    collections(first: 100) {
      nodes {
        handle
        title
        image {
          ...ProductImage
        }
      }
    }
  }
` + IMAGE_FRAGMENT;

// ---------------------------------------------------------------------------
// Cart — shared selection for the cart query and the cartCreate /
// cartLinesAdd / cartLinesUpdate / cartLinesRemove mutations. Documents that
// spread ...CartFields must append CART_FRAGMENTS once.
// ---------------------------------------------------------------------------

export const CART_FRAGMENT = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        ...Money
      }
      totalAmount {
        ...Money
      }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost {
          totalAmount {
            ...Money
          }
          amountPerQuantity {
            ...Money
          }
          compareAtAmountPerQuantity {
            ...Money
          }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            availableForSale
            quantityAvailable
            price {
              ...Money
            }
            image {
              ...ProductImage
            }
            product {
              id
              handle
              title
              featuredImage {
                ...ProductImage
              }
            }
          }
        }
      }
    }
  }
`;

/** CART_FRAGMENT plus the fragments it spreads. */
export const CART_FRAGMENTS = CART_FRAGMENT + MONEY_FRAGMENT + IMAGE_FRAGMENT;

/** userErrors / warnings selection shared by all cart mutations. */
export const CART_MUTATION_ERRORS = /* GraphQL */ `
  userErrors {
    field
    message
    code
  }
  warnings {
    code
    message
    target
  }
`;

// Every cart document runs with the same @inContext as the catalog so line
// prices match the product pages (EUR on the real store). All of them are
// sent uncached (cache: "no-store") by lib/shopify/cart.ts.

export const CART_QUERY =
  /* GraphQL */ `
  query Cart($cartId: ID!) @inContext(country: LV, language: LV) {
    cart(id: $cartId) {
      ...CartFields
    }
  }
` + CART_FRAGMENTS;

export const CART_CREATE_MUTATION =
  /* GraphQL */ `
  mutation CartCreate($input: CartInput!)
  @inContext(country: LV, language: LV) {
    cartCreate(input: $input) {
      cart {
        ...CartFields
      }
      ${CART_MUTATION_ERRORS}
    }
  }
` + CART_FRAGMENTS;

export const CART_LINES_ADD_MUTATION =
  /* GraphQL */ `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!)
  @inContext(country: LV, language: LV) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      ${CART_MUTATION_ERRORS}
    }
  }
` + CART_FRAGMENTS;

export const CART_LINES_UPDATE_MUTATION =
  /* GraphQL */ `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!)
  @inContext(country: LV, language: LV) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      ${CART_MUTATION_ERRORS}
    }
  }
` + CART_FRAGMENTS;

export const CART_LINES_REMOVE_MUTATION =
  /* GraphQL */ `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!)
  @inContext(country: LV, language: LV) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFields
      }
      ${CART_MUTATION_ERRORS}
    }
  }
` + CART_FRAGMENTS;
