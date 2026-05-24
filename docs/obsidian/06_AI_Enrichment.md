# 06 — AI Enrichment (Implemented)

> **Status:** LIVE on production. Iebūvēts Posms 5 (2026-05-24, commit `ebca0f3`).

Izmanto **Claude Sonnet 4.6** ar Anthropic-hostētiem **web_search + web_fetch** tools, lai katram produktam ģenerētu:

1. Cleaned English title (zem 80 simboliem)
2. Latviešu apraksts Shopify (150-300 simboli, fluent + diacritics)
3. English description Shopify (150-300)
4. Suggested Shopify category (`Home & Kitchen > Lighting > …`)
5. Augstas kvalitātes produkta bildes (no Amazon / ražotāja / trusted source)
6. Source URLs
7. Confidence score (0.0-1.0)
8. Optional notes (counterfeit warning, discontinued, etc.)

## Tehniskā arhitektūra

| Slānis | Fails | Loma |
|---|---|---|
| Core | [src/lib/ai/enrich.ts](../../src/lib/ai/enrich.ts) | Anthropic SDK call, system prompt, JSON schema, retry loop |
| Per-product API | [src/app/api/ai/enrich-product/route.ts](../../src/app/api/ai/enrich-product/route.ts) | POST endpoint ar auth, Firestore write, audit log |
| Per-pallet API | [src/app/api/ai/enrich-pallet/route.ts](../../src/app/api/ai/enrich-pallet/route.ts) | Bulk versija, sequential, max 200/call |
| UI per-product | [src/components/ProductActionsPanel.tsx](../../src/components/ProductActionsPanel.tsx) | "Sākt AI bagātinājumu" poga + preview |
| UI per-pallet | [src/app/skirosana/[id]/page.tsx](../../src/app/skirosana/[id]/page.tsx) | "✨ Bagātināt nebagātinātos" / "Pārbagātināt visus" header pogas |

## Claude API izmantojums

| Parametrs | Vērtība | Komentārs |
|---|---|---|
| Model | `claude-sonnet-4-6` | Lētāks par Opus, pietiekams šim uzdevumam |
| `max_tokens` | 4096 | Final JSON ir mazs (~5KB) |
| `tools` | `web_search_20260209`, `web_fetch_20260209` | Dynamic filtering versijas |
| `output_config.format` | `json_schema` | Strikta strukturēta atbilde |
| `cache_control` | `ephemeral` uz system promptā | Auto-cache pēc 2048 tokens |
| Resume loop | līdz 4 `pause_turn` iterācijām | Web tools var iziet cauri vairākiem soļiem |

## Auth flow

1. Klients (Šķirošanas UI) → Firebase Auth ID token
2. POST `/api/ai/enrich-product` ar `Authorization: Bearer <token>`
3. Server `firebase-admin` verify + check role ∈ {MASTER, ADMIN}
4. Server fetch produkta ierakstu no Firestore (admin SDK)
5. Set `aiStatus = "enrichment_pending"` + audit "ai_enrichment_started"
6. Call `enrichProduct()` ar produkta datiem
7. Save back enriched fields + `aiStatus = "enriched"` (vai `"needs_review"` ja confidence < 0.6, vai `"failed"`)
8. Audit log "ai_enrichment_completed" ar usage metrics

## Saglabātie lauki produktā

Skat `Product` interfeisu ([src/lib/types.ts](../../src/lib/types.ts)):

- `enrichedTitle: string | null` — clean English title
- `descriptionLv: string | null` — Shopify-ready LV
- `descriptionEn: string | null` — Shopify-ready EN
- `enrichedImages: string[]` — atrastās bildes (līdz 5)
- `images: string[]` — merged manifestImages + enrichedImages (deduped, max 12)
- `sourceUrls: string[]` — kur Claude atrada info
- `confidenceScore: number | null` — 0.0-1.0
- `aiStatus: AiStatus` — `not_started` / `enrichment_pending` / `enriched` / `needs_review` / `failed`
- `categoryName` — pārrakstīts tikai ja oriģinālajā Jobalots manifeste tas bija tukšs

## Vides mainīgais

`ANTHROPIC_API_KEY` jāiestata:
- Lokāli: `.env.local`
- Vercel: pievienots Production environment (encrypted)

⚠ **Gotcha:** Claude Desktop eksportē `ANTHROPIC_API_KEY=` (tukšs) katrā shell-ā. CLI seed/test skripti `dotenv` lieto ar `override: true`, lai pārrakstītu shell vērtību ar .env.local vērtību. Vercel-am tas nav problēma — tur process.env nāk tieši no Vercel ENV.

## Izmaksu profils (no smoke testa)

Viena FENCHILIN spoguļa enrichment:

| Tipa | Tokens | $/M | EUR |
|---|---|---|---|
| Cache write (system + tools) | 48,262 | $3 × 1.25 | $0.18 |
| Cache read (caching kicks in) | 457,064 | $3 × 0.1 | $0.14 |
| Regular input (user message) | 529 | $3 | $0.0016 |
| Output (JSON) | 5,004 | $15 | $0.075 |
| **Total** | | | **~$0.40** |

25-produktu palete ≈ **$10**. Skaits aug ar web search agresivitāti.

## Smoke test script

`scripts/test-ai-enrich.ts` palaiž `enrichProduct()` tieši (apieta HTTP + auth) un izdrukā rezultātu + usage stats:

```bash
npx tsx scripts/test-ai-enrich.ts
```

Pirmā reize ar reālā Claude API parādīja:
- Title: "FENCHILIN Hollywood LED Vanity Mirror with Bluetooth, 18 Dimmable Lights, 10× Magnifier, 80×58 cm"
- LV apraksts ar dabīgu latviešu valodu un diacritikām
- 5 augstas kvalitātes bildes (Coast Fashion CDN + FENCHILIN oficiālā)
- 3 source URLs (Amazon.de, Coast Fashion, FENCHILIN.com)
- Confidence 0.87
- Note: godīgi atzīmēja, ka Bluetooth/USB nav verificēts ar customer-return condition

## Apzināti izlaists / TODO

- **Streaming** — pašlaik route bloķē, kamēr Claude pabeidz (1-3 min). Vēlāk varētu SSE.
- **Bulk paralelizācija** — `/api/ai/enrich-pallet` ir sequential. 25 produkti = ~20 min. Ja taisām paralelizāciju, jāuzmanās ar Anthropic rate limits + jāizlīdzina Vercel function concurrency.
- **Retry on transient errors** — ja viens web_fetch fail, tagad pārtraucas.
- **Cost guardrails** — vēl nav per-day budget cap; viens izstrādātāja drīzs varētu nokost ~$50.
- **AI Provider switcher** — pašlaik hard-coded Sonnet 4.6. Ja vajadzēs Haiku/Opus, jāparametrizē.

## Saistītās piezīmes

- [[05_Pricing_Engine]] — pricing AI nemaina (Claude tikai apraksta + bildes)
- [[07_Shopify_Integration_Future]] — enriched dati ir Shopify-ready, tikai vajag push
- [[10_TODO]]
