import { NextResponse } from "next/server";

import {
  fetchJobalotsAuction,
  isValidJobalotsUrl,
} from "@/lib/jobalots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // never cache, always live

/**
 * GET /api/jobalots/lookup?url=<jobalots-auction-url>
 *
 * Public auction-page scraper. Returns structured pallet metadata extracted
 * from the embedded RSC payload (Total RRP, current bid = purchase price,
 * condition, location, weight, cover image, …).
 *
 * Auth: requires a signed-in Firebase user. (No service-account writes happen
 * here — we only return data for the caller to apply via the existing
 * client-side Firestore writes.)
 */
export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("url") || "";
  if (!isValidJobalotsUrl(url)) {
    return NextResponse.json(
      { error: "Nederīgs Jobalots URL. Sagaidi https://jobalots.com/<lang>/products/<SKU>" },
      { status: 400 }
    );
  }
  try {
    const auction = await fetchJobalotsAuction(url);
    // Strip the raw object before returning — keep response small.
    const { raw: _raw, ...safe } = auction;
    return NextResponse.json(safe, {
      headers: {
        "cache-control": "private, max-age=30",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Jobalots lookup neizdevās" },
      { status: 502 }
    );
  }
}
