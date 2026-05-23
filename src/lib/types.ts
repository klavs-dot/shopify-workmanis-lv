// Core domain types for shopify.workmanis.lv
// SEPARATE project from Workmanis.lv — do not import shared types from there.

import type { Timestamp } from "firebase/firestore";

// ---------- Roles ----------

export type UserRole = "MASTER" | "ADMIN" | "WAREHOUSE" | "VIEWER";

export const USER_ROLES: UserRole[] = ["MASTER", "ADMIN", "WAREHOUSE", "VIEWER"];

export type UserStatus = "active" | "disabled";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  createdBy: string | null;
  lastLogin: Timestamp | null;
}

// ---------- Pallets ----------

export type PalletStatus =
  | "imported"
  | "in_warehouse_check"
  | "in_pricing"
  | "in_approval"
  | "ready_for_shopify"
  | "published"
  | "archived";

export interface Pallet {
  id: string;
  manifestSku: string;
  name: string;
  source: string;
  originalFileName: string;
  totalProducts: number;
  totalReferencePrice: number;
  currency: string;
  status: PalletStatus;
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

// ---------- Products ----------

export type ImportStatus = "imported" | "import_error" | "duplicate" | "missing_data";

export type AiStatus =
  | "not_started"
  | "enrichment_pending"
  | "enriched"
  | "failed"
  | "needs_review";

export type ApprovalStatus =
  | "draft"
  | "waiting_approval"
  | "approved"
  | "rejected"
  | "bundle"
  | "outlet"
  | "do_not_publish";

export type WarehouseStatus =
  | "not_checked"
  | "found"
  | "missing"
  | "damaged_package"
  | "damaged_product"
  | "tested_ok"
  | "tested_failed"
  | "needs_photo"
  | "ready";

export type ProductCondition =
  | "brand_new"
  | "open_box"
  | "damaged_package"
  | "untested"
  | "damaged_product";

export type RecommendedAction =
  | "sell_individually"
  | "bundle"
  | "outlet"
  | "manual_review"
  | "do_not_publish";

export type ShopifyStatus = "not_synced" | "draft" | "active" | "archived" | "error";

export interface Product {
  id: string;
  palletId: string;

  productSku: string;
  manifestSku: string;
  title: string;
  description: string;

  asin: string;
  ean: string;
  barcode: string;
  brand: string;
  categoryName: string;
  subCategoryName: string;

  itemQty: number;
  stockQty: number;

  referencePrice: number;
  referenceCurrency: string;
  marketPrice: number | null;
  suggestedPrice: number | null;
  finalPrice: number | null;

  condition: ProductCondition;

  importStatus: ImportStatus;
  aiStatus: AiStatus;
  approvalStatus: ApprovalStatus;
  warehouseStatus: WarehouseStatus;

  images: string[];
  sourceUrls: string[];
  confidenceScore: number | null;
  recommendedAction: RecommendedAction | null;

  // Reserved for future Shopify integration
  shopifyProductId: string | null;
  shopifyVariantId: string | null;
  shopifyStatus: ShopifyStatus;
  publishedAt: Timestamp | null;
  syncError: string | null;

  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

// ---------- Audit ----------

export type AuditAction =
  | "user_created"
  | "user_updated"
  | "user_disabled"
  | "user_enabled"
  | "role_changed"
  | "manifest_imported"
  | "pallet_created"
  | "product_created"
  | "product_approved"
  | "product_rejected"
  | "product_sent_to_bundle"
  | "product_sent_to_outlet"
  | "product_marked_missing"
  | "product_marked_damaged"
  | "price_changed"
  | "warehouse_status_changed"
  | "image_added"
  | "login";

export type AuditEntityType =
  | "user"
  | "pallet"
  | "product"
  | "system"
  | "shopify_connection";

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: Timestamp | null;
}

// ---------- Future: Shopify connection placeholder ----------

export interface ShopifyConnection {
  id: string;
  userId: string;
  shopName: string;
  shopDomain: string;
  accessTokenEncrypted: string;
  status: "connected" | "disconnected" | "error";
  connectedAt: Timestamp | null;
  lastSyncAt: Timestamp | null;
}

// ---------- Manifest parsing ----------

export interface ParsedManifestRow {
  productSku: string;
  manifestSku: string;
  title: string;
  description: string;
  asin: string;
  ean: string;
  barcode: string;
  brand: string;
  categoryName: string;
  subCategoryName: string;
  itemQty: number;
  stockQty: number;
  referencePrice: number;
  referenceCurrency: string;
  raw: Record<string, unknown>;
}

export interface ImportSummary {
  manifestSku: string;
  palletName: string;
  fileName: string;
  totalRows: number;
  importedCount: number;
  duplicateCount: number;
  errorCount: number;
  missingDataCount: number;
  totalReferencePrice: number;
  currency: string;
  errors: { row: number; message: string }[];
}
