// Excel manifest parser
//
// Supports the Jobalots / pallet manifest schema. Two known shapes:
//
//   Old (MF-47-ndBAUze): Product SKU, Manifest SKU, Product Title,
//                         Product Description, ASIN, EAN, Barcode, Brand,
//                         Category Name, Sub Category Name, Item Qty,
//                         Stock Qty, Reference Price, Reference Price Currency
//
//   New (MF-47-UWIkWUQ):  same as above + Image 1..Image 6, Condition,
//                         Grade, Unit Weight (kg), Unit RRP, Total RRP,
//                         Quantity (instead of Item Qty), Currency
//
// The parser is column-name based, case-insensitive, and stores everything
// unknown under `raw`.

import * as XLSX from "xlsx";

import type { ImportSummary, ParsedManifestRow } from "@/lib/types";

const COLUMN_ALIASES = {
  productSku: ["product sku", "sku", "product_sku"],
  manifestSku: ["manifest sku", "manifest_sku"],
  title: ["product title", "title", "name"],
  description: ["product description", "description", "desc"],
  asin: ["asin"],
  ean: ["ean"],
  barcode: ["barcode", "upc", "gtin"],
  brand: ["brand", "manufacturer"],
  categoryName: ["category name", "category"],
  subCategoryName: ["sub category name", "subcategory", "sub category"],
  itemQty: ["quantity", "item qty", "item quantity", "qty"],
  stockQty: ["stock qty", "stock"],
  weightKg: ["unit weight (kg)", "unit weight", "weight (kg)", "weight"],
  grade: ["grade"],
  conditionRaw: ["condition"],
  unitPrice: [
    "unit rrp",
    "reference price",
    "retail price",
    "rrp",
    "msrp",
    "unit price",
    "price",
  ],
  totalPrice: ["total rrp", "total price", "total"],
  currency: [
    "currency",
    "reference price currency",
    "price currency",
  ],
} as const;

const IMAGE_COLUMN_PATTERN = /^image\s*\d+$/i;

function normalizeHeader(h: string): string {
  return String(h ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function pickValue(
  row: Record<string, unknown>,
  headerMap: Map<string, string>,
  aliases: readonly string[]
): unknown {
  for (const alias of aliases) {
    const realHeader = headerMap.get(alias);
    if (realHeader && row[realHeader] !== undefined && row[realHeader] !== null) {
      return row[realHeader];
    }
  }
  return undefined;
}

function toNumber(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v).replace(/[^0-9.,-]/g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function toNumberOrNull(v: unknown): number | null {
  if (v == null || v === "" || v === "N/A") return null;
  const n = toNumber(v);
  return n === 0 ? null : n;
}

function toStr(v: unknown): string {
  if (v == null) return "";
  const s = String(v).trim();
  return s === "N/A" ? "" : s;
}

function toStrOrNull(v: unknown): string | null {
  const s = toStr(v);
  return s === "" ? null : s;
}

function extractImageUrls(
  row: Record<string, unknown>,
  imageHeaders: string[]
): string[] {
  const urls: string[] = [];
  for (const h of imageHeaders) {
    const v = row[h];
    if (v == null) continue;
    const s = String(v).trim();
    if (!s || s === "N/A") continue;
    if (!/^https?:\/\//i.test(s)) continue;
    urls.push(s);
  }
  return urls;
}

export interface ParseResult {
  rows: ParsedManifestRow[];
  manifestSku: string;
  totalReferencePrice: number;
  currency: string;
  errors: { row: number; message: string }[];
  totalRowsInSheet: number;
}

export interface ParseOptions {
  /** Sheet name; default tries "Worksheet" then falls back to first. */
  sheetName?: string;
}

export function parseManifestWorkbook(
  buffer: ArrayBuffer,
  opts: ParseOptions = {}
): ParseResult {
  const wb = XLSX.read(buffer, { type: "array" });
  const targetSheetName =
    opts.sheetName && wb.Sheets[opts.sheetName]
      ? opts.sheetName
      : wb.Sheets["Worksheet"]
      ? "Worksheet"
      : wb.SheetNames[0];

  if (!targetSheetName) {
    return {
      rows: [],
      manifestSku: "",
      totalReferencePrice: 0,
      currency: "EUR",
      errors: [{ row: 0, message: "Failā nav neviena darblapa." }],
      totalRowsInSheet: 0,
    };
  }

  const sheet = wb.Sheets[targetSheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    raw: true,
    defval: null,
  });

  if (json.length === 0) {
    return {
      rows: [],
      manifestSku: "",
      totalReferencePrice: 0,
      currency: "EUR",
      errors: [{ row: 0, message: `Darblapa "${targetSheetName}" ir tukša.` }],
      totalRowsInSheet: 0,
    };
  }

  const headerMap = new Map<string, string>();
  const imageHeaders: string[] = [];
  for (const realHeader of Object.keys(json[0]!)) {
    headerMap.set(normalizeHeader(realHeader), realHeader);
    if (IMAGE_COLUMN_PATTERN.test(realHeader)) imageHeaders.push(realHeader);
  }

  const rows: ParsedManifestRow[] = [];
  const errors: { row: number; message: string }[] = [];
  let totalReferencePrice = 0;
  let currency = "EUR";
  let manifestSku = "";

  for (let i = 0; i < json.length; i++) {
    const raw = json[i]!;

    const itemQty = toNumber(pickValue(raw, headerMap, COLUMN_ALIASES.itemQty)) || 1;
    const unitPrice = toNumber(pickValue(raw, headerMap, COLUMN_ALIASES.unitPrice));
    const totalFromSheet = toNumber(pickValue(raw, headerMap, COLUMN_ALIASES.totalPrice));
    // Prefer explicit Total RRP if provided; else unitPrice × qty.
    const totalPrice = totalFromSheet > 0 ? totalFromSheet : unitPrice * itemQty;

    const r: ParsedManifestRow = {
      productSku: toStr(pickValue(raw, headerMap, COLUMN_ALIASES.productSku)),
      manifestSku: toStr(pickValue(raw, headerMap, COLUMN_ALIASES.manifestSku)),
      title: toStr(pickValue(raw, headerMap, COLUMN_ALIASES.title)),
      description: toStr(pickValue(raw, headerMap, COLUMN_ALIASES.description)),
      asin: toStr(pickValue(raw, headerMap, COLUMN_ALIASES.asin)),
      ean: toStr(pickValue(raw, headerMap, COLUMN_ALIASES.ean)),
      barcode: toStr(pickValue(raw, headerMap, COLUMN_ALIASES.barcode)),
      brand: toStr(pickValue(raw, headerMap, COLUMN_ALIASES.brand)),
      categoryName: toStr(pickValue(raw, headerMap, COLUMN_ALIASES.categoryName)),
      subCategoryName: toStr(pickValue(raw, headerMap, COLUMN_ALIASES.subCategoryName)),
      itemQty,
      stockQty: toNumber(pickValue(raw, headerMap, COLUMN_ALIASES.stockQty)) || itemQty,
      weightKg: toNumberOrNull(pickValue(raw, headerMap, COLUMN_ALIASES.weightKg)),
      grade: toStrOrNull(pickValue(raw, headerMap, COLUMN_ALIASES.grade)),
      conditionRaw: toStrOrNull(pickValue(raw, headerMap, COLUMN_ALIASES.conditionRaw)),
      referencePrice: unitPrice,
      totalPrice,
      referenceCurrency:
        toStr(pickValue(raw, headerMap, COLUMN_ALIASES.currency)) || "EUR",
      manifestImages: extractImageUrls(raw, imageHeaders),
      raw,
    };

    if (!r.title && !r.productSku && !r.asin && r.referencePrice === 0) {
      // Pilnīgi tukša rinda — izlaižam
      continue;
    }

    if (!r.title) {
      errors.push({ row: i + 2, message: "Trūkst Product Title." });
    }
    if (!r.manifestSku && manifestSku) {
      r.manifestSku = manifestSku;
    }
    if (r.manifestSku && !manifestSku) {
      manifestSku = r.manifestSku;
    }
    if (r.referenceCurrency) currency = r.referenceCurrency;

    totalReferencePrice += r.totalPrice;
    rows.push(r);
  }

  return {
    rows,
    manifestSku: manifestSku || "UNKNOWN",
    totalReferencePrice,
    currency,
    errors,
    totalRowsInSheet: json.length,
  };
}

/**
 * Map a free-text "Condition" column value (e.g. "Customer Return",
 * "Brand New") onto our ProductCondition enum. Heuristics-based; falls back
 * to "untested" so we never reject a row.
 */
export function normalizeCondition(
  raw: string | null
): import("@/lib/types").ProductCondition {
  if (!raw) return "brand_new";
  const s = raw.toLowerCase();
  if (s.includes("brand new") || s.includes("new")) return "brand_new";
  if (s.includes("open box") || s.includes("opened")) return "open_box";
  if (s.includes("damaged package") || s.includes("damaged packaging")) {
    return "damaged_package";
  }
  if (s.includes("damaged product") || s.includes("broken")) return "damaged_product";
  if (
    s.includes("return") ||
    s.includes("untested") ||
    s.includes("salvage") ||
    s.includes("customer")
  ) {
    return "untested";
  }
  return "untested";
}

export function buildImportSummary(
  parse: ParseResult,
  inserted: number,
  duplicates: number,
  missingData: number,
  fileName: string,
  palletName: string
): ImportSummary {
  return {
    manifestSku: parse.manifestSku,
    palletName,
    fileName,
    totalRows: parse.totalRowsInSheet,
    importedCount: inserted,
    duplicateCount: duplicates,
    errorCount: parse.errors.length,
    missingDataCount: missingData,
    totalReferencePrice: parse.totalReferencePrice,
    currency: parse.currency,
    errors: parse.errors,
  };
}
