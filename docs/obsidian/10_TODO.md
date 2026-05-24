# 10 — TODO

> Aktīvais darbu saraksts. Atjauno pēc katra loģiska posma.

## ✅ Pabeigts (Posmi 1-5 un Branding)

- [x] Posms 1 — `/import → /manifesti`, `/pallets → /skirosana`, `/utilizetas` jauns. Excel parser ar Image 1-6, Condition, Grade, Weight. Datu modelis paplašināts.
- [x] Posms 2 — Jobalots publiskās lapas fetcher, auto-fill purchase price + location + weight + condition.
- [x] Posms 3 — Manifestu kartītes ar iegādes summa / Total RRP / prognozēto peļņu / sold metriku / 4 filter pille pogām.
- [x] Posms 4 — Per-product action panel: discount slider, customer note, Apstiprināt / Marķēt veikalā / Marķēt pārdotu / Utilizēt + audit log.
- [x] Posms 5 — AI bagātinājums ar Claude Sonnet 4.6 (web_search + web_fetch), API routes per-product + per-pallet, UI integrācija.
- [x] WORKMANIS wordmark + animēts robots (4 CSS animāciju slāņi).
- [x] Reālais Firebase projekts + Vercel deploy + ANTHROPIC_API_KEY abos.
- [x] `shopify-workmanis-lv.vercel.app` pievienots Firebase Authorized domains.

## Augsta prioritāte (nākamais Shopify push)

- [ ] **Shopify Admin API integrācija** — push approved produktus ar:
  - `title` no `enrichedTitle`
  - `body_html` no `descriptionLv` + sarkans baneris no `customerNote`
  - `compare_at_price` = referencePrice
  - `price` = referencePrice × (1 - listingDiscountPercent/100), rounded to .99
  - `images` no `images[]`
  - `tags` no `categoryName` + manifest SKU
  - Metafield `manifest_sku` un `pallet_id`
- [ ] **Shopify webhook receiver** (`/api/shopify/webhooks/order-created` u.tml.) — kad produkts pārdots, auto-set `listingStatus = sold`, `soldPrice`, `soldAt`.
- [ ] **Shopify OAuth setup** — Master saved store credentials, encrypted, attach to vault model.
- [ ] **Bulk publish UI** Šķirošanā — checkbox per produkts + "Publicēt veikalā N gab."

## Vidēja prioritāte

- [ ] AI: paralel-izācija per-pallet route (pašlaik sequential, 25 produkti = ~20 min).
- [ ] AI: retry mehānisms — ja viens `web_fetch` falls, mēģināt vēlreiz pirms `aiStatus = failed`.
- [ ] AI: per-day budget cap (env `AI_DAILY_CAP_USD`).
- [ ] AI: streaming response (SSE) lai UI rāda progress, ne tikai "Bagātina…" spinner 60 sek.
- [ ] Image upload UI noliktavas darbiniekam (Storage rules jau gatavi) — pievienot bildes pie produkta.
- [ ] Bāzes unit testi `lib/pricing.ts`, `lib/manifest.ts`, `lib/jobalots.ts`, `lib/ai/enrich.ts`.
- [ ] Duplicate detection pie reimporta (`asin + manifestSku`).
- [ ] Pallets `status` automātiska virzīšana (`imported → in_warehouse_check → in_pricing → in_approval → ready_for_shopify → published`).
- [ ] Eksports CSV ar approved produktiem.
- [ ] Password reset e-pasta plūsma.
- [ ] Listing-status kompozīt-indekss (`listingStatus + createdAt`) ja Šķirošana sāks lēni filtrēt.

## Zema prioritāte / nākotnē

- [ ] `shopify.workmanis.lv` DNS pievienošana Vercelā (pašlaik `shopify-workmanis-lv.vercel.app`).
- [ ] Tumšais režīms.
- [ ] LV / EN UI tulkojumi.
- [ ] Notification e-pasti (jauns liels manifests importēts, AI batch pabeigts, …).
- [ ] Loma `OUTSIDE_PHOTOGRAPHER` (limited storage upload).
- [ ] Migrate `firebase-admin.ts` for stricter typed credentials.
- [ ] Preview environment ENV pievienošana Vercelā (mokojas ar `--yes` flag uz preview branches).

## Tehniskie čeki regulāri

- `npm run typecheck`
- `npm run build`
- `npm run lint`
- Manuāls verify [[04_Manifest_Import]] ar reālu manifestu
- Manuāls verify [[06_AI_Enrichment]] ar reālu produktu
- Pārbaude, ka audit log raksta visas darbības
