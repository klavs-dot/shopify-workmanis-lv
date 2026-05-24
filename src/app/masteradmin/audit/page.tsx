import { redirect } from "next/navigation";

// Legacy MASTER-only audit page is replaced by the role-aware
// /darbibu-vesture page available to all roles.
export default function LegacyAuditRedirect(): never {
  redirect("/darbibu-vesture");
}
