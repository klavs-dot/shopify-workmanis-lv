import type { AuditAction, AuditEntityType } from "@/lib/types";

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  user_created: "Izveidots lietotājs",
  user_updated: "Atjaunots lietotājs",
  user_disabled: "Deaktivizēts lietotājs",
  user_enabled: "Aktivizēts lietotājs",
  role_changed: "Mainīta loma",
  manifest_imported: "Importēts manifests",
  pallet_created: "Izveidota palete",
  pallet_received: "Palete saņemta noliktavā",
  pallet_sorting_claimed: "Paņemta šķirot",
  pallet_sorting_released: "Atbrīvota no šķirošanas",
  pallet_jobalots_synced: "Sinhronizēta ar Jobalots",
  product_created: "Izveidots produkts",
  product_approved: "Apstiprināts produkts",
  product_rejected: "Noraidīts produkts",
  product_sent_to_bundle: "Pievienots komplektam",
  product_sent_to_outlet: "Nosūtīts uz outlet",
  product_marked_missing: "Atzīmēts kā trūkstošs",
  product_marked_damaged: "Atzīmēts kā bojāts",
  product_marked_disposed: "Pārvietots uz Utilizētajām",
  product_listing_approved: "Apstiprināts publicēšanai",
  product_listed_in_store: "Ievietots veikalā",
  product_marked_sold: "Atzīmēts kā pārdots",
  product_customer_note_set: "Iestatīta piezīme klientam",
  product_discount_changed: "Mainīta atlaide",
  product_moved_to_outlet_sale: "Pārvietots uz Izpārdošanu",
  product_bulk_discount_applied: "Bulk atlaide pielietota",
  product_bulk_price_set: "Bulk cena iestatīta",
  price_changed: "Mainīta cena",
  warehouse_status_changed: "Mainīts noliktavas statuss",
  ai_enrichment_started: "Sākts AI bagātinājums",
  ai_enrichment_completed: "Pabeigts AI bagātinājums",
  image_added: "Pievienots attēls",
  login: "Pieslēgšanās",
};

export const AUDIT_ENTITY_LABEL: Record<AuditEntityType, string> = {
  user: "lietotājs",
  pallet: "palete",
  product: "produkts",
  system: "sistēma",
  shopify_connection: "Shopify konekcija",
};

export function labelForAction(action: AuditAction): string {
  return AUDIT_ACTION_LABEL[action] ?? action;
}

export function labelForEntity(entityType: AuditEntityType): string {
  return AUDIT_ENTITY_LABEL[entityType] ?? entityType;
}
