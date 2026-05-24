# 10 — TODO

> Aktīvais darbu saraksts. Atjauno pēc katra loģiska posma.

## ✅ Pabeigts (visi posmi + plus)

### Bāzes infrastruktūra
- [x] Next.js 15 + TypeScript strict + Tailwind v4 + Firebase setup
- [x] Reālais Firebase projekts `shopify-workmanis` (Auth + Firestore + Storage)
- [x] Vercel projekts `shopify-workmanis-lv` ar production deploy
- [x] GitHub publisks repo `klavs-dot/shopify-workmanis-lv`
- [x] Pirmais MASTER lietotājs `klavs@globalwolfmotors.com`
- [x] Authorized domain Firebase Auth — `shopify-workmanis-lv.vercel.app`
- [x] Firebase emulatori + demo data CLI skripti

### Posmi 1-5
- [x] Posms 1 — rename + jaunais Excel parser + sidebar restrukturizācija
- [x] Posms 2 — Jobalots publiska URL fetcher ar dynamic auto-fill
- [x] Posms 3 — Manifestu kartītes ar peļņas metriku
- [x] Posms 4 — Per-product action panel (discount, note, sold, dispose)
- [x] Posms 5 — AI bagātinājums ar Claude Sonnet 4.6 (web search + fetch)

### Lielas UI un workflow izmaiņas
- [x] WORKMANIS branding + animēts robot logo (15+ animāciju slāņi)
- [x] Loģistika sadaļa starp Manifesti un Šķirošanu (in_transit → imported)
- [x] Šķirošana — sorting claims sistēma + pulsējoša sarkana indikācija
- [x] Pallet cover image no Jobalots + parādīts visās kartēs
- [x] Drag&drop upload UI Manifesti lapā
- [x] /products pārsaukts par "Produkti veikalā" — 3 kvadrātkartes ar unikāliem robotiem + bulk darbības
- [x] /approval sadaļa noņemta (per-product apstiprināšana paliek ProductActionsPanel-ā)
- [x] Darbību vēsture (`/darbibu-vesture`) visiem lietotājiem — role-aware (MASTER/ADMIN visu, WAREHOUSE savu) ar 6 mēn limit + 50/lapa pagination ([[15_Activity_History]])
- [x] Iestatījumi (`/iestatijumi`) sadaļa MASTER + ADMIN — lietotāju vadība + Shopify settings; ADMIN var pievienot tikai WAREHOUSE
- [x] Warehouse dashboard — personīga pārdošanas statistika no šķirotām paletēm + datuma filtrs ([[16_Warehouse_Dashboard]])
- [x] WAREHOUSE filtrs /products lapā — tikai produkti no claim-otām paletēm
- [x] Bulk + per-row "Pārvietot uz Utilizētajām" Stale 2+ nedēļas sadaļā
- [x] Noliktavas darbinieki (`/noliktavas-darbinieki`) — kartīšu saraksts + detaļu lapa ar datuma filtru + bonusa aprēķins ([[17_Warehouse_Workers]])
- [x] Manifesta upload pre-assignment darbiniekam ar auto-rekomendāciju (mazākā šī mēn potenciālā peļņa)
- [x] Loģistika auto-claim, kad palete saņemta un piešķirta
- [x] Manifesta kartītes — izņemta plānoto cenu summa, "Šķirotavā" vietā "Nav veikalā", piešķirtais darbinieks redzams
- [x] Admin/Master dashboard ar 4 animētiem robotiem (Investment/Sold/InStore/Disposed) + datuma filtrs + darbinieku kartītes

## Augsta prioritāte (nākamais Shopify push)

- [ ] **Shopify Admin API integrācija** — push approved produktus uz Shopify
  - `title` no `enrichedTitle` (vai fallback uz `title`)
  - `body_html` no `descriptionLv` + sarkans baneris no `customerNote`
  - `compare_at_price` = referencePrice
  - `price` = referencePrice × (1 - listingDiscountPercent/100), rounded to .99
  - `images` no `images[]`
  - `tags` no `categoryName` + manifest SKU
  - Metafield `manifest_sku`, `pallet_id`, `outlet_sale` flag
  - "Pārvietot uz Izpārdošanu" produkti dabūt `tags += "outlet-sale"` vai pievienot Shopify collection
- [ ] **Shopify webhook receiver** (`/api/shopify/webhooks/orders/create`, …)
  - Kad produkts pārdots → auto-set `listingStatus = sold`, `soldPrice`, `soldAt`
- [ ] **Shopify OAuth + vault** — Master saved store credentials, encrypted
- [ ] **Bulk publish UI** Šķirošanā — checkbox per produkts + "Publicēt veikalā N gab."

## Vidēja prioritāte

- [ ] AI: paralelizācija per-pallet route (pašlaik sequential, 25 produkti = ~20 min)
- [ ] AI: retry mehānisms — ja viens `web_fetch` falls, mēģināt vēlreiz
- [ ] AI: per-day budget cap (env `AI_DAILY_CAP_USD`)
- [ ] AI: streaming response (SSE) lai UI rāda live progress
- [ ] Image upload UI noliktavas darbiniekam (Storage rules jau gatavi)
- [ ] Bāzes unit testi `lib/pricing.ts`, `lib/manifest.ts`, `lib/jobalots.ts`, `lib/ai/enrich.ts`
- [ ] Duplicate detection pie reimporta (`asin + manifestSku`)
- [ ] Pallets `status` automātiska virzīšana
- [ ] Eksports CSV ar approved produktiem
- [ ] Password reset e-pasta plūsma
- [ ] Outlet sale page Šopify pusē (kad kāds atver `outlet.workmanis.lv` vai `/collections/outlet`)
- [ ] Backfill `listedAt` eksistējošajiem `listed_in_store` produktiem ar `updatedAt` heuristiku
- [ ] Bonusu likmes konfigurācija Iestatījumos (šobrīd hardcoded 10%)
- [ ] Re-assign palete citam darbiniekam pēc augšupielādes (atsevišķa UI Loģistikā vai Šķirotavā)

## Zema prioritāte / nākotnē

- [ ] `shopify.workmanis.lv` DNS pievienošana Vercelā (pašlaik `shopify-workmanis-lv.vercel.app`)
- [ ] Tumšais režīms
- [ ] LV / EN UI tulkojumi (pašlaik LV un dažas EN frāzes maisītas)
- [ ] Notification e-pasti (jauns liels manifests importēts, AI batch pabeigts, …)
- [ ] Loma `OUTSIDE_PHOTOGRAPHER` (limited storage upload)
- [ ] `firebase-admin.ts` stricter typed credentials
- [ ] Preview environment ENV pievienošana Vercelā (Vercel CLI `--yes` flag bugs ar preview)
- [ ] Multi-pallet dashboard analytics (top sellers, ROI per source, etc.)

## Tehniskie čeki regulāri

- `npm run typecheck`
- `npm run build`
- `npm run lint`
- Manuāls verify [[04_Manifest_Import]] ar reālu manifestu
- Manuāls verify [[06_AI_Enrichment]] ar reālu produktu
- Pārbaude, ka audit log raksta visas darbības
