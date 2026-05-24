import type { UserRole } from "@/lib/types";

// Pages a role is allowed to access. Used for both server-side gating
// and the client-side AuthProvider redirect logic.
export const ROLE_ROUTES: Record<UserRole, RegExp[]> = {
  MASTER: [/.*/], // everything
  ADMIN: [
    /^\/dashboard/,
    /^\/manifesti/,
    /^\/logistika/,
    /^\/skirosana/,
    /^\/products/,
    /^\/utilizetas/,
    /^\/approval/,
    /^\/settings\/profile/,
  ],
  WAREHOUSE: [
    /^\/dashboard/,
    /^\/logistika/,
    /^\/skirosana/,
    /^\/products/,
    /^\/utilizetas/,
    /^\/approval/,
    /^\/settings\/profile/,
  ],
  VIEWER: [
    /^\/dashboard/,
    /^\/logistika/,
    /^\/skirosana/,
    /^\/products/,
    /^\/utilizetas/,
    /^\/settings\/profile/,
  ],
};

export function canAccessPath(role: UserRole, pathname: string): boolean {
  return ROLE_ROUTES[role].some((re) => re.test(pathname));
}

// Action-level permissions (used inside pages/components to gate buttons).
export const PERMISSIONS = {
  manageUsers: ["MASTER"] as UserRole[],
  viewMasterAdmin: ["MASTER"] as UserRole[],
  importManifest: ["MASTER", "ADMIN"] as UserRole[],
  approveProducts: ["MASTER", "ADMIN"] as UserRole[],
  changePrice: ["MASTER", "ADMIN"] as UserRole[],
  changeWarehouseStatus: ["MASTER", "ADMIN", "WAREHOUSE"] as UserRole[],
  uploadProductImage: ["MASTER", "ADMIN", "WAREHOUSE"] as UserRole[],
  viewProducts: ["MASTER", "ADMIN", "WAREHOUSE", "VIEWER"] as UserRole[],
  viewAuditLog: ["MASTER"] as UserRole[],
  managePallets: ["MASTER", "ADMIN"] as UserRole[],
  // Receive physical pallets (Loģistika → Šķirošana transition).
  // Warehouse staff is the typical caller, not just admins.
  receivePallets: ["MASTER", "ADMIN", "WAREHOUSE"] as UserRole[],
  connectShopify: ["MASTER", "ADMIN"] as UserRole[],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: UserRole | null | undefined, perm: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[perm] as readonly UserRole[]).includes(role);
}

export const ROLE_LABEL: Record<UserRole, string> = {
  MASTER: "Master",
  ADMIN: "Admin",
  WAREHOUSE: "Warehouse",
  VIEWER: "Viewer",
};

export const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  MASTER: "bg-purple-100 text-purple-800 ring-purple-200",
  ADMIN: "bg-blue-100 text-blue-800 ring-blue-200",
  WAREHOUSE: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  VIEWER: "bg-slate-100 text-slate-700 ring-slate-200",
};
