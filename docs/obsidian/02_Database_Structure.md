# 02 — Database Structure

> Firestore kolekcijas atsevišķā Firebase projektā `shopify-workmanis*`. Nekādā gadījumā nelietot Workmanis.lv Firebase.

Visi lauki dokumentēti precīzi [src/lib/types.ts](../../src/lib/types.ts) — šis fails ir atsauces dokuments un atbilstība jāuztur sinhroni.

## `users/{uid}`

Firebase Auth UID ir dokumenta ID.

| Lauks         | Tips                                          | Apraksts |
| ------------- | --------------------------------------------- | -------- |
| `email`       | string                                        | Lietotāja e-pasts |
| `displayName` | string                                        | Pilns vārds |
| `role`        | `MASTER` \| `ADMIN` \| `WAREHOUSE` \| `VIEWER` | Loma |
| `status`      | `active` \| `disabled`                        | Aktivitātes statuss |
| `createdAt`   | Timestamp                                     | serverTimestamp |
| `updatedAt`   | Timestamp                                     | serverTimestamp |
| `createdBy`   | string \| null                                | Iepriekšējā MASTER uid |
| `lastLogin`   | Timestamp \| null                             | Auto-atjaunots, kad lietotājs ielogojas |

## `pallets/{palletId}`

| Lauks                  | Tips                                  | Apraksts |
| ---------------------- | ------------------------------------- | -------- |
| `manifestSku`          | string                                | piem. `RED19276` |
| `name`                 | string                                | Lasāmais nosaukums |
| `source`               | string                                | piem. `Jobalots` |
| `originalFileName`     | string                                | Sākotnējais Excel nosaukums |
| `totalProducts`        | number                                | Importēto rindu skaits |
| `totalReferencePrice`  | number                                | Reference cenu kopsumma |
| `currency`             | string                                | piem. `EUR`, `GBP` |
| `status`               | `PalletStatus` enum                   | imported / in_warehouse_check / in_pricing / in_approval / ready_for_shopify / published / archived |
| `createdBy`            | string                                | uid |
| `createdAt`            | Timestamp                             | |
| `updatedAt`            | Timestamp                             | |

## `products/{productId}`

| Lauks                | Tips                          | Apraksts |
| -------------------- | ----------------------------- | -------- |
| `palletId`           | string                        | Saites uz `pallets/{id}` |
| `productSku`         | string                        | Avota piegādātāja SKU |
| `manifestSku`        | string                        | Paletes SKU |
| `title`              | string                        | Produkta nosaukums |
| `description`        | string                        | Apraksts no manifesta |
| `asin`               | string                        | Amazon ASIN |
| `ean`                | string                        | EAN |
| `barcode`            | string                        | UPC/GTIN |
| `brand`              | string                        | |
| `categoryName`       | string                        | |
| `subCategoryName`    | string                        | |
| `itemQty`            | number                        | Item Qty |
| `stockQty`            | number                       | Stock Qty |
| `referencePrice`     | number                        | No manifesta |
| `referenceCurrency`  | string                        | piem. EUR |
| `marketPrice`        | number \| null                | Manuāli vai vēlāk AI |
| `suggestedPrice`     | number \| null                | Pricing engine rezultāts |
| `finalPrice`         | number \| null                | Apstiprinātā cena |
| `condition`          | `ProductCondition` enum       | brand_new / open_box / damaged_package / untested / damaged_product |
| `importStatus`       | `ImportStatus` enum           | imported / import_error / duplicate / missing_data |
| `aiStatus`           | `AiStatus` enum               | not_started / enrichment_pending / enriched / failed / needs_review |
| `approvalStatus`     | `ApprovalStatus` enum         | draft / waiting_approval / approved / rejected / bundle / outlet / do_not_publish |
| `warehouseStatus`    | `WarehouseStatus` enum        | not_checked / found / missing / damaged_package / damaged_product / tested_ok / tested_failed / needs_photo / ready |
| `images`             | string[]                      | Storage URLs |
| `sourceUrls`         | string[]                      | Vēlāk AI iegūtie product page URL |
| `confidenceScore`    | number \| null                | Vēlāk AI |
| `recommendedAction`  | `RecommendedAction` enum \| null | sell_individually / bundle / outlet / manual_review / do_not_publish |
| `shopifyProductId`   | string \| null                | Vēlāk |
| `shopifyVariantId`   | string \| null                | Vēlāk |
| `shopifyStatus`      | `ShopifyStatus` enum          | not_synced / draft / active / archived / error |
| `publishedAt`        | Timestamp \| null             | Vēlāk |
| `syncError`          | string \| null                | Vēlāk |
| `createdAt`          | Timestamp                     | |
| `updatedAt`          | Timestamp                     | |

## `auditLogs/{logId}`

| Lauks         | Tips                | Apraksts |
| ------------- | ------------------- | -------- |
| `userId`      | string              | Kas izdarīja |
| `userEmail`   | string              | Snapshot |
| `action`      | `AuditAction` enum  | manifest_imported / product_approved / role_changed / ... |
| `entityType`  | `AuditEntityType`   | pallet / product / user / system / shopify_connection |
| `entityId`    | string              | Mainītais dokuments |
| `before`      | object \| null      | Iepriekšējais stāvoklis |
| `after`       | object \| null      | Jaunais stāvoklis |
| `createdAt`   | Timestamp           | serverTimestamp |

## `shopifyConnections/{id}` (rezervēts nākotnei)

Pagaidām neaktīvs, struktūra dokumentēta [src/lib/types.ts](../../src/lib/types.ts).

## Indeksi

`firestore.indexes.json` definē šādus kompozītos indeksus:

- `products`: `palletId ASC + createdAt DESC` (paletes detalizētajam skatam)
- `products`: `approvalStatus ASC + createdAt DESC` (approval queue)
- `products`: `warehouseStatus ASC + createdAt DESC` (noliktavas filtri)

Citi indeksi (single-field) Firestore izveido automātiski.

## Saistītās piezīmes

- [[01_Tech_Stack]] — Firestore vs pārējās izvēles
- [[03_Authentication_And_Roles]] — kā lomas atspoguļojas rules
- [[05_Pricing_Engine]] — kā cena tiek aprēķināta produktā
