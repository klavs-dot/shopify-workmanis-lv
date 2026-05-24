# 13 — Sorting Claims + Pulse Indicator

> Ieviests 2026-05-24 (commit `b6aadf1+1`).

Šķirošanas sadaļā tagad ir **claim sistēma**, kas nodrošina, ka pa vienai paletei strādā tikai viens darbinieks vienlaicīgi, un visi pārējie redz, kurš tieši ir atbildīgs.

## Workflow

```
┌─────────────────────────────────────────────────────────┐
│  Šķirošana kartītes — nezaimēta palete                  │
│                                                         │
│   Pallet name                                           │
│   [Produkti: 24] [Nesašķirotie: 12]                     │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │       🙋 Paņemt uz šķirošanu                    │   │ ← klikšķis = claim
│   └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────┐
│  Šķirošana kartītes — pieprasīta palete                 │
│                                                         │
│   Pallet name                                           │
│   [Produkti: 24] [Nesašķirotie: 12]                     │
│                                                         │
│   👤 Šķiro: Klāvs Asmanis                               │ ← citi useri redz kas
│      Paņemts 24. mai. 14:32                             │
│                                                         │
│   [ Atvērt → ]  [Atlaist]   (TIKAI atbildīgais)         │
│   🔒 Atvērt var tikai atbildīgais  (citi)               │
└─────────────────────────────────────────────────────────┘
```

## Datu modelis

`Pallet` paplašināts ar 4 jauniem laukiem:

| Lauks | Tips | Apraksts |
|---|---|---|
| `sortingClaimedBy` | `string \| null` | Firebase Auth uid |
| `sortingClaimedByEmail` | `string \| null` | Snapshot |
| `sortingClaimedByName` | `string \| null` | Snapshot displayName |
| `sortingClaimedAt` | `Timestamp \| null` | `serverTimestamp` claim brīdī |

Snapshoti tiek glabāti tāpēc, lai citu lietotāju kartītēs varētu rādīt vārdu, nelaužot Firestore rules ar `users/{uid}` lookup.

## Helper funkcijas

[src/lib/firestore/pallets.ts](../../src/lib/firestore/pallets.ts):

```typescript
claimPalletForSorting(palletId, { uid, email, displayName })
releasePalletSortingClaim(palletId)
```

## Access kontrole

| Lietotājs | Kartītes redzamība | "Paņemt" poga | Atvērt detalizēti |
|---|---|---|---|
| Vēl nav claim | Visi redz | Visi var paņemt | — |
| Pats claimeris | Redz | — | ✅ + "Atlaist" |
| Cits darbinieks | Redz info + claim badge | — | ❌ Atver: amber Access Denied |
| MASTER | Redz | — (nav vajadzīgs) | ✅ ALWAYS (override) + var atlaist citu claim |

`/skirosana/[id]` direct URL hit non-claimerim:
- Nerāda 404
- Rāda amber paneli ar atbildīgā vārdu + iesaka runāt ar MASTER

## Pulsācijas indikators

`/skirosana` kartīte **pulsē sarkana**, ja `unsortedCount > 0` — t.i., paletei vēl ir produkti ar `listingStatus IN ("not_listed", "listing_approved")`.

CSS keyframe ([src/app/globals.css](../../src/app/globals.css)):

```css
.pulse-red-ring {
  animation: pulse-red-ring 2s ease-in-out infinite;
  border-color: rgb(252 165 165);
}
@keyframes pulse-red-ring {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
    border-color: rgb(254 202 202);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.18);
    border-color: rgb(248 113 113);
  }
}
```

- 2s cikls, ease-in-out
- Subtle, ne strobe — lai pilna ekrāna paletes neraisītu nelabumu
- `prefers-reduced-motion` respektēts (auto-stop ar statisku sarkanu border)

Kad visi produkti ir `listed_in_store` / `sold` / `disposed` / `out_of_stock` — kartītei nav `pulse-red-ring` klases, parastais hover/border.

## Audit log

Katrs claim / release rakstās auditā:

- `pallet_sorting_claimed` — after = `{ sortingClaimedBy, sortingClaimedByName }`
- `pallet_sorting_released` — before = iepriekšējais claim

## Iesakāmais workflow

1. **WAREHOUSE darbinieks** ieiet Šķirošanā, redz sarkanu pulsējošu paleti
2. Klikšķina **"🙋 Paņemt uz šķirošanu"**
3. Sāk apstrādāt — kartīte tagad zaļa "Šķiro: Tu", citiem darbiniekiem amber "Šķiro: [vārds]"
4. Veic claim: apstiprina ievietošanu / piezīme / utilizē
5. Kad visi produkti `listed_in_store` / sold / disposed → kartīte pārstāj pulsēt
6. Atlaiž claim (vai atstāj — nav prasība) — cits darbinieks var paņemt vēlāk pārpārdošanai vai labošanai

## Saistītās piezīmes

- [[02_Database_Structure]]
- [[03_Authentication_And_Roles]] — kā lomas saskan
- [[12_Branding]] — pulse animācijas filozofija (subtle, motion-safe)
