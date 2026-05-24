# 15 — Darbību vēsture (`/darbibu-vesture`)

> Visu sistēmas darbību ieraksti — kas, kad, ko izdarīja. Aizstāj veco MASTER-only `/masteradmin/audit` lapu ar publisku, role-aware skatu.

## Kas redz ko

| Loma      | Skats                                                   |
| --------- | ------------------------------------------------------- |
| MASTER    | Visi auditLogs ieraksti (visu lietotāju)                |
| ADMIN     | Visi auditLogs ieraksti (ieskaitot MASTER)              |
| WAREHOUSE | Tikai paša darbības (`where userId == auth.uid`)        |
| VIEWER    | "Nav pieejams" ziņojums (Firestore rules to liedz)      |

## Ierobežojumi

- **50 ieraksti lapā**, cursor-based pagination (Prev / Next).
- **Tikai pēdējie 6 mēneši** — Firestore `where("createdAt", ">=", cutoff)`.
- Veciem ierakstiem lietotājs pats nekur netiek — vienkārši nav pieejami.

## Faili

- Lapa: [src/app/darbibu-vesture/page.tsx](../../src/app/darbibu-vesture/page.tsx)
- Query helper: [src/lib/firestore/auditQuery.ts](../../src/lib/firestore/auditQuery.ts)
- Latviešu labels: [src/lib/auditLabels.ts](../../src/lib/auditLabels.ts)
- Vecā lapa → redirect: [src/app/masteradmin/audit/page.tsx](../../src/app/masteradmin/audit/page.tsx)

## Firestore rules

```rules
match /auditLogs/{logId} {
  allow read: if isMaster()
              || isAdmin()
              || (isWarehouse() && resource.data.userId == request.auth.uid);
  allow create: if isSignedIn();
  allow update, delete: if false; // append-only
}
```

## Indekss

```json
{
  "collectionGroup": "auditLogs",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

Vajadzīgs Warehouse `userId == X` + `orderBy createdAt desc` kombinācijai.

## Latviešu labels

Visām 30+ `AuditAction` vērtībām ir mapping uz cilvēkam-saprotamu latviešu tekstu — skat [src/lib/auditLabels.ts](../../src/lib/auditLabels.ts). Piemēri:

- `pallet_received` → "Palete saņemta noliktavā"
- `product_marked_disposed` → "Pārvietots uz Utilizētajām"
- `product_bulk_discount_applied` → "Bulk atlaide pielietota"

## UI

```
┌────────────────────────────────────────────────────────────────┐
│ Darbību vēsture                                                │
│ Visu lietotāju darbības (pēdējie 6 mēneši). Pa 50 lapā.        │
├────────────────────────────────────────────────────────────────┤
│ Laiks            | Lietotājs       | Darbība              | … │
│ 24.05.26 14:23   | klavs@…         | Palete saņemta nol.  | … │
│ …                                                             │
├────────────────────────────────────────────────────────────────┤
│ Lapa 1                          ← Atpakaļ      Uz priekšu →   │
└────────────────────────────────────────────────────────────────┘
```

Warehouse skats slēpj "Lietotājs" kolonnu (visi ieraksti ir viņa paša).

## Saistītās piezīmes

- [[03_Authentication_And_Roles]]
- [[16_Warehouse_Dashboard]]
- [[02_Database_Structure]]
