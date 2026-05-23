# 07 — Shopify Integration (Future)

> Pagaidām neaktīvs. Tikai datu lauki + UI placeholders. Pilnu integrāciju veidosim pēc MVP.

## Plāns

- Connect MASTER vai ADMIN Shopify Admin API ar privātās aplikācijas access tokenu.
- Saglabā šifrētu tokenu `shopifyConnections/{id}` kolekcijā.
- Publicē produktus pa vienam vai partijā uz Shopify ar:
  - `title`
  - `description` (cleaned, LV / EN)
  - `images` (no Firebase Storage)
  - `price` = `finalPrice`
  - `sku` = `productSku`
- Saglabā `shopifyProductId`, `shopifyVariantId`, `publishedAt`.

## UI placeholders šobrīd

- Settings → Connect Shopify poga **disabled** ar tekstu “Shopify integration coming later”.
- Produkta lapā “Push to Shopify” — disabled.

## Datu lauki produktā

Skat [src/lib/types.ts](../../src/lib/types.ts):

- `shopifyProductId`
- `shopifyVariantId`
- `shopifyStatus`: `not_synced` | `draft` | `active` | `archived` | `error`
- `publishedAt`
- `syncError`

## Drošības apsvērumi

Token NEKĀD GADĪJUMĀ nedrīkst tikt nodots klientam. Visa Shopify mijiedarbība notiks server-side (API route vai Vercel cron job ar service account).

## Saistītās piezīmes

- [[02_Database_Structure]]
- [[10_TODO]]
