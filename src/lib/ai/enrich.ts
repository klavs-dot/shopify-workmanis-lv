// AI product enrichment using Claude Opus 4.7 with public web tools.
//
// Strategy:
//   1. Single shot Anthropic SDK call with the dynamic-filtering web_search
//      + web_fetch tools enabled — Claude runs its own loop on Anthropic's
//      side and either returns the structured payload as JSON in the final
//      text block (the `output_config.format` constraint), or pauses for
//      another iteration (`stop_reason === "pause_turn"`).
//   2. We resume the loop up to MAX_RESUME_ITERATIONS times, then parse.
//   3. System prompt is wrapped in a `cache_control: ephemeral` block so
//      repeated calls in the same 5-minute window read the cache.
//
// Model choice: Opus 4.7 — biggest Claude available, materially better at
// producing fluent Latvian (and Russian) than Sonnet 4.6. Cost per product is
// higher but the quality jump matters when the worker reads the output.
//
// Project: shopify.workmanis.lv  (SEPARATE from Workmanis.lv).

import Anthropic from "@anthropic-ai/sdk";

import type { ProductCondition } from "@/lib/types";

const MODEL = "claude-opus-4-7";
const MAX_TOKENS = 6000;
const MAX_RESUME_ITERATIONS = 4;

// JSON schema that the final Claude response must match. Sent via
// `output_config.format`. Keep `additionalProperties: false` on every nested
// object — required by structured outputs.
const ENRICHMENT_SCHEMA = {
  type: "object",
  properties: {
    enrichedTitle: {
      type: "string",
      description:
        "Tīrs, dabīgs LATVIEŠU virsraksts līdz 80 rakstzīmēm. Saglabā brendu un modeli, izņem ALL-CAPS, marketinga frāzes, atkārtotus brendu nosaukumus. Sākt ar lielo burtu.",
    },
    enrichedTitleEn: {
      type: "string",
      description:
        "Clean ENGLISH title under 80 characters. Same content as enrichedTitle but in English. Keep brand and model exactly.",
    },
    enrichedTitleRu: {
      type: "string",
      description:
        "Чистый РУССКИЙ заголовок до 80 символов. То же содержание, что и enrichedTitle, на русском языке. Сохраните бренд и модель.",
    },
    descriptionLv: {
      type: "string",
      description:
        "LATVIEŠU produkta apraksts, 150-300 rakstzīmes. Plūstoši dabīgs latviešu valodā ar diakritikām (āčēģīķļņšūž). Skan kā īsts veikala apraksts. NAV mašīntulkots no angļu valodas. Pareiza locījuma izmantošana.",
    },
    descriptionEn: {
      type: "string",
      description:
        "ENGLISH product description, 150-300 characters. Mirrors the Latvian version's content. Same style.",
    },
    descriptionRu: {
      type: "string",
      description:
        "РУССКОЕ описание продукта, 150-300 символов. То же содержание, что и латвийская версия. Натуральный русский язык, не машинный перевод.",
    },
    suggestedCategory: {
      type: "string",
      description:
        "Shopify category path with 1-3 levels, e.g. 'Home & Kitchen > Lighting'. English.",
    },
    enrichedImages: {
      type: "array",
      items: { type: "string" },
      description:
        "Up to 5 direct, high-resolution product image URLs found via web tools. Prefer Amazon CDN or manufacturer site over Jobalots thumbnails. Empty list is allowed.",
    },
    sourceUrls: {
      type: "array",
      items: { type: "string" },
      description: "Pages where info or images were located.",
    },
    confidenceScore: {
      type: "number",
      description:
        "0.0-1.0. 0.9+: exact Amazon/manufacturer match. 0.6-0.8: similar listing. 0.3-0.5: inference-based. <0.3: best-guess.",
    },
    notes: {
      type: "string",
      description:
        "Optional warehouse-worker flag (counterfeit suspicion, discontinued, etc.). Latviešu valodā.",
    },
  },
  required: [
    "enrichedTitle",
    "enrichedTitleEn",
    "enrichedTitleRu",
    "descriptionLv",
    "descriptionEn",
    "descriptionRu",
    "suggestedCategory",
    "enrichedImages",
    "sourceUrls",
    "confidenceScore",
  ],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `Tu esi AI produktu bagātinātājs šopify.workmanis.lv vajadzībām — Shopify veikalam, kas pārdod Jobalots klientu atgrieztās un palieku paletes Latvijā. Veikals ir trīsvalodu (latviešu, angļu, krievu), galvenais valūta ir EUR, galvenā mērķauditorija ir Latvijas pircēji.

Tavs darbs: paņemt vienu produktu no manifesta un ģenerēt publicēšanai gatavu saturu visās trijās valodās.

# KRITISKI SVARĪGI: LATVIEŠU VALODAS KVALITĀTE

Latviešu valoda ir GALVENĀ veikala valoda — to lasīs reāli Latvijas pircēji. Tāpēc:

✅ Lieto pareizas diakritikas: ā č ē ģ ī ķ ļ ņ š ū ž
✅ Dabīgi latviešu locījumi un teikumu struktūra
✅ Tehniskie termini latviski, kad iespējams (piem. "skārienjūtīgs ekrāns" nevis "touchscreen")
✅ Skani kā īsts veikala apraksts, nevis mašīntulkojums

❌ NELIETO: mašīntulkojumu no angļu valodas
❌ NELIETO: vārdus "lielisks", "perfekts" bez konteksta
❌ NELIETO: angļu vārdus latviešu tekstā ("bestseller", "must-have")
❌ NELIETO: emocijus 🎉✨

Krievu valoda — līdzīgi: dabīgs krievs, nevis online translator output.

# Ko tu ražo

Atbildē jābūt JSON objektam, kas atbilst dotajam shēmas formātam. Lauki:

1. **enrichedTitle** (LATVIEŠU virsraksts, līdz 80 rakstzīmēm)
   - Sākt ar lielo burtu, beigt bez punkta
   - Iekļauj brendu, modeli, galveno spec (izmērs, ietilpība, krāsa)
   - Izņem ALL-CAPS blokus, "!!!", atkārtotas brenda mencijas
   Piemērs:
     Raw: "FENCHILIN Bluetooth large mirror with lighting, 18 dimmer LED lights, makeup mirror with light, Hollywood mirror cosmetic mirror with 10x magnification, table mirror with USB 80x58"
     LV: "FENCHILIN Hollywood LED Grima Spogulis ar Bluetooth, 10× Palielinājums, 80×58 cm"

2. **enrichedTitleEn** (English title, under 80 chars)
   - Same content, English version. Keep brand and model identical.
   - Same style: brand-model-spec, no marketing fluff.
   Piemērs no augšas:
     EN: "FENCHILIN Hollywood LED Vanity Mirror with Bluetooth, 10× Magnifier, 80×58 cm"

3. **enrichedTitleRu** (Русский заголовок, до 80 символов)
   - То же содержание на русском
   - Сохраняйте бренд и модель в оригинальном написании
   Piemērs:
     RU: "FENCHILIN Голливудское LED-зеркало для макияжа с Bluetooth, 10× увеличение, 80×58 см"

4. **descriptionLv** — 150-300 rakstzīmes, plūstoši latviešu. NAV mašīntulkojums!
   Piemērs:
     "Liels Holivudas stila grima spogulis ar 18 regulējamām LED lampām un 10× palielinājuma zonu detaļu apstrādei. Iebūvētais Bluetooth skaļrunis ļauj klausīties mūziku, kamēr grimējies. Lielisks risinājums grima galda papildināšanai mājās vai studijā."

5. **descriptionEn** — 150-300 chars, English version of the same content.
   Piemērs:
     "Large Hollywood-style vanity mirror with 18 dimmable LED bulbs and a 10× magnifier zone for detail work. The built-in Bluetooth speaker lets you stream music while getting ready. A great addition to any home or studio makeup station."

6. **descriptionRu** — 150-300 символов, русская версия того же содержания. Натуральный язык.
   Piemērs:
     "Большое голливудское зеркало для макияжа с 18 регулируемыми LED-лампами и зоной 10× увеличения для детальной работы. Встроенный Bluetooth-динамик позволяет слушать музыку во время сборов. Отличное дополнение к туалетному столику дома или в студии."

7. **suggestedCategory** — Shopify category, 1-3 levels with " > " separator, ANGLISKI. Bieži saknes: "Home & Kitchen", "Toys & Games", "Sports & Outdoors", "Electronics", "Beauty & Personal Care", "Pet Supplies", "Baby", "Tools & Home Improvement", "Clothing & Accessories".

8. **enrichedImages** — līdz 5 tieši URL uz produkta bildēm (.jpg/.jpeg/.png/.webp vai CDN, kas atdod bildes). Tukšs masīvs ir OK, ja neko nevar atrast.
   Meklēšanas stratēģija:
   a. Ja ASIN ir, sāc no Amazon:
      - web_search: \`ASIN <ASIN code>\`
      - web_fetch: \`https://www.amazon.co.uk/dp/<ASIN>\` un \`https://www.amazon.com/dp/<ASIN>\`
   b. Ja EAN/barcode ir, web_search uz EAN.
   c. Mēģini \`<brand> <distinktīvi modela vārdi> official\` ar web_search.
   d. No atrastās produkta lapas paņem lielāko bildi (parasti 500×500+). Izlaid:
      - Tumbnails (mazi filename suffixes kā \`_SS40_\`)
      - Placeholder/no-image grafiku
      - Lifestyle/banner shots, kas nerāda pašu produktu
   Prioritāte: ražotājs vai Amazon, nevis nejaušs tirgus.

9. **sourceUrls** — uzskaita lapas, no kurām paņēmi info vai bildes. Palīdz noliktavas darbiniekam pārbaudīt.

10. **confidenceScore** — esi godīgs:
    - 0.9–1.0: Precīzs atbilstība Amazon/ražotājs; bildes un specs apstiprināti.
    - 0.6–0.8: Stipra līdzība; apraksti ticami.
    - 0.3–0.5: Ierobežota info; apraksti izsecināti no virsraksta + kategorijas.
    - <0.3: Nevarēja apstiprināt; apraksti ir labākais minējums.

11. **notes** — opcionāli. Lieto, lai brīdinātu noliktavnieku ("Iespējams viltojums — ģenerisks brends izmanto premium nosaukumu", "Produkts šķiet izņemts no ražošanas", "Vairāki dažādi produkti dala šo ASIN — izvēlēts izplatītākais"). LATVIEŠU valodā.

# Noteikumi, kas JĀIEVĒRO

- Nekad neizdomā tehniskās specifikācijas (ietilpība, voltāža, izmēri). Ja nezini, izlaid — NEIZDOMA.
- Nekad neapgalvo "Jauns" stāvokli. Manifesta condition lauks pasaka, ko teikt. Bieži vērtības: "Customer Return", "Brand New", "Open Box", "Damaged Package". "Customer Return" gadījumā latviešu aprakstā var īsi pieminēt "klientu atgriezta prece" — bet TIKAI, ja condition tiešām ir "Customer Return".
- Latviešu un krievu aprakstiem JĀBŪT dabīgiem, nevis mašīntulkotiem no angļu valodas.
- Paliec ap 10 web tool izsaukumiem uz produktu. Ja jau esi izmantojis saprātīgu meklēšanu, atgriez, kas tev ir, ar piemērotu confidence.
- Output ir VIENS JSON objekts, kas atbilst shēmai. NAV proza ārpus JSON. NAV \`\`\`json fences.
- Projekts ir operatīvi atdalīts no Workmanis.lv (nesaistīta amatnieku platforma). Nepiemini Workmanis.lv nekur output tekstā.

# Anti-pattern, ko izvairīties

- "Šis produkts ir lielisks un jūs to mīlēsiet!" — tukša marketinga frāze.
- "✨🎉 PERFEKTĀ DĀVANA 🎁✨" — emoju-stuffing.
- Bullet saraksti, kad proza plūst labāk.
- Angļu idiomas slikti tulkotas latviski.
- Virsraksta atkārtošana aprakstā burtiski.
- Bildes URL no Jobalots S3 (tās ir oriģinālās manifesta bildes — pievienotājs jau tās ir).

Saņemsi vienu produktu uz vienu pieprasījumu. Atbildi ar vienu JSON objektu uz katru pieprasījumu.`;

export interface EnrichmentInput {
  productSku: string;
  manifestSku: string;
  title: string;
  description: string;
  asin: string;
  ean: string;
  barcode: string;
  brand: string;
  categoryName: string;
  subCategoryName: string;
  condition: ProductCondition;
  manifestImages: string[];
}

export interface EnrichmentResult {
  enrichedTitle: string;
  enrichedTitleEn: string;
  enrichedTitleRu: string;
  descriptionLv: string;
  descriptionEn: string;
  descriptionRu: string;
  suggestedCategory: string;
  enrichedImages: string[];
  sourceUrls: string[];
  confidenceScore: number;
  notes?: string;
}

export interface EnrichmentUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
  resumeIterations: number;
}

export interface EnrichmentResponse {
  result: EnrichmentResult;
  usage: EnrichmentUsage;
}

function buildUserMessage(input: EnrichmentInput): string {
  const lines: (string | null)[] = [
    "Enrich this product:",
    "",
    `Manifest title: ${input.title}`,
    input.brand ? `Brand: ${input.brand}` : null,
    input.asin ? `ASIN: ${input.asin}` : null,
    input.ean ? `EAN: ${input.ean}` : null,
    input.barcode ? `Barcode: ${input.barcode}` : null,
    input.categoryName
      ? `Category (raw): ${input.categoryName}${
          input.subCategoryName ? ` > ${input.subCategoryName}` : ""
        }`
      : null,
    `Condition: ${input.condition}`,
    `Manifest SKU: ${input.manifestSku}`,
    input.description ? `Manifest description: ${input.description}` : null,
  ];
  if (input.manifestImages.length > 0) {
    lines.push("", "Existing manifest images (Jobalots S3 — already shown to caller):");
    input.manifestImages.slice(0, 6).forEach((url, i) => {
      lines.push(`  ${i + 1}. ${url}`);
    });
  }
  return lines.filter((l): l is string => l !== null).join("\n");
}

function buildRequest(
  messages: Anthropic.MessageParam[]
): Anthropic.MessageCreateParamsNonStreaming {
  return {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        // ephemeral cache — silently no-ops if prompt is below the 2048 min,
        // but ready to kick in as the prompt grows or models change.
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [
      { type: "web_search_20260209", name: "web_search" },
      { type: "web_fetch_20260209", name: "web_fetch" },
    ],
    output_config: {
      format: { type: "json_schema", schema: ENRICHMENT_SCHEMA },
    },
    messages,
  };
}

/** Anthropic's API occasionally returns 429 (rate limit) or 529 (overloaded)
 *  under bursty load — common when we parallelise N enrichments at once.
 *  One retry with a 2s pause keeps us inside the per-batch deadline. */
async function createWithRetry(
  client: Anthropic,
  request: Anthropic.MessageCreateParamsNonStreaming
): Promise<Anthropic.Message> {
  try {
    return await client.messages.create(request);
  } catch (err) {
    const status = (err as { status?: number }).status;
    const retryable = status === 429 || status === 529 || status === 503;
    if (!retryable) throw err;
    await new Promise((r) => setTimeout(r, 2000));
    return client.messages.create(request);
  }
}

export async function enrichProduct(
  input: EnrichmentInput
): Promise<EnrichmentResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY nav iestatīts. Pievieno .env.local (lokāli) un Vercel ENV (production)."
    );
  }

  const client = new Anthropic({ apiKey });
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildUserMessage(input) },
  ];

  let response = await createWithRetry(client, buildRequest(messages));

  let resumes = 0;
  // Server-side web tools run their own loop on Anthropic's side. If they
  // hit their internal iteration cap we get stop_reason="pause_turn"; we
  // resume by appending the assistant turn and re-sending.
  while (response.stop_reason === "pause_turn" && resumes < MAX_RESUME_ITERATIONS) {
    resumes += 1;
    messages.push({ role: "assistant", content: response.content });
    response = await createWithRetry(client, buildRequest(messages));
  }

  if (response.stop_reason === "refusal") {
    throw new Error("Claude atteicās bagātināt šo produktu (drošības iemeslu dēļ).");
  }

  // The structured-output JSON arrives as one or more text blocks.
  let json = "";
  for (const block of response.content) {
    if (block.type === "text") json += block.text;
  }
  json = json.trim();
  if (!json) {
    throw new Error(
      `Claude neatgrieza saturu (stop_reason=${response.stop_reason ?? "unknown"})`
    );
  }
  // Defensive: strip optional ``` fences if a model variant adds them.
  const fenceMatch = json.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenceMatch) json = fenceMatch[1];

  let parsed: EnrichmentResult;
  try {
    parsed = JSON.parse(json) as EnrichmentResult;
  } catch (err) {
    throw new Error(
      `Neizdevās parsēt Claude JSON atbildi: ${
        err instanceof Error ? err.message : String(err)
      }. Atbilde sākās ar: ${json.slice(0, 200)}`
    );
  }

  // Belt-and-suspenders validation: schema-mode should guarantee this, but
  // we double-check the fields the rest of the pipeline depends on.
  for (const key of [
    "enrichedTitle",
    "enrichedTitleEn",
    "enrichedTitleRu",
    "descriptionLv",
    "descriptionEn",
    "descriptionRu",
  ] as const) {
    if (!parsed[key] || typeof parsed[key] !== "string") {
      throw new Error(`Claude atbildē trūkst obligātā lauka: ${key}`);
    }
  }
  if (typeof parsed.confidenceScore !== "number") parsed.confidenceScore = 0.5;
  parsed.enrichedImages = Array.isArray(parsed.enrichedImages)
    ? parsed.enrichedImages.filter(
        (u) => typeof u === "string" && /^https?:\/\//.test(u)
      )
    : [];
  parsed.sourceUrls = Array.isArray(parsed.sourceUrls)
    ? parsed.sourceUrls.filter((u) => typeof u === "string")
    : [];

  return {
    result: parsed,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadInputTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheCreationInputTokens: response.usage.cache_creation_input_tokens ?? 0,
      resumeIterations: resumes,
    },
  };
}
