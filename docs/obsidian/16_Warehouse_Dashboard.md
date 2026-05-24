# 16 — Warehouse Dashboard (`/dashboard` WAREHOUSE skats)

> `/dashboard` ir role-aware. WAREHOUSE darbiniekam tas rāda personīgu pārdošanas/inventāra statistiku no paletēm, kuras viņš ir paņēmis šķirot. MASTER/ADMIN/VIEWER joprojām redz veco kopējo pārskatu.

## Metrikas

WAREHOUSE skats rāda 4 kartes:

| Karte                       | Aprēķins                                                            |
| --------------------------- | ------------------------------------------------------------------- |
| **Pārdotas preces**         | Skaits produktiem ar `listingStatus == "sold"`, `soldAt` diapazonā |
| **Pārdotas par (EUR)**      | Σ `soldPrice` (fallback `finalPrice` → `referencePrice`)            |
| **Vēl nav pārdotas**        | Skaits produktiem `listingStatus ∈ {listed_in_store, listing_approved}`, `listedAt` diapazonā |
| **Nepārdotas vērtība (EUR)** | Σ `finalPrice` (fallback `referencePrice`)                          |

## Definīcija — "mana prece"

Prece pieder darbiniekam, ja tās palete ir viņa claim-ota:

```ts
const myPalletIds = new Set(
  pallets.filter(p => p.sortingClaimedBy === uid).map(p => p.id)
);
const myProducts = products.filter(p => myPalletIds.has(p.palletId));
```

Lēmums: izmantot `pallet.sortingClaimedBy` (nevis ieviest per-produkts `listedByUid`), jo:
- Vienkāršāk — nav backfill veciem produktiem.
- Realitāte: kurš claim-oja paleti, tas to arī šķiro un ievieto veikalā.

## Datuma filtrs

- Divi `<input type="date">` — no / līdz (ieskaitot abus galus).
- Default: pašreizējais mēnesis (1. datums → šodiena).
- Poga "Šis mēnesis" — atjauno default vērtības.
- Filtrs strādā lokāli, neatkārto Firestore vaicājumu.

## Faili

- Lapa: [src/app/dashboard/page.tsx](../../src/app/dashboard/page.tsx)
- Komponents: `WarehouseDashboard()` un `DashboardRouter()`.

## Datu plūsma

```
listPallets() ──► filter sortingClaimedBy == uid ──► myPallets
listProducts({limitTo:2000}) ──► filter palletId ∈ myPallets ──► myProducts
                                                      │
                                                      ▼
                              filter by date range ──► aggregate ──► UI
```

Pull-everything pieeja ir OK līdz ~2000 produktiem un ~100 paletēm. Pēc tam vajadzēs:
- Firestore kompozītu indeksu `pallets (sortingClaimedBy, createdAt)`.
- Per-product `sortedByUid` lauks denormalizēts iekš `bulkInsertProductsForPallet` vai `claimPalletForSorting` callback.

## Saistītie skati

- WAREHOUSE `/products` filtrē tāpat — tikai produkti no claim-otām paletēm.
- WAREHOUSE `/darbibu-vesture` rāda tikai paša darbības.

## Saistītās piezīmes

- [[13_Sorting_Claims]]
- [[14_Products_In_Store]]
- [[15_Activity_History]]
