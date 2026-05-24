/*
 * Backfill `coverImage` on existing pallets that were imported before the
 * cover-image field existed. Walks every pallet with a `jobalotsUrl` but no
 * `coverImage`, re-fetches the Jobalots auction page, and writes back the
 * image URL.
 *
 * Usage:
 *   npx tsx scripts/backfill-cover-images.ts            # dry run, log only
 *   WRITE=1 npx tsx scripts/backfill-cover-images.ts    # actually update
 *
 * Reads FIREBASE_SERVICE_ACCOUNT_PATH from .env.local (override=true so the
 * shell's blank ANTHROPIC_API_KEY doesn't shadow .env values).
 */

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const envFile = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envFile)) dotenv.config({ path: envFile, override: true });

import {
  initializeApp,
  cert,
  getApps,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { fetchJobalotsAuction } from "../src/lib/jobalots";

async function main() {
  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!saPath) throw new Error("FIREBASE_SERVICE_ACCOUNT_PATH not set");
  const sa = JSON.parse(fs.readFileSync(saPath, "utf8")) as ServiceAccount;
  if (getApps().length === 0) initializeApp({ credential: cert(sa) });
  const db = getFirestore();

  const dryRun = process.env.WRITE !== "1";
  console.log(dryRun ? "DRY RUN (set WRITE=1 to apply)" : "WRITE MODE\n");

  const snap = await db.collection("pallets").get();
  console.log(`Scanning ${snap.size} pallets…\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;
  for (const docSnap of snap.docs) {
    const p = docSnap.data();
    if (p.coverImage) {
      skipped++;
      continue;
    }
    if (!p.jobalotsUrl) {
      console.log(`  - ${docSnap.id} (${p.manifestSku}): no jobalotsUrl, skip`);
      skipped++;
      continue;
    }
    try {
      const auction = await fetchJobalotsAuction(p.jobalotsUrl);
      const img = auction.coverImage;
      if (!img) {
        console.log(`  - ${docSnap.id} (${p.manifestSku}): no coverImage on Jobalots`);
        skipped++;
        continue;
      }
      console.log(`  ✓ ${docSnap.id} (${p.manifestSku}): ${img.slice(0, 70)}…`);
      if (!dryRun) {
        await docSnap.ref.update({ coverImage: img });
      }
      updated++;
    } catch (err) {
      console.error(`  ✗ ${docSnap.id}: ${err instanceof Error ? err.message : err}`);
      failed++;
    }
  }
  console.log(`\nDone. updated=${updated} skipped=${skipped} failed=${failed}`);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
