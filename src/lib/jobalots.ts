// Jobalots public auction-page parser.
//
// Jobalots is a Next.js app that embeds the TanStack-Query dehydrated state
// inside `self.__next_f.push([..., "<RSC chunk>"])` <script> tags. The auction
// detail object lives at a key like `"result":{ "id":..., "rrp":...,
// "reserve_price":..., "latest_bid_price":..., "weight":..., "location":...
// }`. We pull the page, recombine RSC chunks, locate the `"result":{` anchor
// closest to the manifest SKU, then balance braces to slice out exactly one
// JSON object. That gives us a stable structured extraction without needing
// fragile CSS selectors.

export interface JobalotsAuction {
  url: string;
  manifestSku: string;
  title: string | null;
  rrp: number | null;            // Total RRP
  reservePrice: number | null;
  startBidPrice: number | null;
  latestBidPrice: number | null; // Final auction price → purchasePrice
  suggestedPrice: number | null;
  currency: string | null;
  location: string | null;
  countryIso: string | null;
  weightKg: number | null;
  quantity: number | null;
  bidCount: number | null;
  startAt: string | null;
  endAt: string | null;
  condition: string | null;
  coverImage: string | null;
  vendorName: string | null;
  winnerName: string | null;
  /** Whether the calling user actually won the auction (current_bid present
   *  and progress_status indicates ended). Useful to know if purchase is
   *  trustworthy. */
  isWinner: boolean;
  /** Raw object for debugging / future fields, not exposed via API. */
  raw?: Record<string, unknown>;
}

export interface JobalotsFetchOptions {
  /** Override fetch implementation (e.g. for tests). */
  fetchImpl?: typeof fetch;
  /** Force a specific user-agent. */
  userAgent?: string;
}

const DEFAULT_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

const URL_PATTERN =
  /^https?:\/\/(www\.)?jobalots\.com\/[a-z]{2}\/products\/[A-Z0-9]+/i;

export function isValidJobalotsUrl(url: string): boolean {
  return URL_PATTERN.test(url.trim());
}

export async function fetchJobalotsAuction(
  url: string,
  opts: JobalotsFetchOptions = {}
): Promise<JobalotsAuction> {
  if (!isValidJobalotsUrl(url)) {
    throw new Error("Jobalots URL formāts nav derīgs.");
  }
  const ua = opts.userAgent ?? DEFAULT_UA;
  const f = opts.fetchImpl ?? fetch;
  const res = await f(url, {
    headers: {
      "user-agent": ua,
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.5",
    },
  });
  if (!res.ok) {
    throw new Error(`Jobalots atbildēja ar HTTP ${res.status}`);
  }
  const html = await res.text();
  return parseJobalotsHtml(html, url);
}

export function parseJobalotsHtml(html: string, sourceUrl: string): JobalotsAuction {
  const payload = extractRscPayload(html);
  const auction = locateAuctionObject(payload);
  if (!auction) {
    throw new Error(
      "Jobalots HTML neatpazina auction objektu. Iespējams, lapa ir mainījusies vai aukcija ir izņemta."
    );
  }

  const manifestSku = stringOr(auction.sku, "") || extractSkuFromUrl(sourceUrl);

  const condition = pickCondition(auction);

  return {
    url: sourceUrl,
    manifestSku,
    title: stringOrNull(auction.title),
    rrp: numberOrNull(auction.rrp),
    reservePrice: numberOrNull(auction.reserve_price),
    startBidPrice: numberOrNull(auction.start_bid_price),
    latestBidPrice: numberOrNull(auction.latest_bid_price),
    suggestedPrice: numberOrNull(auction.suggested_price),
    currency: stringOrNull(auction.currency)?.toUpperCase() ?? null,
    location: stringOrNull(auction.location),
    countryIso: stringOrNull(auction.country_iso)?.toUpperCase() ?? null,
    weightKg: numberOrNull(auction.weight),
    quantity: numberOrNull(auction.qty) ?? numberOrNull(auction.available_quantity),
    bidCount: numberOrNull(auction.bid_count),
    startAt: stringOrNull(auction.start_at),
    endAt: stringOrNull(auction.end_at),
    condition,
    coverImage: extractCoverImage(auction),
    vendorName:
      pickNested<string>(auction, ["vendor_details", "trading_name"]) ??
      pickNested<string>(auction, ["vendor_details", "company_name"]) ??
      null,
    winnerName: pickNested<string>(auction, ["current_bid", "user_details", "name"]),
    isWinner: hasOwnWinningBid(auction),
    raw: auction,
  };
}

// ---------------------------------------------------------------------------
// RSC payload extraction
// ---------------------------------------------------------------------------

/** Combine every `self.__next_f.push([N, "<chunk>"])` into one big string,
 *  with JS string escapes unescaped (so embedded JSON survives). */
function extractRscPayload(html: string): string {
  let combined = "";
  const re = /self\.__next_f\.push\(\[\d+,\s*"((?:[^"\\]|\\.)*)"\]\)/g;
  for (const m of html.matchAll(re)) {
    try {
      combined += JSON.parse('"' + m[1] + '"');
    } catch {
      // ignore malformed chunk
    }
  }
  return combined;
}

/** Inside the combined RSC payload, find every `"result":{` and pick the one
 *  whose balanced JSON object has both `manifest_sku`/`sku` and
 *  `reserve_price` — that's the auction detail object. */
function locateAuctionObject(
  payload: string
): Record<string, unknown> | null {
  const key = '"result":{';
  let from = 0;
  while (true) {
    const idx = payload.indexOf(key, from);
    if (idx === -1) return null;
    const open = idx + key.length - 1; // position of `{`
    const slice = sliceBalancedJson(payload, open);
    from = open + 1;
    if (!slice) continue;
    try {
      const parsed = JSON.parse(slice) as Record<string, unknown>;
      if (
        ("sku" in parsed || "manifest_sku" in parsed) &&
        "reserve_price" in parsed
      ) {
        return parsed;
      }
    } catch {
      // not the right block; keep looking
    }
  }
}

/** Return the substring starting at `start` (which must be `{` or `[`)
 *  through to the matching closing brace, respecting strings and escapes. */
function sliceBalancedJson(s: string, start: number): string | null {
  const open = s[start];
  if (open !== "{" && open !== "[") return null;
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\") {
      escape = true;
      continue;
    }
    if (c === '"') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return s.substring(start, i + 1);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

function stringOr(v: unknown, fallback: string): string {
  if (typeof v === "string" && v.trim()) return v.trim();
  return fallback;
}

function stringOrNull(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

function numberOrNull(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pickNested<T>(
  src: Record<string, unknown> | null | undefined,
  path: string[]
): T | null {
  let cur: unknown = src;
  for (const key of path) {
    if (cur == null || typeof cur !== "object") return null;
    cur = (cur as Record<string, unknown>)[key];
  }
  return (cur ?? null) as T | null;
}

function extractCoverImage(auction: Record<string, unknown>): string | null {
  // Try common keys; auction images are sometimes under `image_url`, sometimes
  // inside `manifest.image_url`, or under a nested `images` array.
  const direct = stringOrNull(auction.image_url);
  if (direct && !/placeholder/i.test(direct)) return direct;
  const nested = pickNested<string>(auction, ["manifest", "image_url"]);
  if (nested && !/placeholder/i.test(nested)) return nested;
  const arr = auction.images;
  if (Array.isArray(arr) && arr.length > 0) {
    const first = arr[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "image_url" in first) {
      return stringOrNull((first as Record<string, unknown>).image_url);
    }
  }
  return null;
}

function hasOwnWinningBid(auction: Record<string, unknown>): boolean {
  const status = pickNested<string>(auction, [
    "current_bid",
    "user_bid_status",
    "slug",
  ]);
  const progress = numberOrNull(auction.progress_status);
  // Jobalots: progress_status === 2 means ended; user_bid_status.slug "win"
  // means current account won. We expose this so the UI can decide whether
  // to trust latest_bid_price as the actual purchase amount.
  return status === "win" && progress === 2;
}

/** Jobalots stores the human-readable condition (e.g. "Customer Return",
 *  "Brand New") inside the nested manifest payload:
 *
 *    auction.manifest.manifest_condition[0]
 *           .manifest_condition_type.translations[0].title
 *
 *  We walk that path defensively; if any layer is missing we return null
 *  rather than guess. */
function pickCondition(auction: Record<string, unknown>): string | null {
  const conditions =
    pickNested<unknown[]>(auction, ["manifest", "manifest_condition"]) ??
    pickNested<unknown[]>(auction, ["manifest_condition"]);
  if (!Array.isArray(conditions) || conditions.length === 0) return null;
  const first = conditions[0] as Record<string, unknown> | undefined;
  if (!first) return null;
  const translations =
    pickNested<unknown[]>(first, ["manifest_condition_type", "translations"]) ??
    pickNested<unknown[]>(first, ["translations"]);
  if (!Array.isArray(translations) || translations.length === 0) return null;
  // Prefer English (language_id 1) when present, else fall back to first.
  const en = (translations as Record<string, unknown>[]).find(
    (t) => numberOrNull(t?.language_id) === 1
  );
  const pick = en ?? (translations[0] as Record<string, unknown>);
  return stringOrNull(pick?.title);
}

function extractSkuFromUrl(url: string): string {
  const m = url.match(/\/products\/([A-Z0-9]+)/i);
  return m?.[1] ?? "";
}
