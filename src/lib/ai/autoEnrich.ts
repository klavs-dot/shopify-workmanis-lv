// Client-side helper to fire-and-forget an auto-enrichment batch for a pallet.
// The actual work is sequential and can take 20+ minutes for a full pallet,
// so we never await the response — the UI watches the pallet's
// autoEnrichmentStartedAt / CompletedAt timestamps instead.

import type { User } from "firebase/auth";

/** Trigger the server-side auto-enrichment batch and return immediately.
 *
 *  Why fire-and-forget:
 *    - A pallet of 25 products takes ~20 minutes of sequential web-tool work.
 *    - We don't want the claim button to hang for that long.
 *    - The endpoint stamps the pallet's autoEnrichmentStartedAt at the very
 *      top, so the UI overlay shows up immediately.
 *    - The user's tab can close, navigate away, etc. — the request lives on
 *      the server until it finishes (or hits the 800s function cap).
 *
 *  Why we don't propagate errors:
 *    - The claim transaction itself succeeded; the AI batch is independent.
 *    - The pallet doc captures autoEnrichmentError if anything goes wrong.
 *    - Console.warn is enough — there is nothing for the user to do here.
 */
export async function fireAutoEnrich(
  firebaseUser: User,
  palletId: string
): Promise<void> {
  try {
    const token = await firebaseUser.getIdToken();
    // No await on the actual fetch — we want it backgrounded.
    void fetch("/api/ai/enrich-pallet", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        palletId,
        rerun: true,
        auto: true,
        limit: 200,
      }),
      // keepalive lets the browser send the request even if the user navigates
      // away or closes the tab right after claiming. Up to 64 KB body.
      keepalive: true,
    }).catch((err) => {
      console.warn("auto-enrich fetch dispatch failed", err);
    });
  } catch (err) {
    console.warn("auto-enrich token fetch failed", err);
  }
}
