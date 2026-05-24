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
  | "in_transit"        // imported into system, physical pallet en route from supplier
  | "imported"          // physical pallet received at warehouse, ready for sorting
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

  /** Sum of unit RRP × quantity across all rows (gross retail value). */
  totalReferencePrice: number;
  currency: string;

  /** Public Jobalots auction URL pasted by the user at upload time. */
  jobalotsUrl: string | null;

  /** What the user actually paid for the pallet at auction (EUR usually).
   *  Auto-filled from Jobalots URL when possible, else manually entered. */
  purchasePrice: number | null;

  /** Auction reserve price, informational only. */
  reservePrice: number | null;

  /** Free-text origin location, e.g. "Poland". */
  location: string | null;
  /** Total pallet weight in kg. */
  weightKg: number | null;
  /** Manifest condition, e.g. "Customer Return", "Brand New". */
  palletCondition: string | null;

  /** Cover image URL from Jobalots auction page (or any other source).
   *  Used as the visual identifier on Šķirošana / Loģistika / Manifesti
   *  cards so warehouse staff can recognise the pallet at a glance. */
  coverImage: string | null;

  /** Sorting "claim" — the warehouse worker who took responsibility for this
   *  pallet's product-by-product sort. Other workers see who has it, but
   *  cannot open the detail page (MASTER override always works). */
  sortingClaimedBy: string | null;
  sortingClaimedByEmail: string | null;
  sortingClaimedByName: string | null;
  sortingClaimedAt: Timestamp | null;

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

/** Lifecycle status — manually tracked until Shopify webhook integration
 *  (Posms 6). Tells us where each product is right now. */
export type ListingStatus =
  | "not_listed"        // not yet in store
  | "listing_approved"  // approved by warehouse/admin, awaiting publish
  | "listed_in_store"   // pushed to Shopify (or marked as listed manually)
  | "sold"              // marked as sold
  | "out_of_stock"      // listed but inventory hit zero (e.g. only one sold)
  | "disposed";         // marked damaged / disposable, moved to Utilizētās preces

export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  not_listed: "Nav veikalā",
  listing_approved: "Apstiprināts publicēšanai",
  listed_in_store: "Veikalā",
  sold: "Pārdots",
  out_of_stock: "Nav noliktavā",
  disposed: "Utilizēts",
};

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

  /** Per-unit weight from manifest (kg), when provided. */
  weightKg: number | null;
  /** Free-text grade from manifest (e.g. "A", "B"). */
  grade: string | null;

  referencePrice: number;
  referenceCurrency: string;
  marketPrice: number | null;
  suggestedPrice: number | null;
  finalPrice: number | null;

  /** Default discount applied at listing time (0–99). UI shows two quick
   *  presets (50 / 75) and a free slider. */
  listingDiscountPercent: number;

  /** Free-text note shown above the Shopify product description as a red
   *  banner, e.g. "Piezīme!! Precei bojāts korpuss". */
  customerNote: string | null;

  condition: ProductCondition;

  importStatus: ImportStatus;
  aiStatus: AiStatus;
  approvalStatus: ApprovalStatus;
  warehouseStatus: WarehouseStatus;
  /** Manual lifecycle marker — pre-Shopify-webhook integration. */
  listingStatus: ListingStatus;
  /** Reason recorded when listingStatus moves to "disposed". */
  disposalReason: string | null;

  /** Original manifest images (Jobalots S3, etc.). Up to 6 from Excel. */
  manifestImages: string[];
  /** AI-enriched / scraped images from Amazon, manufacturer, etc. */
  enrichedImages: string[];
  /** Effective images list used by the UI — by default manifest + enriched,
   *  user can override per product. */
  images: string[];

  sourceUrls: string[];
  confidenceScore: number | null;
  recommendedAction: RecommendedAction | null;

  /** AI-cleaned title and translated descriptions (filled by Posms 5). */
  enrichedTitle: string | null;
  descriptionLv: string | null;
  descriptionEn: string | null;

  /** Optional record of what the product was actually sold for (manual entry
   *  until Shopify webhook integration). Used for "ietirgots XX EUR". */
  soldPrice: number | null;
  soldAt: Timestamp | null;

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
  | "pallet_received"           // logistics → received → sent to sorting
  | "pallet_sorting_claimed"    // worker took responsibility for sorting
  | "pallet_sorting_released"   // claim released (by claimer or MASTER override)
  | "pallet_jobalots_synced"
  | "product_created"
  | "product_approved"
  | "product_rejected"
  | "product_sent_to_bundle"
  | "product_sent_to_outlet"
  | "product_marked_missing"
  | "product_marked_damaged"
  | "product_marked_disposed"
  | "product_listing_approved"
  | "product_listed_in_store"
  | "product_marked_sold"
  | "product_customer_note_set"
  | "product_discount_changed"
  | "price_changed"
  | "warehouse_status_changed"
  | "ai_enrichment_started"
  | "ai_enrichment_completed"
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
  weightKg: number | null;
  grade: string | null;
  conditionRaw: string | null;
  referencePrice: number;
  totalPrice: number;
  referenceCurrency: string;
  /** Image URLs from Image 1..Image 6 columns (only present if non-empty). */
  manifestImages: string[];
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
