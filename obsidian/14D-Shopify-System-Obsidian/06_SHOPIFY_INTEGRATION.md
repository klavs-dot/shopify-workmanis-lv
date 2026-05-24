# 06 — Shopify integrācija

> Shopify ir commerce backend. Tas glabā produktus, krājumus, pasūtījumus, checkout. Abas mūsu aplikācijas (admin + store) sazinās ar Shopify, bet caur dažādiem API.

## Divi Shopify API

| API | Lietotājs | Nolūks |
|---|---|---|
| **Admin API** | `apps/admin` (server-only) | CRUD uz produktiem, push, krājuma atjaunošana, webhooks |
| **Storefront API** | `apps/store` (publisks read) | Lasīt produktus, izveidot cart, atgriezt checkout URL |

**Stingrs noteikums:** Storefront token drīkst būt publisks (Vercel `NEXT_PUBLIC_*`). Admin API token ir tikai server-side, **nekad** klienta JS.

## Status

- ⚠️ Shopify konts vēl nav izveidots.
- ⚠️ Storefront API tokens vēl nav.
- ⚠️ Admin API push nav iebūvēts.
- ✅ `apps/store/lib/shopify.ts` skelets ar function signatures gatavs.
- ✅ Mock data layer (`apps/store/lib/mock-products.ts`) darbojas, kamēr nav reālas Shopify.

## Storefront API klients (apps/store)

Fails: [`apps/store/lib/shopify.ts`](../../apps/store/lib/shopify.ts)

```ts
isShopifyConfigured(): boolean

fetchProducts(opts?: { category?, limit? }): Promise<Product[]>
fetchProductBySlug(slug: string): Promise<Product | null>
createCheckout(input: { items }): Promise<{ checkoutUrl }>

storefrontFetch<T>(query: string, variables): Promise<T>
```

Šobrīd funkcijas atgriežas pie mock datiem, ja env nav uzstādīts.

## Admin API integrācija (apps/admin) — TODO

Plānotie endpointi `apps/admin/src/app/api/shopify/`:

| Endpoint | Mērķis |
|---|---|
| `POST /api/shopify/push-product` | Pārsūta vienu produktu uz Shopify (create/update) |
| `POST /api/shopify/bulk-publish` | Bulk push N produktus |
| `POST /api/shopify/webhooks/orders/create` | Saņem pasūtījuma notikumus → atjauno admin DB |
| `POST /api/shopify/webhooks/orders/paid` | Saņem maksājuma apstiprinājumu |
| `GET /api/shopify/health` | Pārbauda saiti |

## Product mapping (admin → Shopify → store)

```
admin Firestore                 Shopify                   store (UI)
─────────────────────────       ──────────────────        ──────────────────
enrichedTitle              →    title (LV locale)
enrichedTitleEn            →    title (EN locale)
enrichedTitleRu            →    title (RU locale)
descriptionLv              →    body_html (LV locale)
descriptionEn              →    body_html (EN locale)
descriptionRu              →    body_html (RU locale)
finalPrice                 →    variants[0].price                            → product.price
referencePrice (ja >)      →    variants[0].compare_at_price                 → product.compareAtPrice
images[]                   →    media.images[]                               → product.images[]
categoryName               →    tags + collection                            → product.categorySlug
customerNote (publisks)    →    metafield "customer_note"                    → red banner
condition                  →    metafield "condition"                        → product.condition
manifestSku                →    metafield "manifest_sku" (iekšēji)           (NEnonāk store)
                                                                              
                                Shopify status:
                                  availableForSale = true                    → product.availability
                                  totalInventory                              → product.stockQty
```

## Storefront GraphQL queries (placeholder)

Tipiska produktu fetch query:

```graphql
query ProductsByCategory($collection: String!, $first: Int!) {
  collection(handle: $collection) {
    products(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          tags
          images(first: 10) {
            edges {
              node {
                url
                altText
                width
                height
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                price { amount currencyCode }
                compareAtPrice { amount currencyCode }
                availableForSale
              }
            }
          }
          metafield(namespace: "14d", key: "condition") {
            value
          }
        }
      }
    }
  }
}
```

## Cart + checkout

Plūsma:

```
1. Klients spied "Pievienot grozam" → lokāls state (LocalStorage)
2. Klients atver /cart → rāda lokālo cart saturu
3. Klients spied "Pirkt" → server action izsauc Shopify cartCreate mutation
4. Saņemam cart.checkoutUrl → redirect uz Shopify hosted checkout
5. Klients pabeidz Shopify
6. Shopify webhook → admin (orders/create) → atzīmē produktu sold
```

Mēs **NE-izveidojam** pašu checkout — Shopify to dara. Tas mums dod:
- PCI compliance
- Maksājumu integrācijas (Stripe, banku saites, Apple/Google Pay)
- Pasūtījumu glabāšanu
- E-pasta apstiprinājumus

## ENV vars

`apps/store/.env.local`:
```
NEXT_PUBLIC_STORE_DOMAIN=mystore.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=...
SHOPIFY_API_VERSION=2025-04
NEXT_PUBLIC_SITE_URL=https://14d.lv
```

`apps/admin/.env.local` (nākotnē):
```
SHOPIFY_STORE_DOMAIN=mystore.myshopify.com
SHOPIFY_ADMIN_API_TOKEN=...    # SERVER-ONLY
SHOPIFY_API_VERSION=2025-04
SHOPIFY_WEBHOOK_SECRET=...
```

## Saistītās piezīmes

- [[00_PROJECT_OVERVIEW]]
- [[05_PRODUCT_WORKFLOW]]
- [[10_NEXT_STEPS]]
