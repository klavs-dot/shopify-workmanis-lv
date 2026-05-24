# 05 — Product Workflow

> Produkta dzīves cikls no Jobalots manifesta līdz 14d.lv klienta groza.

## Pilnais ceļš

```
[1] Manifests Excel + Jobalots URL
     │ (admin: /manifesti)
     ▼
[2] Loģistika — palete ceļā uz noliktavu
     │ (admin: /logistika)
     ▼
[3] Saņemts! → auto-claim darbiniekam (ja piešķirts)
     │ (admin auto-trigger AI bagātinājumu)
     ▼
[4] AI bagātinājums (Claude Opus 4.7)
     │ — paralelizēts 5×, izveido LV/EN/RU virsrakstus + aprakstus
     │ — atrod publiskās bildes
     │ — confidence score
     ▼
[5] Šķirošana — darbinieks pārskata + manuāli labo, ja vajag
     │ (admin: /skirosana/[id])
     │ — apstiprina, iestata cenu, atlaidi, klienta piezīmi
     ▼
[6] Listing Approved (admin)
     │
     ▼
[7] Published to Shopify (Shopify Admin API push)
     │ — TODO: vēl nav iebūvēta
     │ — produktam tiek iestatīts: availableForSale = true
     ▼
[8] Shopify produkts publisks
     │
     ▼
[9] 14d.lv lasa caur Shopify Storefront API
     │ (apps/store)
     ▼
[10] Klients pievienot grozam → Shopify checkout
     │
     ▼
[11] Pirkums pabeigts
     │
     ▼
[12] Shopify webhook → admin (atzīmē produktu kā 'sold')
     │
     ▼
[13] Warehouse darbinieks fiziski izsūta preci
     │ (admin: /dashboard — Klientiem jāizsūta)
     ▼
[14] Atzīmēts kā 'shipped' (shippedAt set)
     │ — admin: ProductActionsPanel poga
     ▼
[15] Cikls pabeigts
```

## Kāds produkts drīkst nonākt 14d.lv?

Veikalā parādās tikai produkti, kuriem ir VISI šie nosacījumi:

| Slānis | Stāvoklis |
|---|---|
| Admin `approvalStatus` | `approved` |
| Admin `listingStatus` | `listed_in_store` vai `out_of_stock` (rāda kā "Nav noliktavā") |
| Shopify | `availableForSale = true` |
| Shopify | publicēts (nav draft, nav archived) |

Ja kāds nosacījums nav izpildīts — produkts NEPARĀDĀS 14d.lv.

## Kas NEDRĪKST nonākt 14d.lv

| Stāvoklis | Iemesls |
|---|---|
| `imported` / `aiStatus = not_started` | Vēl nav AI bagātinājuma |
| `aiStatus = enrichment_pending` | Notiek apstrāde |
| `aiStatus = failed` | Jāpārbauda manuāli |
| `aiStatus = needs_review` (confidence < 0.6) | Darbiniekam jāapstiprina |
| `approvalStatus = draft` | Darbinieks vēl strādā |
| `approvalStatus = waiting_approval` | Vēl nav apstiprināts |
| `approvalStatus = rejected` / `do_not_publish` | Atzīts par nepublicējamu |
| `approvalStatus = bundle` | Tiks pārdots citā formā |
| `listingStatus = disposed` | Bojāts, utilizēts |
| `warehouseStatus = missing` / `damaged_product` | Fiziski nav vai bojāts |

## Lauki, kas NEDRĪKST pamest admin sistēmu

| Lauks | Iemesls |
|---|---|
| `purchasePrice` | Iekšējā iepirkuma cena |
| `manifestSku` | Jobalots loto numurs (komercdati) |
| `confidenceScore` | AI iekšējais score |
| `disposalReason` | Iekšējais komentārs |
| `sortingClaimedBy*` | Kurš darbinieks strādāja |
| `customerNote` (par iekšējiem) | Daži ir publiski "sarkanais baneris", citi iekšēji |
| `assignedWarehouseUid` | Iekšējais piešķīrums |
| `referencePrice` (manifesta RRP) | Iekšējais salīdzinājuma datums; veikalā rādam tikai `compareAtPrice`, ja faktiski tiek piedāvāts atlaides |

## Lauki, kas iet uz Shopify (un tādēļ uz 14d.lv)

- `enrichedTitle` (LV) / `enrichedTitleEn` / `enrichedTitleRu` → Shopify produkta nosaukums (per locale)
- `descriptionLv` / En / Ru → Shopify produkta apraksts (per locale)
- `finalPrice` → Shopify variant price
- `referencePrice` (ja `finalPrice < referencePrice`) → Shopify `compare_at_price`
- `images` → Shopify produkta bildes
- `categoryName` → Shopify collection/tag
- `customerNote` (kad ir paredzēts publiski) → Shopify metafield (red banner)

## Šobrīd

- Admin pilnībā strādā līdz 6. solim (`Published to Shopify` push nav iebūvēts).
- 14d.lv (apps/store) skeleton ir gatavs ar mock datiem.
- Posms 7 — Shopify Admin API push — ir TODO.
- Posms 9 — 14d.lv lasa caur Storefront API — ir TODO (`apps/store/lib/shopify.ts` placeholder).

Skat detalizētu plānu: [[06_SHOPIFY_INTEGRATION]] un [[10_NEXT_STEPS]].

## Saistītās piezīmes

- [[00_PROJECT_OVERVIEW]]
- [[02_DOMAINS]]
- [[06_SHOPIFY_INTEGRATION]]
- [[10_NEXT_STEPS]]
