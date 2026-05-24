# 04 — Manifesti (imports + Jobalots fetcher)

> Lapa sākotnēji saucās `/import`. Posmā 1 (commit `fd3655b`) pārdēvēta par `/manifesti` ar pilnu kartīšu workflow.

## Workflow

1. ADMIN vai MASTER atver `/manifesti`.
2. Ievada paletes nosaukumu, avotu (`Jobalots`), izvēlas `.xlsx` failu un (opcionāli) ielīmē **Jobalots publisko URL**.
3. URL → auto-fetch (debounced 600ms) parāda emerald preview kartiņu ar cover image, latest bid, RRP, location, weight, condition. Auto-fill purchase price + pallet name, ja vēl nav.
4. `parseManifestWorkbook` ([src/lib/manifest.ts](../../src/lib/manifest.ts)) izlasa Excel.
5. Tiek izveidota `pallets/{id}` ar agregātiem **plus** Jobalots metadata, ja URL bija ievadīts.
6. Produkti tiek iesisti `products` ar batched writes (max 400 / batch).
7. Katram produktam uzreiz `suggestedPrice` un `recommendedAction` (skat [[05_Pricing_Engine]]).
8. Audit log ieraksts ar action `manifest_imported`.
9. Apakšā parādās jaunā paletes "kartīte" ar peļņas metriku un 4 filter pille pogām.

## Atpazītās Excel kolonnas

`COLUMN_ALIASES` definē aliasus (case-insensitive). Posmā 1 paplašināts atbalstīt bagātāku Jobalots schema:

| Mūsu lauks | Tipiskie virsraksti | Komentārs |
|---|---|---|
| `productSku` | Product SKU, SKU | |
| `manifestSku` | Manifest SKU | |
| `title` | Product Title, Title, Name | |
| `description` | Product Description, Description | |
| `asin` | ASIN | |
| `ean` | EAN | |
| `barcode` | Barcode, UPC, GTIN | |
| `brand` | Brand, Manufacturer | |
| `categoryName` | Category Name, Category | |
| `subCategoryName` | Sub Category Name, Subcategory | |
| `itemQty` | **Quantity**, Item Qty, Qty | "Quantity" tagad ir primārais |
| `stockQty` | Stock Qty, Stock | |
| `weightKg` | Unit Weight (kg), Weight | **JAUNS** Posmā 1 |
| `grade` | Grade | **JAUNS** Posmā 1 |
| `conditionRaw` | Condition | **JAUNS**, mapets caur `normalizeCondition()` uz `ProductCondition` |
| `unitPrice` | **Unit RRP**, Reference Price, RRP, MSRP | "Unit RRP" tagad primārais |
| `totalPrice` | **Total RRP**, Total Price | **JAUNS** Posmā 1 |
| `currency` | Currency, Reference Price Currency | |
| **Image 1..6** | `Image 1`, `Image 2`, …, `Image 6` | **JAUNS** Posmā 1, glabā Jobalots S3 URL masīvā `manifestImages[]` |

## Jobalots URL auto-fetcher (Posms 2)

`src/lib/jobalots.ts` apstrādā publisko aukcijas lapu. Jobalots ir Next.js app — pilna auction info ir `self.__next_f.push([..., "..."])` RSC chunks. Pieeja:

1. Recombine visus chunk strings (`JSON.parse` katra)
2. Atrast `"result":{` un balance braces līdz pilnam auction JSON sub-objektam
3. Pārbaudīt, ka tas satur `sku` + `reserve_price` (auction signature)
4. Izvilkt:
   - `title`, `rrp`, `reserve_price`, `start_bid_price`, `latest_bid_price` (= purchasePrice)
   - `currency`, `location`, `country_iso`, `weight`, `qty`, `bid_count`
   - `start_at`, `end_at`
   - `image_url` (cover, skip placeholders)
   - `vendor_details.trading_name`
   - `current_bid.user_details.name` (winner, ja konts pats vinnēja)
   - **Condition** no nested `manifest.manifest_condition[0].manifest_condition_type.translations[0].title` (prefer English `language_id == 1`)

API: `GET /api/jobalots/lookup?url=<jobalots-auction-url>` (Node runtime, no-cache, MASTER/ADMIN nav nepieciešams jo info ir publiska, tikai prasa sign-in).

Test: `npx tsx scripts/test-jobalots.ts <url>` vai `FROM_FILE=/tmp/jobalots.html npx tsx scripts/test-jobalots.ts <url>`.

## Sync no Jobalots (vēlāk)

`/skirosana/[id]` header tagad ir **↻ Sync no Jobalots** poga (managePallets permission). Klikšķis pārpilda iegādes summu, location, weight, condition no live Jobalots lapas + audit log entry `pallet_jobalots_synced`. Noderīgi, ja:
- Sākotnēji importēji bez URL, vēlāk to pievienoji
- Jobalots aukcija turpinās un cena mainās
- Tu gribi pārliecināties, ka manuālā iegādes summa ir patiesa

## Manifesta piemēri (gan vecais, gan jaunais formāts strādā)

| Fails | Manifest SKU | Rindas | Total RRP | Komentārs |
|---|---|---|---|---|
| `MF-47-ndBAUze.xlsx` | RED19276 | 13 | €3,306 | Vecais formāts (Reference Price, Item Qty), bet ar Image 1-6 ir |
| `MF-47-UWIkWUQ.xlsx` | YELLOW30026 | 24 | €2,089 | Jaunais formāts (Unit RRP / Quantity / Condition) |

Test ar `npx tsx scripts/test-parser.ts /Users/klavs/Downloads/MF-47-UWIkWUQ.xlsx`.

## Drošības robežas

- Failu apstrāde notiek **klienta pusē** (ArrayBuffer → SheetJS). Nekas neaizplūst uz serveri.
- Tikai pēc parsing, klients ar saviem kredentiāliem raksta Firestore (saskaņā ar rules — MASTER vai ADMIN).
- Jobalots `/api/jobalots/lookup` ir server-side fetch ar `cache-control: no-store`. Tas atklāj tikai publiskos auction datus, nekas privāts no tā konta.

## Iespējamās kļūdas

| Kļūda | Cēlonis | Risinājums |
|---|---|---|
| "Failā nav neviena darblapa" | Bojāts xlsx | Pārlādē |
| "Darblapa Worksheet ir tukša" | Aizsargāts vai cita lapa | Pārkārto Excel |
| "Trūkst Product Title rindā N" | Trūkst datu | UI summary parāda "missingData" |
| "Jobalots URL formāts nav derīgs" | Nepareizs URL pattern | Sagaida `https://jobalots.com/<lang>/products/<SKU>` |
| "Lookup neizdevās: HTTP 403" | Jobalots layout mainījies / Cloudflare | Atkārtot manuāli ievadot iegādes summu |
| "Atpazītais auction objekts nav īstais" | Jobalots Next.js struktūra mainījusies | Atjaunot parser regex |

## Nākamie soļi

Skat [[10_TODO]] — piem., duplicate-detection pēc `asin + manifestSku`, ja vajadzēs reimportēt manifestu.
