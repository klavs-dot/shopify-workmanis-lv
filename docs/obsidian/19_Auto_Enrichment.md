# 19 — Auto-Enrichment ar Claude Opus 4.7

> AI bagātinājums tagad palaižas **automātiski**, kad palete tiek piešķirta darbiniekam, un izveido pilnvērtīgu **3-valodu** saturu (LV / EN / RU) Shopify multi-language veikalam.

## AI modelis: Claude Opus 4.7

Pārmainīts no Sonnet 4.6 ([src/lib/ai/enrich.ts:23](../../src/lib/ai/enrich.ts)) — Opus 4.7 ir Anthropic flagship modelis, kas materiāli labāk ražo dabīgu latviešu un krievu valodu.

System prompt akcents:

> Latviešu valoda ir GALVENĀ veikala valoda — to lasīs reāli Latvijas pircēji.
> ✅ Pareizas diakritikas (ā č ē ģ ī ķ ļ ņ š ū ž)
> ✅ Dabīgi locījumi un teikumu struktūra
> ❌ NE mašīntulkojums no angļu valodas

## Auto-trigger workflow

```
┌──────────────────┐    "Šķiros: Anna"     ┌──────────────────┐
│ Manifest upload  │ ──assignedWarehouse──▶│ Loģistika        │
└──────────────────┘                       │  "Saņemts!" auto │
                                           │  claim Anna      │
                                           └────────┬─────────┘
                                                    │
                          OR  "Paņemt šķirot" ──────┘
                          (Anna spied Šķirotavā)
                                                    │
                                                    ▼
                                  fireAutoEnrich(palletId)
                                  POST /api/ai/enrich-pallet
                                       { auto: true, rerun: true }
                                                    │
                                                    ▼
                                  Pallet.autoEnrichmentStartedAt = NOW
                                  Pallet.autoEnrichmentCompletedAt = null
                                                    │
                                                    ▼
                              For each product (sequential):
                                Claude Opus 4.7 + web_search + web_fetch
                                ~30-60 sek katrs
                                Atjauno: enrichedTitle (LV)
                                         enrichedTitleEn
                                         enrichedTitleRu
                                         descriptionLv / En / Ru
                                         enrichedImages (līdz 5)
                                         confidenceScore
                                                    │
                                                    ▼
                                  Pallet.autoEnrichmentCompletedAt = NOW
                                  Pallet.autoEnrichmentSucceeded = N
                                  Pallet.autoEnrichmentFailed = M
```

## fire-and-forget pattern

[src/lib/ai/autoEnrich.ts](../../src/lib/ai/autoEnrich.ts):

```ts
export async function fireAutoEnrich(firebaseUser, palletId) {
  const token = await firebaseUser.getIdToken();
  void fetch("/api/ai/enrich-pallet", {
    method: "POST",
    body: JSON.stringify({ palletId, rerun: true, auto: true, limit: 200 }),
    keepalive: true,  // izdzīvo arī tab close
  }).catch(console.warn);
}
```

- **Nav await uz fetch** — claim poga neuzkaras 20 minūtes.
- **keepalive: true** — request turpinās, ja lietotājs aizver cilni.
- **Idempotents serverī** — ja `autoEnrichmentStartedAt && !CompletedAt`, otrais izsaukums atgriež `{ skipped: true }`.

## UI bloking + writing robot

### Šķirošanas saraksta lapa

Kad palete ir enrichment-in-progress, kartīte rāda full-overlay ar [WritingRobot](../../src/components/RobotMascots.tsx) mascot:

```
┌─────────────────────────┐
│                         │
│      🤖 ✍️             │  ← WritingRobot animācija (planšete + pildspalva)
│      "AI bagātina       │
│       datus…"           │
│                         │
│   Sākts 14:23           │
│                         │
└─────────────────────────┘
```

Atvērt poga ir slēpta. Polling 10s.

### Šķirošanas detaļu lapa

Pirms iekļūt detaļu lapā, blocking full-page ekrāns ar lielo robotu:

```
┌─────────────────────────────────────────┐
│                                         │
│           [WritingRobot 192px]          │
│                                         │
│   AI bagātina manifesta produktus…     │
│                                         │
│   Pievieno bildes, virsrakstus un       │
│   aprakstus latviski, angliski un       │
│   krieviski. Var ilgt 5–20 minūtes.    │
│                                         │
│   Lapa atjaunosies automātiski.        │
│                                         │
└─────────────────────────────────────────┘
```

MASTER var bypass (lai admins var ielūkoties, ja vajag debug). Polling 8s.

Pēc completion — zaļš banner: "✓ AI bagātinājums pabeigts — 23 sekmīgi, 2 kļūdas."

## Manual edit pēc AI

[ProductActionsPanel.tsx](../../src/components/ProductActionsPanel.tsx) tagad nav read-only. AI rezultātu sadaļa ir **tabbed editor**:

```
┌── [LATVIEŠU] [ENGLISH] [РУССКИЙ] ─── [Saglabāt tulkojumus] ──┐
│                                                              │
│ Virsraksts (latviski)                                        │
│ [FENCHILIN Hollywood LED Grima Spogulis...]   45 / 80 ieteic │
│                                                              │
│ Apraksts (latviski)                                          │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ Liels Holivudas stila grima spogulis ar 18           │    │
│ │ regulējamām LED lampām...                            │    │
│ └──────────────────────────────────────────────────────┘    │
│                                          245 / 150–300 ieteic│
└──────────────────────────────────────────────────────────────┘
```

- Char-count katra lauka apakšā (palīdz ievērot ieteicamo garumu).
- Saglabāt poga disabled, kamēr nav izmaiņu.
- Audit log: `product_customer_note_set` ar via metadata.

## Datu modelis

### Product jaunie lauki

```ts
enrichedTitle: string | null;     // LV (bija EN!)
enrichedTitleEn: string | null;   // jauns
enrichedTitleRu: string | null;   // jauns
descriptionLv: string | null;
descriptionEn: string | null;
descriptionRu: string | null;     // jauns
```

> ⚠ Semantika mainīta: agrāk `enrichedTitle` bija angliski. Tagad tas ir LATVISKI. Vēsturiski enriched produkti būs angliski iekš LV lauka, kamēr tos re-enrich.

### Pallet jaunie lauki

```ts
autoEnrichmentStartedAt: Timestamp | null;
autoEnrichmentCompletedAt: Timestamp | null;
autoEnrichmentSucceeded: number | null;
autoEnrichmentFailed: number | null;
autoEnrichmentError: string | null;
```

## API izmaiņas

### POST /api/ai/enrich-pallet

Jauns body parametrs `auto?: boolean`:

| auto | rerun | Atļauts kam | Pallet doc | Kas notiek |
|------|-------|-------------|------------|------------|
| false (default) | false | MASTER, ADMIN | nepieskaras | Bagātina tikai not_started + failed |
| false | true | MASTER, ADMIN | nepieskaras | Pārbagātina visus (kā agrāk) |
| true | true | MASTER, ADMIN, WAREHOUSE | stamp startedAt → completedAt | Auto-trigger no claim |

Idempotency: ja `auto=true` un `startedAt && !completedAt`, atgriež `{ skipped: true }`.

### POST /api/ai/enrich-product

Saglabā jaunos laukus (en/ru titles + ru description). Citur kā agrāk.

## Firestore rules

Warehouse drīkst update jauno 6 multilang laukus (lai manual edit strādātu):

```
hasOnly([
  ...
  'enrichedTitle', 'enrichedTitleEn', 'enrichedTitleRu',
  'descriptionLv', 'descriptionEn', 'descriptionRu',
  'updatedAt'
])
```

## Workflow piemērs

1. **Admin** augšupielādē jaunu manifestu, izvēlas darbinieku **Anna**.
2. Pēc dažām dienām pakete atnāk → kāds spied **"Saņemts!"** Loģistikā.
3. Sistēma auto-claim Anna + uzreiz palaiž `fireAutoEnrich(palletId)`.
4. Anna ieiet `/skirosana` — viņas paletes kartīte rāda **WritingRobot**.
5. 15 min vēlāk robot pazūd, kartīte ir parastā stāvoklī.
6. Anna spied **"Atvērt"** → ieiet detaļu lapā, redz produktus ar visiem AI laukiem aizpildītiem (LV / EN / RU titles + descriptions + bildes).
7. Ja kāds tulkojums ir slikts, viņa atver ProductActionsPanel un labo manuāli.

## Saistītās piezīmes

- [[06_AI_Enrichment]]
- [[13_Sorting_Claims]]
- [[07_Shopify_Integration_Future]] — multi-language Shopify metafields nāks ar šo integrāciju.
