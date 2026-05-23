import fs from "node:fs";
import { parseManifestWorkbook } from "../src/lib/manifest";

const file = process.argv[2] || "/Users/klavs/Downloads/MF-47-UWIkWUQ.xlsx";
const buf = fs.readFileSync(file);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
const r = parseManifestWorkbook(ab);

console.log("file:", file);
console.log("manifestSku:", r.manifestSku);
console.log("rows:", r.rows.length);
console.log(
  "total ref:",
  r.totalReferencePrice.toFixed(2),
  r.currency
);
console.log("errors:", r.errors.length);
const sample = r.rows[0];
if (sample) {
  console.log("--- sample row ---");
  console.log("title:", sample.title);
  console.log("itemQty:", sample.itemQty, "unitPrice:", sample.referencePrice, "total:", sample.totalPrice);
  console.log("weight:", sample.weightKg, "grade:", sample.grade, "condition:", sample.conditionRaw);
  console.log("images:", sample.manifestImages.length, "first:", sample.manifestImages[0]?.slice(0, 80));
}
