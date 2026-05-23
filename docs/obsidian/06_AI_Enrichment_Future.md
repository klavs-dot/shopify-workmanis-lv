# 06 — AI Enrichment (Future)

> Pagaidām tikai datu struktūra. Reāls AI process tiks pievienots pēc MVP.

## Mērķis

Katram produktam AI sagatavos:

- Cleaned title (noņemot CAPS LOCK, izgriežot nevajadzīgu tekstu)
- Latvian title
- Latvian description
- English description
- Suggested category
- Suggested price (ārējais market data)
- Found market price (no Amazon vai citur)
- Product image URL (ja manifests bez bildes)
- Source URL (kur AI atrada produktu)
- Confidence score (0–1)
- Recommended action (skat [[05_Pricing_Engine]])

## Datu lauki (jau sagatavoti)

Skatīt [src/lib/types.ts](../../src/lib/types.ts):

- `aiStatus`: `not_started` | `enrichment_pending` | `enriched` | `failed` | `needs_review`
- `marketPrice`
- `sourceUrls`
- `confidenceScore`
- `recommendedAction`

## Workflow plāns

1. Cron / queue iter pa produktiem ar `aiStatus = not_started`.
2. Marķē `enrichment_pending`.
3. Veic AI request (LLM + parsing servisi).
4. Atjauno produktu ar enriched datiem un `aiStatus = enriched`.
5. Ja confidenceScore < threshold, ieliek `needs_review`.

## Modeļa izvēle

Plānā Claude Sonnet 4.6 vai Haiku 4.5 caur Anthropic SDK. Konfigurējams caur ENV.

## Saistītās piezīmes

- [[05_Pricing_Engine]] — kā AI ieteiktais market price plūst pricing modelī
- [[10_TODO]]
