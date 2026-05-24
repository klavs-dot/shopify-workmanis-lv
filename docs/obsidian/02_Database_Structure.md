# 02 — Database Structure

> Firestore kolekcijas atsevišķā Firebase projektā `shopify-workmanis`. Nekādā gadījumā nelietot Workmanis.lv Firebase.

Visi lauki dokumentēti precīzi [src/lib/types.ts](../../src/lib/types.ts) — šis fails ir atsauces dokuments un atbilstība jāuztur sinhroni.

## `users/{uid}`

Firebase Auth UID ir dokumenta ID.

| Lauks | Tips | Apraksts |
|---|---|---|
| `email` | string | Lietotāja e-pasts |
| `displayName` | string | Pilns vārds |
| `role` | `MASTER` \| `ADMIN` \| `WAREHOUSE` \| `VIEWER` | Loma |
| `status` | `active` \| `disabled` | Aktivitātes statuss |
| `createdAt` | Timestamp | serverTimestamp |
| `updatedAt` | Timestamp | serverTimestamp |
| `createdBy` | string \| null | Iepriekšējā MASTER uid |
| `lastLogin` | Timestamp \| null | Auto-atjaunots login brīdī |

## `pallets/{palletId}`

Posmā 1 + 2 paplašināts Jobalots metadatiem.

| Lauks | Tips | Apraksts |
|---|---|---|
| `manifestSku` | string | piem. `YELLOW30026` |
| `name` | string | Lasāmais nosaukums |
| `source` | string | piem. `Jobalots` |
| `originalFileName` | string | Excel faila nosaukums |
| `totalProducts` | number | Importēto rindu skaits |
| `totalReferencePrice` | number | Reference RRP kopsumma |
| `currency` | string | piem. `EUR`, `GBP` |
| `jobalotsUrl` | string \| null | **Posms 2** — publiska Jobalots auction URL |
| `purchasePrice` | number \| null | **Posms 2** — iegādes summa (auto no Jobalots latest_bid_price) |
| `reservePrice` | number \| null | **Posms 2** — Jobalots reserve |
| `location` | string \| null | **Posms 2** — piem. "Poland" |
| `weightKg` | number \| null | **Posms 2** — paletes svars |
| `palletCondition` | string \| null | **Posms 2** — piem. "Customer Return" |
| `coverImage` | string \| null | Jobalots auction cover image URL (fallback: pirmā produkta manifestImage). Rāda Šķirošanas / Loģistikas / Manifestu kartītēs. |
| `sortingClaimedBy` | string \| null | **Sorting claim** — atbildīgā darbinieka uid |
| `sortingClaimedByEmail` | string \| null | Snapshot e-pasts (display, ja user-doc nav pieejams) |
| `sortingClaimedByName` | string \| null | Snapshot displayName |
| `sortingClaimedAt` | Timestamp \| null | serverTimestamp |
| `status` | `PalletStatus` enum | **in_transit** (jauns Loģistika) / imported (saņemts) / in_warehouse_check / in_pricing / in_approval / ready_for_shopify / published / archived |
| `createdBy` | string | uid |
| `createdAt` | Timestamp | |
| `updatedAt` | Timestamp | |

## `products/{productId}`

Posmā 1 + 4 + 5 būtiski paplašināts. Lauki sagrupēti pēc loģikas:

### Identitāte un manifest dati

| Lauks | Tips | Apraksts |
|---|---|---|
| `palletId` | string | Saites uz `pallets/{id}` |
| `productSku` | string | Avota piegādātāja SKU |
| `manifestSku` | string | Paletes SKU |
| `title` | string | Manifest title (raw) |
| `description` | string | Apraksts no manifesta |
| `asin` | string | Amazon ASIN |
| `ean` | string | EAN |
| `barcode` | string | UPC/GTIN |
| `brand` | string | |
| `categoryName` | string | |
| `subCategoryName` | string | |
| `itemQty` | number | Item Qty / Quantity |
| `stockQty` | number | Stock Qty |
| `weightKg` | number \| null | **Posms 1** — `Unit Weight (kg)` |
| `grade` | string \| null | **Posms 1** — manifest Grade |

### Cenas un listing

| Lauks | Tips | Apraksts |
|---|---|---|
| `referencePrice` | number | Unit RRP / Reference Price |
| `referenceCurrency` | string | EUR / GBP / USD |
| `marketPrice` | number \| null | Manuāli vai AI |
| `suggestedPrice` | number \| null | Pricing engine rezultāts |
| `finalPrice` | number \| null | Apstiprinātā cena |
| `listingDiscountPercent` | number | **Posms 4** — atlaide veikalā (default 50) |
| `customerNote` | string \| null | **Posms 4** — sarkans baneris Shopify produkta lapā ("Piezīme!! …") |
| `condition` | `ProductCondition` enum | brand_new / open_box / damaged_package / untested / damaged_product |

### Statusi (4 atsevišķi enumi)

| Lauks | Tips | Vērtības | Iemesls |
|---|---|---|---|
| `importStatus` | enum | imported / import_error / duplicate / missing_data | Import quality flag |
| `aiStatus` | enum | not_started / enrichment_pending / enriched / failed / needs_review | AI cauruļvada stāvoklis |
| `approvalStatus` | enum | draft / waiting_approval / approved / rejected / bundle / outlet / do_not_publish | Komerciāls lēmums |
| `warehouseStatus` | enum | not_checked / found / missing / damaged_package / damaged_product / tested_ok / tested_failed / needs_photo / ready | Fizisks atrastums noliktavā |
| `listingStatus` | enum | **Posms 1** — not_listed / listing_approved / listed_in_store / sold / out_of_stock / disposed | Dzīvescikls (manuāli līdz Shopify webhook integrācijai) |
| `disposalReason` | string \| null | **Posms 4** — iemesls, kāpēc utilizēts |

### Bildes (3 lauki, lai šķirtu avoti)

| Lauks | Tips | Avots |
|---|---|---|
| `manifestImages` | string[] | **Posms 1** — Image 1-6 no Excel (Jobalots S3) |
| `enrichedImages` | string[] | **Posms 5** — AI atrastās bildes (Amazon, manufacturer) |
| `images` | string[] | Merged + deduped + max 12 — UI rāda šo |

### AI bagātinājums (Posms 5)

| Lauks | Tips | Apraksts |
|---|---|---|
| `enrichedTitle` | string \| null | Cleaned English title |
| `descriptionLv` | string \| null | Shopify-ready LV apraksts |
| `descriptionEn` | string \| null | Shopify-ready EN apraksts |
| `sourceUrls` | string[] | Kur Claude atrada info |
| `confidenceScore` | number \| null | 0.0-1.0 |
| `recommendedAction` | enum \| null | sell_individually / bundle / outlet / manual_review / do_not_publish |

### Pārdošanas tracking (Posms 4)

| Lauks | Tips | Apraksts |
|---|---|---|
| `soldPrice` | number \| null | Faktiskā cena |
| `soldAt` | Timestamp \| null | serverTimestamp |

### Veikala dzīves cikls (Produkti veikalā lapa)

| Lauks | Tips | Apraksts |
|---|---|---|
| `listedAt` | Timestamp \| null | Kad produkts pirmoreiz nokļuva `listed_in_store`. Auto-uzlikts ProductActionsPanel.markListed() brīdī. Bāze 7/14-dienu bucket aprēķinam. |
| `outletSaleAt` | Timestamp \| null | Kad pārvietots uz veikala Izpārdošanas sadaļu ar bulk action. `null` = nav Izpārdošanā. |

### Shopify integrācija (vēlāk)

| Lauks | Tips | Apraksts |
|---|---|---|
| `shopifyProductId` | string \| null | Vēlāk |
| `shopifyVariantId` | string \| null | Vēlāk |
| `shopifyStatus` | enum | not_synced / draft / active / archived / error |
| `publishedAt` | Timestamp \| null | Vēlāk |
| `syncError` | string \| null | Vēlāk |

### Audit

| Lauks | Tips | |
|---|---|---|
| `createdAt` | Timestamp | |
| `updatedAt` | Timestamp | serverTimestamp pēc katras maiņas |

## `auditLogs/{logId}`

| Lauks | Tips | Apraksts |
|---|---|---|
| `userId` | string | Kas izdarīja |
| `userEmail` | string | Snapshot |
| `action` | `AuditAction` enum | manifest_imported / product_approved / role_changed / **ai_enrichment_started** / **ai_enrichment_completed** / **product_listing_approved** / **product_listed_in_store** / **product_marked_sold** / **product_marked_disposed** / **product_customer_note_set** / **product_discount_changed** / **pallet_jobalots_synced** / **pallet_received** / **pallet_sorting_claimed** / **pallet_sorting_released** / **product_moved_to_outlet_sale** / **product_bulk_discount_applied** / **product_bulk_price_set** / ... |
| `entityType` | `AuditEntityType` | pallet / product / user / system / shopify_connection |
| `entityId` | string | Mainītais dokuments |
| `before` | object \| null | Iepriekšējais stāvoklis |
| `after` | object \| null | Jaunais stāvoklis |
| `createdAt` | Timestamp | serverTimestamp |

Posmā 1 + 4 + 5 pievienoti 10+ jauni action tipi.

## `shopifyConnections/{id}` (rezervēts nākotnei)

Pagaidām neaktīvs, struktūra dokumentēta [src/lib/types.ts](../../src/lib/types.ts).

## Indeksi

`firestore.indexes.json` definē šādus kompozīt-indeksus:

- `products`: `palletId ASC + createdAt DESC`
- `products`: `approvalStatus ASC + createdAt DESC`
- `products`: `warehouseStatus ASC + createdAt DESC`

Posmā 1 pievienots jauns enum lauks `listingStatus`, bet to filtrējam klienta pusē (no `products` saraksta), tāpēc atsevišķs kompozīt-indekss vēl nav vajadzīgs. Ja `listProducts({ listingStatus: ... })` sāks laisties pārāk lēns, pievienot `listingStatus + createdAt` indeksu.

## Saistītās piezīmes

- [[01_Tech_Stack]] — Firestore vs pārējās izvēles
- [[03_Authentication_And_Roles]] — kā lomas atspoguļojas rules
- [[05_Pricing_Engine]] — kā cena tiek aprēķināta produktā
- [[06_AI_Enrichment]] — kā AI lauki aizpildās
