import { createHmac, timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";

import { SHOPIFY_TAGS } from "@/lib/shopify";

// Shopify webhook → purge cached catalog reads (tags set in lib/shopify).
//
// Subscribe in Shopify Admin → Settings → Notifications → Webhooks (JSON) to
// products/create, products/update, products/delete, collections/create,
// collections/update, collections/delete and inventory_levels/update, URL
// https://14d.lv/api/revalidate. SHOPIFY_WEBHOOK_SECRET = the signing secret
// shown on that page. Unsigned or mis-signed calls get 401.

export const dynamic = "force-dynamic";

function isValidSignature(rawBody: Buffer, header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const received = Buffer.from(header, "base64");
  // timingSafeEqual throws on length mismatch — check first.
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function POST(request: Request) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  // HMAC is computed over the exact bytes Shopify sent — never re-serialise.
  const rawBody = Buffer.from(await request.arrayBuffer());

  if (
    !secret ||
    !isValidSignature(rawBody, request.headers.get("x-shopify-hmac-sha256"), secret)
  ) {
    return Response.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  const tags = [SHOPIFY_TAGS.products, SHOPIFY_TAGS.collections];
  for (const tag of tags) revalidateTag(tag);

  return Response.json({
    ok: true,
    revalidated: tags,
    topic: request.headers.get("x-shopify-topic"),
  });
}
