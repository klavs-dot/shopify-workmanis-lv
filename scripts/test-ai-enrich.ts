/*
 * Smoke-test for AI enrichment. Calls enrichProduct() directly (bypasses HTTP
 * + Firebase auth) and dumps the result. Requires ANTHROPIC_API_KEY in
 * .env.local.
 *
 *   npx tsx scripts/test-ai-enrich.ts
 */

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const envFile = path.resolve(process.cwd(), ".env.local");
// `override: true` because the surrounding shell may already export an empty
// ANTHROPIC_API_KEY (Claude Desktop sets this) — without override dotenv keeps
// the parent's blank value.
if (fs.existsSync(envFile)) dotenv.config({ path: envFile, override: true });

const apiKeyPresent = Boolean(process.env.ANTHROPIC_API_KEY);
console.log(`ANTHROPIC_API_KEY present: ${apiKeyPresent}`);
if (!apiKeyPresent) {
  console.error("Add ANTHROPIC_API_KEY=... to .env.local and re-run.");
  process.exit(1);
}

import { enrichProduct } from "../src/lib/ai/enrich";

async function main() {
  console.log("\nCalling enrichProduct (web search + fetch will run on Anthropic's side; expect 30-60 sec)…\n");
  const start = Date.now();
  const { result, usage } = await enrichProduct({
    productSku: "190126-00047-1176491",
    manifestSku: "YELLOW30026",
    title:
      "FENCHILIN Bluetooth large mirror with lighting, 18 dimmer LED lights, makeup mirror with light, Hollywood mirror cosmetic mirror with 10x magnification, table mirror with USB 80x58",
    description: "",
    asin: "B08YNR8Y9L",
    ean: "",
    barcode: "",
    brand: "FENCHILIN",
    categoryName: "Home & Kitchen",
    subCategoryName: "Décor",
    condition: "untested",
    manifestImages: [
      "https://jobalots-production-bucket.s3.eu-west-2.amazonaws.com/product_image/CIMX4uzy4AahX5LvTua2vOL30c9BBeSCa8u3pyDa.png",
    ],
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`✓ Completed in ${elapsed}s\n`);
  console.log("─── Result ───");
  console.log(JSON.stringify(result, null, 2));
  console.log("\n─── Usage ───");
  console.log(JSON.stringify(usage, null, 2));
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
