# 17 — Noliktavas darbinieki (`/noliktavas-darbinieki`)

> Vadības sadaļa MASTER + ADMIN lomām, kur izveido WAREHOUSE darbinieku profilus, redz katra individuālo statistiku un (vēlāk) aprēķina bonusus no pārdotā.

## Sidebar

Apakšā kreisajā sidebar (zem Darbību vēstures, virs Iestatījumiem). Redzams tikai **MASTER** un **ADMIN**.

## Lapu struktūra

| Maršruts                            | Apraksts                                          |
| ----------------------------------- | ------------------------------------------------- |
| `/noliktavas-darbinieki`            | Saraksta lapa — viena kartīte uz darbinieku       |
| `/noliktavas-darbinieki/jauns`      | Forma jauna darbinieka izveidei                   |
| `/noliktavas-darbinieki/[uid]`      | Detaļu lapa ar datuma filtru + bonusa aprēķinu    |

## Saraksta kartīte

```
┌──────────────────────────────────┐
│ Jānis Bērziņš          [Aktīvs]  │
│ janis@workmanis.lv               │
├──────────────────────────────────┤
│ Veikalā   Pārdotās   Utilizētās  │
│  120 €      450 €       30 €     │
├──────────────────────────────────┤
│ Šī mēneša potenc. peļņa: 320 €   │
│ 4 paletes                        │
└──────────────────────────────────┘
```

Spied karti → atver detaļu lapu.

## Detaļu lapa

- **Datuma filtrs**: no — līdz (ieskaitot abus galus), default = pašreizējais mēnesis.
- **8 metriku kartītes**:
  - Pārdotas preces (skaits)
  - Pārdotas par (EUR)
  - Vēl nav pārdotas (skaits)
  - Nepārdotās vērtība (EUR)
  - Veikalā (EUR)
  - Šķirotavā (EUR)
  - Utilizētās (EUR)
- **Bonusa aprēķins**: 10% no pārdotā (sākotnējais — likme būs konfigurējama Iestatījumos vēlāk).
- **Šī darbinieka palešu saraksts** ar saitēm uz Šķirošanu.

## Jauna darbinieka forma

- Vārds + Uzvārds (atsevišķi laukā)
- E-pasts
- Sākotnējā parole — auto-ģenerēta ar 🔄 atjaunot un 📋 kopēt pogām
- Parole tiek ģenerēta no [src/lib/passwordGen.ts](../../src/lib/passwordGen.ts) — `paleti-noliktava-742` formāts (divi vārdi + 3 cipari)

Pēc submit:
- Tiek izsaukts `POST /api/admin/users` ar `role=WAREHOUSE`
- Success ekrāns parāda pieslēgšanās datus **vienreiz** — pēc tam parole vairs nav atjaunojama (jāizmanto cita reset poga)

## Manifest assignment

Manifesta augšupielādes formā (`/manifesti`) ir pievienots **"Šķiros (noliktavas darbinieks)"** dropdown:

```
─ darbinieki paši izvēlēsies šķirošanā ─
Anna Liepa · šomēn potenc. peļņa 120 EUR ⭐ rekomendēts
Jānis Bērziņš · šomēn potenc. peļņa 450 EUR
...
```

Rekomendācija = darbinieks ar **mazāko potenciālo peļņu šī mēneša** no [buildWorkerStats()](../../src/lib/warehouseStats.ts) — sabalansē slodzi tā, lai neviens nepaņem visus dārgākos manifestus.

Ja izvēlas darbinieku:
- Palete tiek izveidota ar `assignedWarehouseUid` u.c. denormalizētiem laukiem.
- Loģistika kartītē rāda `Pēc saņemšanas auto-piešķirs: <vārds>`.
- Brīdī, kad nospiedz **"Saņemts!"**, sistēma automātiski izsaukt `sortingClaimedBy = assignedWarehouseUid` (audit log: gan `pallet_received`, gan `pallet_sorting_claimed`).

Ja atstāj tukšu → darbinieki paši paņem Šķirošanā kā agrāk.

## Datu modelis (Pallet jaunie lauki)

```ts
// src/lib/types.ts
assignedWarehouseUid: string | null;
assignedWarehouseEmail: string | null;
assignedWarehouseName: string | null;
assignedWarehouseAt: Timestamp | null;
assignedBy: string | null;     // who made the assignment (uid)
```

Visi denormalizēti, lai UI nekur nav vajadzīga papildu Firestore lasīšana.

## `buildWorkerStats()` aprēķins

[src/lib/warehouseStats.ts](../../src/lib/warehouseStats.ts):

| Lauks                | Aprēķins                                              |
| -------------------- | ----------------------------------------------------- |
| `inStoreCount/Value` | Produktiem `listed_in_store/listing_approved`, `listedAt` diapazonā |
| `sortingCount/Value` | Produktiem `not_listed`, `createdAt` diapazonā        |
| `soldCount/Value`    | Produktiem `sold`, `soldAt` diapazonā                 |
| `disposedCount/Value`| Produktiem `disposed`, `updatedAt` diapazonā          |
| `palletCount`        | Paletes, kas `createdAt` diapazonā                    |
| `potentialProfitEur` | Σ (palette `totalReferencePrice` × 0.5) tām paletēm   |

"Mana palete" = `assignedWarehouseUid == uid` OR `sortingClaimedBy == uid`.

## Saistītās piezīmes

- [[13_Sorting_Claims]]
- [[16_Warehouse_Dashboard]]
- [[15_Activity_History]]
- [[03_Authentication_And_Roles]]
