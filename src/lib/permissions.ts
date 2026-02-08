/**
 * Role-based permissions for org-level access.
 * MEMBER: upload, view own receipts
 * TREASURER: view all receipts, approve/reject/mark paid
 * EXEC: treasurer + org settings
 * ADMIN: same as exec (backward compat)
 */
export type OrgRole = "member" | "treasurer" | "exec" | "admin";

const ADMIN_ROLES: OrgRole[] = ["treasurer", "exec", "admin"];
const EXEC_ROLES: OrgRole[] = ["exec", "admin"];

export function canViewAllReceipts(role: OrgRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function canApproveReceipts(role: OrgRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function canManageOrgSettings(role: OrgRole): boolean {
  return EXEC_ROLES.includes(role);
}

export function canAccessAdmin(role: OrgRole): boolean {
  return canApproveReceipts(role);
}
