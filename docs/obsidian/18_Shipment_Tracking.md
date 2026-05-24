# 18 — Shipment Tracking

> Brīdis starp "klients samaksāja" un "klients dabūja paku" ir pārvaldāms manuāli — līdz Shopify integrācijai (Posms 6) ar webhook receiver. Šajā posmā pievienots `shippedAt` lauks produktam un brīdinājumu sistēma, lai neviena prece nepaliek nesisūtīta ilgāk par 3 dienām.

## Datu modelis

```ts
// src/lib/types.ts — Product interface
shippedAt: Timestamp | null;
shippedByUid: string | null;
```

- `shippedAt = null` un `listingStatus = "sold"` → atvērts sūtījums (pending).
- `shippedAt` set → sūtījums fiziski izsūtīts.

## Audit log

Jauns `AuditAction`: `product_marked_shipped` → labels.ts: "Izsūtīts klientam".

## Firestore rules

WAREHOUSE drīkst atjaunot `shippedAt` un `shippedByUid` laukus uz jebkura produkta. UI ierobežo redzamo sarakstu uz darbinieka pašu paletēm — tehniski citu darbinieku produktu izsūtīšana arī ir iespējama (mazs trust-but-verify, līdz pilnam server-side endpoint).

## Brīdinājuma slieksnis

```ts
// src/lib/warehouseStats.ts
export const SHIPMENT_OVERDUE_DAYS = 3;
```

`daysSinceSold(product) > 3` → overdue.

## Stats laukiem WorkerMonthStats

| Lauks                | Apraksts                                                          |
| -------------------- | ----------------------------------------------------------------- |
| `unshippedCount`     | Aktīvo pending sūtījumu skaits (NEFILTRĒTS pēc datuma)            |
| `unshippedValue`     | Σ soldPrice (fallback finalPrice/referencePrice) pending sūtījumi |
| `oldestUnshippedDays`| Lielākais dienu skaits pending sūtījumu vidū                      |
| `hasOverdueShipment` | `oldestUnshippedDays > 3`                                         |

> **Svarīgi:** sūtījumi NETIEK datuma-filtrēti. Admin var skatīt jebkuru mēnesi, bet pending shipment skaits paliek "tagad", jo tas ir darba slodzes signāls, ne vēsturisks ieraksts.

## UI

### Admin/Master dashboard darbinieku kartīte

```
┌───────────────────────────────────┐
│ Jānis Bērziņš    ⚠ 5d kavēts 🔴  │   ← mirgojošs sarkans badge, ja overdue
│ janis@workmanis.lv                │
├───────────────────────────────────┤
│ Veikalā  Pārdotās  Utilizētās     │
│ 120 €    450 €     30 €           │
├───────────────────────────────────┤
│ Klienti nopirkuši   5 gab. · 450 €│
│ Nav izsūtīts       3 gab. · 280 € │   ← sarkans teksts ja overdue, dzeltens citādi
│                    (vec. 5d)      │
└───────────────────────────────────┘
```

Visa kartītes border kļūst sarkans, ja `hasOverdueShipment`.

### Warehouse dashboard

Pirmā lieta, ko darbinieks redz pēc login:

```
┌────────────────────────────────────────────────────┐
│ ⚠️ Klientiem jāizsūta — 3 prece(s)    [KAVĒTS!]  │
│ Dažas preces nav izsūtītas ilgāk par 3 dienām.    │
├────────────────────────────────────────────────────┤
│ Prece            │ Pārdots    │ Cena   │ Darbība  │
├──────────────────┼────────────┼────────┼──────────┤
│ [📷] Mirror LED  │ 19.05.2026 │ 49.99 €│[📦 Izs.]│
│      LedBright   │ Pirms 5 d. │        │         │
└──────────────────┴────────────┴────────┴──────────┘
```

- Nokļūst `pendingShipments(uid, pallets, products)` no `warehouseStats.ts` — kārtots no vecākā uz jaunāko (oldest-first).
- Katra rinda ar `📦 Izsūtīts` pogu, kas:
  - Saglabā `shippedAt = serverTimestamp()`, `shippedByUid = uid`
  - Pieraksta audit log: `product_marked_shipped`
  - Atjauno sarakstu

### ProductActionsPanel

Detaļu lapā parādās jauna "Klienta sūtījums" sekcija, kad `listingStatus = sold`:

- Ja `shippedAt = null` — zila kaste ar pogu "📦 Atzīmēt kā izsūtītu".
- Ja `shippedAt` set — zaļa kaste ar "✓ Izsūtīts {datums}".

## CSS animācija

```css
/* src/app/globals.css */
.shipment-overdue {
  animation: shipment-overdue 1.1s ease-in-out infinite;
  color: white;
}
@keyframes shipment-overdue {
  0%, 100% { background-color: rgb(220 38 38); transform: scale(1);    box-shadow: 0 0 0 0   rgba(239,68,68,0.6); }
  50%      { background-color: rgb(185 28 28); transform: scale(1.04); box-shadow: 0 0 0 6px rgba(239,68,68,0); }
}
```

`prefers-reduced-motion: reduce` izslēdz animāciju (paliek statisks sarkans).

## Workflow

1. Klients samaksā Shopify (vai admins manuāli atzīmē "Pārdots") → `soldAt` set.
2. Warehouse darbinieks ieiet `/dashboard` → redz brīdinājuma kasti.
3. Saliek paku, nodod kurjeram → spied **📦 Izsūtīts**.
4. Admin redz savā dashboard, ka kartē "Nav izsūtīts" skaitlis ir nokritis.
5. Pēc 3 dienām neizsūtīta sūtījuma kartēte (gan darbinieku, gan admin) sāk mirgot sarkani — sociāls spiediens uz darbinieku, redzamība admin-am.

## Saistītās piezīmes

- [[16_Warehouse_Dashboard]]
- [[17_Warehouse_Workers]]
- [[02_Database_Structure]]
- [[07_Shopify_Integration_Future]] — pēc Shopify webhook integration `shippedAt` var aizvietot ar Shopify fulfillment status.
