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
import type {
  ApprovalStatus,
  ParsedManifestRow,
  Product,
  ProductCondition,
  WarehouseStatus,
} from "@/lib/types";

export async function listProducts(opts?: {
  palletId?: string;
  approvalStatus?: ApprovalStatus;
  warehouseStatus?: WarehouseStatus;
  limitTo?: number;
}): Promise<Product[]> {
  if (!firebaseDb) return [];
  const filters = [] as Parameters<typeof query>[1][];
  if (opts?.palletId) filters.push(where("palletId", "==", opts.palletId));
  if (opts?.approvalStatus) filters.push(where("approvalStatus", "==", opts.approvalStatus));
  if (opts?.warehouseStatus) filters.push(where("warehouseStatus", "==", opts.warehouseStatus));

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

export async function bulkInsertProductsForPallet(
  palletId: string,
  rows: ParsedManifestRow[],
  defaults?: { condition?: ProductCondition }
): Promise<{ inserted: number }> {
  if (!firebaseDb) throw new Error("Firestore nav konfigurēts");
  if (rows.length === 0) return { inserted: 0 };

  // Firestore batches max 500 ops; chunk accordingly.
  const CHUNK = 400;
  let inserted = 0;
  const cond: ProductCondition = defaults?.condition ?? "brand_new";

  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const batch = writeBatch(firebaseDb);
    for (const row of slice) {
      const pricing = computePricing({
        referencePrice: row.referencePrice,
        condition: cond,
      });
      const ref = doc(collection(firebaseDb, "products"));
      batch.set(ref, {
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
        referencePrice: row.referencePrice,
        referenceCurrency: row.referenceCurrency,
        marketPrice: null,
        suggestedPrice: pricing.suggestedPrice,
        finalPrice: pricing.suggestedPrice,
        condition: cond,
        importStatus: "imported",
        aiStatus: "not_started",
        approvalStatus: "draft",
        warehouseStatus: "not_checked",
        images: [],
        sourceUrls: [],
        confidenceScore: null,
        recommendedAction: pricing.recommendedAction,
        shopifyProductId: null,
        shopifyVariantId: null,
        shopifyStatus: "not_synced",
        publishedAt: null,
        syncError: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
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
  approvalStatus?: ApprovalStatus;
  warehouseStatus?: WarehouseStatus;
  images?: string[];
}

export async function updateProduct(id: string, patch: UpdateProductInput): Promise<void> {
  if (!firebaseDb) throw new Error("Firestore nav konfigurēts");
  await updateDoc(doc(firebaseDb, "products", id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function recomputeAndSavePricing(product: Product): Promise<void> {
  const pricing = computePricing({
    referencePrice: product.referencePrice,
    marketPrice: product.marketPrice ?? null,
    condition: product.condition,
  });
  await updateProduct(product.id, {
    finalPrice: pricing.suggestedPrice,
  });
}

export async function createSingleProduct(
  palletId: string,
  row: ParsedManifestRow
): Promise<string> {
  if (!firebaseDb) throw new Error("Firestore nav konfigurēts");
  const pricing = computePricing({
    referencePrice: row.referencePrice,
    condition: "brand_new",
  });
  const ref = await addDoc(collection(firebaseDb, "products"), {
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
    referencePrice: row.referencePrice,
    referenceCurrency: row.referenceCurrency,
    marketPrice: null,
    suggestedPrice: pricing.suggestedPrice,
    finalPrice: pricing.suggestedPrice,
    condition: "brand_new",
    importStatus: "imported",
    aiStatus: "not_started",
    approvalStatus: "draft",
    warehouseStatus: "not_checked",
    images: [],
    sourceUrls: [],
    confidenceScore: null,
    recommendedAction: pricing.recommendedAction,
    shopifyProductId: null,
    shopifyVariantId: null,
    shopifyStatus: "not_synced",
    publishedAt: null,
    syncError: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}
