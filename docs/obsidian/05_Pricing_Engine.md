# 05 — Pricing Engine

Implementācija: [src/lib/pricing.ts](../../src/lib/pricing.ts).

## Loģika

```
basePrice = marketPrice != null && marketPrice > 0
  ? min(referencePrice, marketPrice)
  : referencePrice

rawSuggested = basePrice * conditionCoefficient

suggestedPrice = roundToDot99(rawSuggested)
```

## Kondicionēšanas koeficienti

| Condition         | Coefficient |
| ----------------- | ----------- |
| `brand_new`       | 0.50 |
| `open_box`        | 0.40 |
| `damaged_package` | 0.30 |
| `untested`        | 0.20 |
| `damaged_product` | 0.10 |

## .99 noapaļošana

`roundToDot99(5.40) = 5.99`
`roundToDot99(5.99) = 5.99`
`roundToDot99(6.00) = 6.99`
`roundToDot99(0.30) = 0.99`

## Recommended action

| Cena                       | Action               |
| -------------------------- | -------------------- |
| condition = damaged_product | `outlet`             |
| < 5 EUR                    | `bundle`             |
| 5 – 10 EUR                 | `manual_review`      |
| ≥ 10 EUR                   | `sell_individually`  |

## Kur tiek pielietots

- **Pie importa** ([src/lib/firestore/products.ts](../../src/lib/firestore/products.ts) → `bulkInsertProductsForPallet`): katram produktam tiek aprēķināts `suggestedPrice` un `finalPrice` (sākotnēji vienādi) un `recommendedAction`.
- **Pie kondicionēšanas maiņas** produktu detalizētajā skatā: pārrēķina `suggestedPrice` un atjauno `finalPrice` ja lietotājs nav manuāli pārrakstījis (vienkāršais MVP rāda jauno suggested kā default).
- **Pie marketPrice ievades** — pārrēķina ar jauno bāzi.

## Pārvarēšana

Final cena vienmēr ir manuāli pārrakstāma `/products/[id]` lapā. Pricing engine ir ieteikums, ne konstanta.

## Pārbaude

Pricing engine ir tīrs funkcijas modulis bez Firebase atkarībām, tāpēc var pārklāt ar unit testiem (skat [[10_TODO]]).
