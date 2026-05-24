# 20 — AI Paralelizācija + Budget Cap

> Pēc Opus 4.7 maiņas ([[19_Auto_Enrichment]]) divi sekojoši uzlabojumi: paralēla apstrāde (5×), lai 25-produktu palete neaizņem 20 min, un dienas budžeta limits, jo Opus ir 5× dārgāks par Sonnet.

## Paralelizācija

### Pirms (sequential)

```ts
for (const product of candidates) {
  await enrichProduct(product);  // viens pēc otra
}
// 25 produkti × ~45s = ~19 min
```

### Tagad (5× concurrent)

```ts
for (let i = 0; i < candidates.length; i += AI_CONCURRENCY) {
  const batch = candidates.slice(i, i + AI_CONCURRENCY);
  await Promise.all(batch.map(processProduct));
}
// 25 produkti / 5 = 5 batches × ~55s = ~5 min
```

### Concurrency limits

| Manifest izmērs | Sequential | Paralelizēts (5×) |
|-----------------|------------|-------------------|
| 10 produkti | 8 min | 2 min |
| 25 produkti | 19 min | 5 min |
| 50 produkti | ❌ 40 min (over 800s cap) | 10 min ✅ |
| 100 produkti | ❌ nesastrādās | 20 min ✅ |

**Konfigurējams:** env `AI_CONCURRENCY` (default 5, clamp [1, 20]).

### Retry pattern

Paralēla apstrāde dod burstus, kas dažreiz trigger Anthropic rate limits (HTTP 429) vai overload (HTTP 529). [src/lib/ai/enrich.ts](../../src/lib/ai/enrich.ts) tagad ietverts `createWithRetry()` helper:

```ts
async function createWithRetry(client, request) {
  try {
    return await client.messages.create(request);
  } catch (err) {
    const status = err.status;
    if (status === 429 || status === 529 || status === 503) {
      await new Promise(r => setTimeout(r, 2000));
      return client.messages.create(request);  // 1× retry
    }
    throw err;
  }
}
```

Vairāk nekā 1 retry nav vajadzīgs — ja Anthropic ir patiešām pārslogots, 2s pauze nepalīdzēs un labāk failē kontrolēti, nekā kavē visu batch.

## Budget cap

### Default cenu modelis ([lib/ai/pricing.ts](../../src/lib/ai/pricing.ts))

| Token tips | USD / 1M tokens |
|------------|-----------------|
| Input | $15 |
| Output | $75 |
| Cache creation (input × 1.25) | $18.75 |
| Cache read (input × 0.10) | $1.50 |

**Aptuvenā izmaksa per produkts:**
- Input: ~5K tokens × $15/M = $0.075
- Output: ~2K tokens × $75/M = $0.15
- Cache (warm): atvelk ~10-15%
- **~$0.20 / produkts**

25-produktu palete = ~$5. Default dienas cap = **$50** = ~250 produkti / dienā.

### Datu modelis

**`aiCostStats/{YYYY-MM-DD}`** — dienas rollup (Eiropas/Rīgas timezone):

```ts
interface AiCostStats {
  date: string;
  totalCostUsd: number;
  productCount: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  updatedAt: Timestamp | null;
}
```

Atomic increment ar `FieldValue.increment()` — droši ar paralēliem produktiem.

**`system/aiBudget`** — singleton:

```ts
interface AiBudgetConfig {
  dailyCapUsd: number;
  pricePerInputUsd?: number;      // override default
  pricePerOutputUsd?: number;
  pricePerCacheCreationUsd?: number;
  pricePerCacheReadUsd?: number;
  updatedAt: Timestamp | null;
  updatedBy: string | null;
}
```

### Workflow

```
                                     ┌─────────────────┐
   API /enrich-pallet vai            │ getBudgetSnap-  │
   /enrich-product start  ─────────▶ │ shot() (config  │
                                     │ + stats)        │
                                     └────────┬────────┘
                                              │
                          budgetExceededReason()
                                              │
                                ┌─────────────┴─────────────┐
                                ▼                           ▼
                       spent < cap                   spent >= cap
                                │                           │
                                │                           ▼
                                │                 return 429 + LV msg:
                                │                 "Šodien AI budžets
                                │                  izsmelts (45/50 USD).
                                │                  Mainīt limitu var
                                │                  Iestatījumos."
                                ▼
                       enrichProduct() ───▶ Claude API
                                │
                                ▼
                       recordSpend(usage, prices):
                       FieldValue.increment(cost) atomic
                                │
                                ▼
                       Pallet route: pirms katras
                       batch re-check budget
                       (mid-run cap change effective)
```

### Server helpers ([lib/ai/budgetServer.ts](../../src/lib/ai/budgetServer.ts))

```ts
getBudgetSnapshot(): {
  dailyCapUsd: number;
  spentTodayUsd: number;
  prices: PricePerMTokens;
}

budgetExceededReason(snapshot): string | null
recordSpend(usage, prices): Promise<number>  // returns USD cost
```

### Client helpers ([lib/firestore/aiBudget.ts](../../src/lib/firestore/aiBudget.ts))

```ts
getAiBudgetConfig(): Promise<AiBudgetConfig>
setAiBudgetConfig(patch, callerUid): Promise<void>
getTodaySpend(): Promise<AiCostStats | null>
```

## UI: `/iestatijumi/ai-budget`

Pieejams MASTER + ADMIN, konfigurācija tikai MASTER.

```
┌─────────────────────────────────────────────────────────┐
│ Šodien iztērēts                $23.45 / $50.00          │
│ ████████████████░░░░░░░░░░░░░░░░░░  47%                 │
│ Atlikuši $26.55 šodien.                                 │
│                                                         │
│ Produktu skaits: 118    Input tokens: 542 380           │
│ Output tokens: 187 230  Cache read: 123 456             │
└─────────────────────────────────────────────────────────┘

Konfigurācija
┌─────────────────────────────────────────────────────────┐
│ Dienas limits (USD): [50          ]                     │
│ Default 50 USD. Sasniedzot, enrich endpoints 429.       │
│                                                         │
│ ▶ Cenu override (advanced)                              │
│                                                         │
│ [Saglabāt]                                              │
└─────────────────────────────────────────────────────────┘
```

Progress bar krāsa:
- 🟢 Zaļa < 80%
- 🟡 Dzeltena 80–99%
- 🔴 Sarkana ≥ 100% (overlimit)

## Firestore rules

```rules
match /aiCostStats/{date} {
  allow read:  if isMaster() || isAdmin();
  allow write: if false;          // tikai server (admin SDK bypass)
}

match /system/{docId} {
  allow read:  if isMaster() || isAdmin();
  allow write: if isMaster();
}
```

## Saistītās piezīmes

- [[06_AI_Enrichment]]
- [[19_Auto_Enrichment]]
- [[10_TODO]]
