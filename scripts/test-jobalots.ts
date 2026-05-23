import fs from "node:fs";
import { parseJobalotsHtml, fetchJobalotsAuction } from "../src/lib/jobalots";

async function main() {
  const url =
    process.argv[2] ||
    "https://jobalots.com/en/products/YELLOW3002620260424?currency=eur";
  const fromFile = process.env.FROM_FILE;

  let auction;
  if (fromFile && fs.existsSync(fromFile)) {
    console.log(`Parsing local file: ${fromFile}`);
    const html = fs.readFileSync(fromFile, "utf8");
    auction = parseJobalotsHtml(html, url);
  } else {
    console.log(`Fetching live: ${url}`);
    auction = await fetchJobalotsAuction(url);
  }

  const { raw: _raw, ...display } = auction;
  console.log(JSON.stringify(display, null, 2));
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
