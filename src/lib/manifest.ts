// Excel manifest parser
//
// Supports the Jobalots / pallet manifest schema with columns like:
//   Product SKU, Manifest SKU, Product Title, Product Description,
//   ASIN, EAN, Barcode, Brand, Category Name, Sub Category Name,
//   Item Qty, Stock Qty, Reference Price, Reference Price Currency
//
// The parser is column-name based and case-insensitive. Unknown columns
// are preserved under `raw` so we never silently drop data.

import * as XLSX from "xlsx";

import type { ImportSummary, ParsedManifestRow } from "@/lib/types";

const COLUMN_ALIASES: Record<keyof Omit<ParsedManifestRow, "raw">, string[]> = {
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
  itemQty: ["item qty", "item quantity", "qty", "quantity"],
  stockQty: ["stock qty", "stock"],
  referencePrice: [
    "reference price",
    "retail price",
    "rrp",
    "price",
    "msrp",
    "unit price",
  ],
  referenceCurrency: [
    "reference price currency",
    "currency",
    "price currency",
  ],
};

function normalizeHeader(h: string): string {
  return String(h ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function pickValue(
  row: Record<string, unknown>,
  headerMap: Map<string, string>,
  aliases: string[]
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

function toStr(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
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

export function parseManifestWorkbook(buffer: ArrayBuffer, opts: ParseOptions = {}): ParseResult {
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
  for (const realHeader of Object.keys(json[0]!)) {
    headerMap.set(normalizeHeader(realHeader), realHeader);
  }

  const rows: ParsedManifestRow[] = [];
  const errors: { row: number; message: string }[] = [];
  let totalReferencePrice = 0;
  let currency = "EUR";
  let manifestSku = "";

  for (let i = 0; i < json.length; i++) {
    const raw = json[i]!;
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
      itemQty: toNumber(pickValue(raw, headerMap, COLUMN_ALIASES.itemQty)) || 1,
      stockQty: toNumber(pickValue(raw, headerMap, COLUMN_ALIASES.stockQty)) || 0,
      referencePrice: toNumber(pickValue(raw, headerMap, COLUMN_ALIASES.referencePrice)),
      referenceCurrency:
        toStr(pickValue(raw, headerMap, COLUMN_ALIASES.referenceCurrency)) || "EUR",
      raw,
    };

    if (!r.title && !r.productSku && !r.asin && r.referencePrice === 0) {
      // Visa rinda tukša — izlaižam, bet neuzskaitām par kļūdu
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

    totalReferencePrice += r.referencePrice * (r.itemQty || 1);
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
