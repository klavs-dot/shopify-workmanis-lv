# 14 — Produkti veikalā (3 kategorijas + bulk darbības)

> Ieviests 2026-05-24. Pārsauca `/products` lapu par "Produkti veikalā" (sidebar label) un pārveidoja par 3-kartīšu dashboard ar dzīves cikla atlases logiku.

## Mērķis

Pārvaldīt produktus, kas jau ir veikalā (`listingStatus === "listed_in_store"`) pēc to vecuma veikalā. Atklāt stagnējošas preces un pielietot bulk atlaides / pārvietot uz Izpārdošanu, pirms tās zaudē vērtību.

## 3 kategorijas

Aprēķins notiek client-side no `Product.listedAt` (vai `createdAt` kā fallback):

```
ageDays = (now - (listedAt ?? createdAt)) / 86_400_000

ageDays  <  7   → "Preces pārdošanā"               (Selling, emerald)
7  ≤  ageDays  <  14   → "Neviens nepērk nedēļu"   (Stale 1w, amber)
14  ≤  ageDays           → "Neviens nepērk 2 nedēļas"  (Stale 2w, red)
```

## UI

`/products` landing — 3 kvadrāta kartes (`aspect-square`), `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.

Katrai kartei:
- **Title** augšā ar krāsu pēc kategorijas
- **Unikāls animēts robots** centrā (3 atšķirīgi mascots)
- **Skaitlis + "produkti"** apakšā

Klikšķis uz karti → `?bucket=selling | stale_week | stale_two_weeks` query param → detalizēts list view ar bulk action toolbar (selling kategorijai bulk actions nav, jo tās ir svaigas preces).

## Robotu mascots

Visi 3 robotu komponenti dzīvo [src/components/RobotMascots.tsx](../../src/components/RobotMascots.tsx). Pure SVG + CSS keyframes, `prefers-reduced-motion` respektēts.

| Robots | Krāsa | Pose / animācija |
|---|---|---|
| **SellingRobot** | Emerald gradient | Smaida ar puslunulīgu zīmējumu acu vietā, vicina labo roku 1.2s ciklā, kreisajā rokā tur dzeltenu pirkumu somu ar sparkles ap to, antena gaiši zaļa |
| **StaleWeekRobot** | Amber gradient | Satraucošu seju ar mazām, augstāk noliktām acīm, sviedru piliens ielāgo galvu (2s), tur pulksteni ar rotējošu minūšu rādītāju (1.5s), kāja tap (0.5s) |
| **StaleTwoWeeksRobot** | Red gradient | Šokā — plati atvērtas X-formas acis, atvērta mute, lieli ! virs galvas pulsē (0.6s), korpuss šūpojas (0.35s), abas rokas paceltas un vicina, alarm uguns uz krūtīm |

## Bulk darbības (tikai stale_week + stale_two_weeks)

Trīs bulk akcijas pielietojamas vai nu visam bucket vai izvēlētajiem (checkbox):

| Darbība | Efekts | Audit action |
|---|---|---|
| **Pievienot papildu atlaidi** (slider 5-90%, default 20%, quick chips 20/30/50) | `finalPrice *= (1 - x/100)` ar `.99` noapaļošanu + `listingDiscountPercent += x` (max 99) | `product_bulk_discount_applied` |
| **Iestatīt vienotu cenu** (text input EUR) | `finalPrice = x` | `product_bulk_price_set` |
| **Pārvietot uz Izpārdošanu** | `outletSaleAt = serverTimestamp()` (Shopify integrācijā nozīmē produkts iet "Sale" collection) | `product_moved_to_outlet_sale` |

Pieejamas tikai ar `changePrice` atļauju (MASTER + ADMIN).

Visi confirmu ar `window.confirm()`, sequential update Firestore-ā (small N, max 100-1000 produkti, neoptimizēts batch — vēlāk var pārveidot par `writeBatch`).

## Datu modelis (jauni lauki)

`Product`:

| Lauks | Tips | Apraksts |
|---|---|---|
| `listedAt` | `Timestamp \| null` | Kad pirmoreiz tika atzīmēts kā `listed_in_store`. Pārstartējas pie re-listing. |
| `outletSaleAt` | `Timestamp \| null` | Kad pārvietots uz veikala Izpārdošanas sadaļu. `null` = nav Izpārdošanā. |

`ProductActionsPanel.markListed()` tagad automātiski raksta `listedAt = serverTimestamp()`, kad `listingStatus → listed_in_store`.

## Audit actions

- `product_bulk_discount_applied` — `after: { extraDiscountPct, newPrice }`
- `product_bulk_price_set` — `after: { newPrice }`
- `product_moved_to_outlet_sale` — `after: { from: bucket }`

## Eksistējošās preces

Produktiem, kas tika atzīmēti `listed_in_store` PIRMS šī commit, `listedAt` būs `null`. Bucket-logika izmanto `createdAt` kā fallback, tāpēc tie pareizi nonāks atbilstošā bucket bez datu migrācijas.

Ja vēlies precīzu listedAt eksistējošajiem produktiem, var palaist backfill skriptu (vēl nav uzrakstīts — TODO).

## Saistītās piezīmes

- [[02_Database_Structure]] — `listedAt`, `outletSaleAt`, jaunie audit actions
- [[12_Branding]] — krāsu shēma un animāciju filozofija (motion-safe)
- [[13_Sorting_Claims]] — claim sistēma Šķirošanā (līdzīga pulsācijas pieeja)
