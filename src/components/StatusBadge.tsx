import type {
  AiStatus,
  ApprovalStatus,
  ImportStatus,
  PalletStatus,
  ProductCondition,
  ShopifyStatus,
  WarehouseStatus,
} from "@/lib/types";

type BadgeMap<T extends string> = Record<T, { label: string; className: string }>;

const baseClass =
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset";

const APPROVAL: BadgeMap<ApprovalStatus> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-700 ring-slate-200" },
  waiting_approval: {
    label: "Gaida apstiprinājumu",
    className: "bg-amber-100 text-amber-800 ring-amber-200",
  },
  approved: { label: "Apstiprināts", className: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  rejected: { label: "Noraidīts", className: "bg-red-100 text-red-800 ring-red-200" },
  bundle: { label: "Bundle", className: "bg-indigo-100 text-indigo-800 ring-indigo-200" },
  outlet: { label: "Outlet", className: "bg-orange-100 text-orange-800 ring-orange-200" },
  do_not_publish: {
    label: "Nepublicēt",
    className: "bg-rose-100 text-rose-800 ring-rose-200",
  },
};

const WAREHOUSE: BadgeMap<WarehouseStatus> = {
  not_checked: { label: "Nepārbaudīts", className: "bg-slate-100 text-slate-700 ring-slate-200" },
  found: { label: "Atrasts", className: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  missing: { label: "Trūkst", className: "bg-red-100 text-red-800 ring-red-200" },
  damaged_package: {
    label: "Bojāts iepakojums",
    className: "bg-amber-100 text-amber-800 ring-amber-200",
  },
  damaged_product: { label: "Bojāts produkts", className: "bg-red-100 text-red-800 ring-red-200" },
  tested_ok: { label: "Testēts OK", className: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  tested_failed: { label: "Tests neizturēja", className: "bg-red-100 text-red-800 ring-red-200" },
  needs_photo: { label: "Vajag bildi", className: "bg-yellow-100 text-yellow-800 ring-yellow-200" },
  ready: { label: "Ready", className: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
};

const IMPORT: BadgeMap<ImportStatus> = {
  imported: { label: "Importēts", className: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  import_error: {
    label: "Importa kļūda",
    className: "bg-red-100 text-red-800 ring-red-200",
  },
  duplicate: { label: "Duplikāts", className: "bg-amber-100 text-amber-800 ring-amber-200" },
  missing_data: {
    label: "Trūkst datu",
    className: "bg-orange-100 text-orange-800 ring-orange-200",
  },
};

const AI: BadgeMap<AiStatus> = {
  not_started: { label: "AI: nesākts", className: "bg-slate-100 text-slate-700 ring-slate-200" },
  enrichment_pending: {
    label: "AI: rindā",
    className: "bg-blue-100 text-blue-800 ring-blue-200",
  },
  enriched: { label: "AI: gatavs", className: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  failed: { label: "AI: kļūda", className: "bg-red-100 text-red-800 ring-red-200" },
  needs_review: {
    label: "AI: jāpārskata",
    className: "bg-amber-100 text-amber-800 ring-amber-200",
  },
};

const PALLET: BadgeMap<PalletStatus> = {
  in_transit: {
    label: "Ceļā — gaidām piegādi",
    className: "bg-amber-100 text-amber-800 ring-amber-200",
  },
  imported: { label: "Saņemts noliktavā", className: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  in_warehouse_check: {
    label: "Noliktavas pārbaude",
    className: "bg-blue-100 text-blue-800 ring-blue-200",
  },
  in_pricing: { label: "Cenu noteikšana", className: "bg-indigo-100 text-indigo-800 ring-indigo-200" },
  in_approval: { label: "Apstiprināšana", className: "bg-amber-100 text-amber-800 ring-amber-200" },
  ready_for_shopify: {
    label: "Gatava Shopify",
    className: "bg-purple-100 text-purple-800 ring-purple-200",
  },
  published: { label: "Publicēta", className: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  archived: { label: "Arhivēta", className: "bg-slate-100 text-slate-700 ring-slate-200" },
};

const CONDITION: BadgeMap<ProductCondition> = {
  brand_new: { label: "Jauns", className: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  open_box: { label: "Atvērta kaste", className: "bg-blue-100 text-blue-800 ring-blue-200" },
  damaged_package: {
    label: "Bojāts iepakojums",
    className: "bg-amber-100 text-amber-800 ring-amber-200",
  },
  untested: { label: "Netestēts", className: "bg-slate-100 text-slate-700 ring-slate-200" },
  damaged_product: { label: "Bojāts produkts", className: "bg-red-100 text-red-800 ring-red-200" },
};

const SHOPIFY: BadgeMap<ShopifyStatus> = {
  not_synced: { label: "Nesinhronizēts", className: "bg-slate-100 text-slate-700 ring-slate-200" },
  draft: { label: "Shopify draft", className: "bg-blue-100 text-blue-800 ring-blue-200" },
  active: { label: "Shopify active", className: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  archived: { label: "Shopify archived", className: "bg-slate-100 text-slate-700 ring-slate-200" },
  error: { label: "Shopify kļūda", className: "bg-red-100 text-red-800 ring-red-200" },
};

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const it = APPROVAL[status];
  return <span className={`${baseClass} ${it.className}`}>{it.label}</span>;
}
export function WarehouseBadge({ status }: { status: WarehouseStatus }) {
  const it = WAREHOUSE[status];
  return <span className={`${baseClass} ${it.className}`}>{it.label}</span>;
}
export function ImportBadge({ status }: { status: ImportStatus }) {
  const it = IMPORT[status];
  return <span className={`${baseClass} ${it.className}`}>{it.label}</span>;
}
export function AiBadge({ status }: { status: AiStatus }) {
  const it = AI[status];
  return <span className={`${baseClass} ${it.className}`}>{it.label}</span>;
}
export function PalletBadge({ status }: { status: PalletStatus }) {
  const it = PALLET[status];
  return <span className={`${baseClass} ${it.className}`}>{it.label}</span>;
}
export function ConditionBadge({ condition }: { condition: ProductCondition }) {
  const it = CONDITION[condition];
  return <span className={`${baseClass} ${it.className}`}>{it.label}</span>;
}
export function ShopifyBadge({ status }: { status: ShopifyStatus }) {
  const it = SHOPIFY[status];
  return <span className={`${baseClass} ${it.className}`}>{it.label}</span>;
}
