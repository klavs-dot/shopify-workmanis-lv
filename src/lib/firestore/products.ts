import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { firebaseDb } from "@/lib/firebase";
import { computePricing } from "@/lib/pricing";
import { normalizeCondition } from "@/lib/manifest";
import type {
  ApprovalStatus,
  ListingStatus,
  ParsedManifestRow,
  Product,
  ProductCondition,
  WarehouseStatus,
} from "@/lib/types";

export async function listProducts(opts?: {
  palletId?: string;
  approvalStatus?: ApprovalStatus;
  warehouseStatus?: WarehouseStatus;
  listingStatus?: ListingStatus;
  limitTo?: number;
}): Promise<Product[]> {
  if (!firebaseDb) return [];
  const filters = [] as Parameters<typeof query>[1][];
  if (opts?.palletId) filters.push(where("palletId", "==", opts.palletId));
  if (opts?.approvalStatus) filters.push(where("approvalStatus", "==", opts.approvalStatus));
  if (opts?.warehouseStatus) filters.push(where("warehouseStatus", "==", opts.warehouseStatus));
  if (opts?.listingStatus) filters.push(where("listingStatus", "==", opts.listingStatus));

  const constraints = [
    ...filters,
    orderBy("createdAt", "desc"),
    ...(opts?.limitTo ? [limit(opts.limitTo)] : []),
  ];
  const q = query(collection(firebaseDb, "products"), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) }));
}

export async function getProduct(id: string): Promise<Product | null> {
  if (!firebaseDb) return null;
  const snap = await getDoc(doc(firebaseDb, "products", id));
  if (!snap.exists()) return null;
  return { id, ...(snap.data() as Omit<Product, "id">) };
}

function buildProductDoc(palletId: string, row: ParsedManifestRow) {
  const cond: ProductCondition = normalizeCondition(row.conditionRaw);
  const pricing = computePricing({
    referencePrice: row.referencePrice,
    condition: cond,
  });
  return {
    palletId,
    productSku: row.productSku,
    manifestSku: row.manifestSku,
    title: row.title,
    description: row.description,
    asin: row.asin,
    ean: row.ean,
    barcode: row.barcode,
    brand: row.brand,
    categoryName: row.categoryName,
    subCategoryName: row.subCategoryName,
    itemQty: row.itemQty,
    stockQty: row.stockQty,
    weightKg: row.weightKg,
    grade: row.grade,
    referencePrice: row.referencePrice,
    referenceCurrency: row.referenceCurrency,
    marketPrice: null,
    suggestedPrice: pricing.suggestedPrice,
    finalPrice: pricing.suggestedPrice,
    listingDiscountPercent: 50,
    customerNote: null,
    condition: cond,
    importStatus: "imported",
    aiStatus: "not_started",
    approvalStatus: "draft",
    warehouseStatus: "not_checked",
    listingStatus: "not_listed" satisfies ListingStatus,
    disposalReason: null,
    manifestImages: row.manifestImages,
    enrichedImages: [],
    images: row.manifestImages,
    sourceUrls: [],
    confidenceScore: null,
    recommendedAction: pricing.recommendedAction,
    enrichedTitle: null,
    descriptionLv: null,
    descriptionEn: null,
    soldPrice: null,
    soldAt: null,
    listedAt: null,
    outletSaleAt: null,
    shopifyProductId: null,
    shopifyVariantId: null,
    shopifyStatus: "not_synced",
    publishedAt: null,
    syncError: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export async function bulkInsertProductsForPallet(
  palletId: string,
  rows: ParsedManifestRow[]
): Promise<{ inserted: number }> {
  if (!firebaseDb) throw new Error("Firestore nav konfigurēts");
  if (rows.length === 0) return { inserted: 0 };

  const CHUNK = 400;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const batch = writeBatch(firebaseDb);
    for (const row of slice) {
      const ref = doc(collection(firebaseDb, "products"));
      batch.set(ref, buildProductDoc(palletId, row));
      inserted += 1;
    }
    await batch.commit();
  }

  return { inserted };
}

export interface UpdateProductInput {
  title?: string;
  description?: string;
  condition?: ProductCondition;
  marketPrice?: number | null;
  finalPrice?: number | null;
  listingDiscountPercent?: number;
  customerNote?: string | null;
  approvalStatus?: ApprovalStatus;
  warehouseStatus?: WarehouseStatus;
  listingStatus?: ListingStatus;
  disposalReason?: string | null;
  soldPrice?: number | null;
  soldAt?: ReturnType<typeof serverTimestamp> | null;
  shippedAt?: ReturnType<typeof serverTimestamp> | null;
  shippedByUid?: string | null;
  listedAt?: ReturnType<typeof serverTimestamp> | null;
  outletSaleAt?: ReturnType<typeof serverTimestamp> | null;
  images?: string[];
  enrichedImages?: string[];
  enrichedTitle?: string | null;
  enrichedTitleEn?: string | null;
  enrichedTitleRu?: string | null;
  descriptionLv?: string | null;
  descriptionEn?: string | null;
  descriptionRu?: string | null;
}

export async function updateProduct(id: string, patch: UpdateProductInput): Promise<void> {
  if (!firebaseDb) throw new Error("Firestore nav konfigurēts");
  await updateDoc(doc(firebaseDb, "products", id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function createSingleProduct(
  palletId: string,
  row: ParsedManifestRow
): Promise<string> {
  if (!firebaseDb) throw new Error("Firestore nav konfigurēts");
  const ref = await addDoc(collection(firebaseDb, "products"), buildProductDoc(palletId, row));
  return ref.id;
}

export async function markProductDisposed(
  id: string,
  reason: string | null
): Promise<void> {
  await updateProduct(id, {
    listingStatus: "disposed",
    disposalReason: reason,
  });
}

export async function markProductSold(
  id: string,
  soldPrice: number | null
): Promise<void> {
  await updateProduct(id, {
    listingStatus: "sold",
    soldPrice,
    soldAt: serverTimestamp(),
  });
}

/** Mark a sold product as physically dispatched to the customer.
 *  Captures who shipped it for accountability. */
export async function markProductShipped(
  id: string,
  shippedByUid: string
): Promise<void> {
  await updateProduct(id, {
    shippedAt: serverTimestamp(),
    shippedByUid,
  });
}
