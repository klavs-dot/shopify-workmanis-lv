// AI product enrichment using Claude Sonnet 4.6 with the public web tools.
//
// Strategy:
//   1. Single shot Anthropic SDK call with the dynamic-filtering web_search
//      + web_fetch tools enabled — Claude runs its own loop on Anthropic's
//      side and either returns the structured payload as JSON in the final
//      text block (the `output_config.format` constraint), or pauses for
//      another iteration (`stop_reason === "pause_turn"`).
//   2. We resume the loop up to MAX_RESUME_ITERATIONS times, then parse.
//   3. System prompt is wrapped in a `cache_control: ephemeral` block. If
//      it grows past Sonnet 4.6's 2048-token cache minimum, subsequent
//      requests in the same 5-minute window read the cache (~10% the price).
//
// Project: shopify.workmanis.lv  (SEPARATE from Workmanis.lv).

import Anthropic from "@anthropic-ai/sdk";

import type { ProductCondition } from "@/lib/types";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 4096;
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
        "Clean, properly-cased English title under 80 chars. Strip ALL-CAPS, '!!!', and redundant brand mentions.",
    },
    descriptionLv: {
      type: "string",
      description:
        "Latvian product description, 150-300 chars. Fluent natural Latvian with diacritics. Sounds like real product copy.",
    },
    descriptionEn: {
      type: "string",
      description:
        "English product description, 150-300 chars. Mirrors the Latvian version.",
    },
    suggestedCategory: {
      type: "string",
      description:
        "Shopify category path with 1-3 levels, e.g. 'Home & Kitchen > Lighting'.",
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
      description: "Optional flag for warehouse worker (counterfeit suspicion, discontinued, etc.).",
    },
  },
  required: [
    "enrichedTitle",
    "descriptionLv",
    "descriptionEn",
    "suggestedCategory",
    "enrichedImages",
    "sourceUrls",
    "confidenceScore",
  ],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `You are an AI product-enrichment assistant for shopify.workmanis.lv — a Shopify-based reseller of Jobalots customer-return and overstock pallets, operating in Latvia. The end shopper browses a Latvian-language store and pays in EUR. Your job is to take raw manifest data for one product at a time and produce polished, ready-to-publish content in both Latvian and English.

# What you produce for each product

For every call you must return a JSON object that exactly matches the supplied output schema. The fields are:

1. **enrichedTitle** — Clean English title under 80 characters. Strip:
   - SHOUTY ALL-CAPS BLOCKS
   - "NEW!!!", "BEST DEAL!", marketing bullets
   - Repeated brand mentions ("Sony Sony Wireless Headphones")
   - Long parenthetical SKU strings
   Keep:
   - Brand, model name, key spec (size, capacity, colour, count) if present
   Examples:
     Raw: "FENCHILIN Bluetooth large mirror with lighting, 18 dimmer LED lights, makeup mirror with light, Hollywood mirror cosmetic mirror with 10x magnification, table mirror with USB 80x58"
     Clean: "FENCHILIN Hollywood LED Vanity Mirror with Bluetooth, 10× Magnifier, 80×58 cm"

     Raw: "FWFX Electronic Dance Mats for TV - Wireless Music Dance Pad Game for Kids and Adults, Family Dance Games Christmas Birthday Gifts for Boys & Girls..."
     Clean: "FWFX Wireless Electronic Dance Mat for TV — Family Music Game for Kids and Adults"

2. **descriptionLv** — Latvian product description, 150-300 characters. Real product copy. Mention the most important features, target use, and what makes it desirable. Do NOT use bullet points, do NOT begin with "Šis produkts ir…". Use proper grammar with diacritics (āčēģīķļņšūž). Sample style:
     "Liela Hollywood stila spogulis ar 18 dimmējamām LED lampām un 10× palielinājuma sekciju. Bluetooth skaļrunis ļauj klausīties mūziku grimējoties. Ideāls grima galda papildinājums mājām vai studijai."

3. **descriptionEn** — English version of the same content, 150-300 characters. Same style guidance.

4. **suggestedCategory** — Shopify-friendly category path with 1-3 levels using " > " as separator. Common roots: "Home & Kitchen", "Toys & Games", "Sports & Outdoors", "Electronics", "Beauty & Personal Care", "Pet Supplies", "Baby", "Tools & Home Improvement", "Clothing & Accessories". Examples: "Home & Kitchen > Lighting > Vanity Mirrors", "Toys & Games > Outdoor Toys > Activity Mats".

5. **enrichedImages** — Up to 5 direct image URLs (ending in .jpg/.jpeg/.png/.webp or pointing at a CDN that serves images). Empty array is acceptable if you find nothing reliable. Discovery strategy:
   a. If ASIN is present, try Amazon first:
      - web_search query: \`ASIN <ASIN code>\`
      - web_fetch \`https://www.amazon.co.uk/dp/<ASIN>\` and \`https://www.amazon.com/dp/<ASIN>\`
   b. If EAN/barcode is present, web_search for the EAN.
   c. Try \`<brand> <distinctive model words> official\` on web_search.
   d. From any matched product page, pick the largest image (usually 500×500+). Skip:
      - Thumbnails (tiny filename suffixes like \`_SS40_\`)
      - Placeholder/no-image graphics
      - Lifestyle/banner shots that don't show the product
   Always prefer the manufacturer or Amazon over random marketplaces.

6. **sourceUrls** — list the pages you actually pulled info or images from. Helps the warehouse worker audit.

7. **confidenceScore** — be honest:
   - 0.9–1.0: Exact match on Amazon/manufacturer; pictures and specs verified.
   - 0.6–0.8: Strong similar listing; descriptions plausible.
   - 0.3–0.5: Limited info; descriptions are inferred from title + category.
   - <0.3: Could not verify; descriptions are best-guess.

8. **notes** — optional. Use it to flag unusual things ("Likely counterfeit — generic brand using premium name", "Product appears discontinued", "Multiple distinct products share this ASIN — selected the most common").

# Rules you must follow

- Never fabricate specifications (capacity, voltage, dimensions). If unknown, omit them — do NOT invent.
- Never claim "Brand New" condition. The manifest condition field tells you what to say. Common values: "Customer Return", "Brand New", "Open Box", "Damaged Package". For customer-return items, the Latvian description may briefly mention "Klientu atgriezta prece" — but only if the condition is actually "Customer Return".
- Latvian descriptions must be in fluent Latvian, not machine-translated English. Use natural word order, proper case endings.
- Stay within ~10 web tool calls per product. If you've already exhausted reasonable searches, return what you have with appropriate confidence.
- Output must be a single JSON object matching the schema. No prose outside JSON. No \`\`\`json fences.
- This project is operationally separate from Workmanis.lv (an unrelated craftsmen platform). Do not reference Workmanis.lv in any output text.

# Anti-patterns to avoid

- "This is a great product that you will love!" — empty marketing fluff.
- "✨🎉 PERFECT GIFT 🎁✨" — emoji-stuffing.
- Bullet lists when prose flows better.
- English idioms mistranslated into Latvian.
- Repeating the title verbatim inside the description.
- Image URLs from Jobalots S3 (those are the original manifest images — the caller already has them).

You will receive one product per request. Reply with one JSON object per request.`;

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
  descriptionLv: string;
  descriptionEn: string;
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

  let response = await client.messages.create(buildRequest(messages));

  let resumes = 0;
  // Server-side web tools run their own loop on Anthropic's side. If they
  // hit their internal iteration cap we get stop_reason="pause_turn"; we
  // resume by appending the assistant turn and re-sending.
  while (response.stop_reason === "pause_turn" && resumes < MAX_RESUME_ITERATIONS) {
    resumes += 1;
    messages.push({ role: "assistant", content: response.content });
    response = await client.messages.create(buildRequest(messages));
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
  // we double-check the few fields the rest of the pipeline depends on.
  for (const key of ["enrichedTitle", "descriptionLv", "descriptionEn"] as const) {
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
