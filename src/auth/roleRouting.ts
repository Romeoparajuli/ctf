import type { User } from "../types/domain";

/**
 * Any permission in this list means the account is a staff/administrative
 * user, not a plain participant — it must never see the participant
 * registration CTA or the /register/:eventId flow, on this system's own
 * permission-based RBAC (not hardcoded role names, per Section 9).
 */
export const ADMIN_ENTRY_PERMISSIONS = [
  "events.view", "registrations.view", "teams.view", "payments.view",
  "users.view", "roles.view", "analytics.view", "reports.view",
  "audit_logs.view", "system_settings.view", "terms.view",
] as const;

/** Permissions that warrant the full admin dashboard rather than the narrower event-manager view. */
const FULL_ADMIN_PERMISSIONS = [
  "registrations.view", "payments.view", "users.view", "roles.view",
  "analytics.view", "reports.view", "audit_logs.view", "system_settings.view",
] as const;

export function hasAdminAccess(user: User | null | undefined): boolean {
  if (!user) return false;
  return ADMIN_ENTRY_PERMISSIONS.some((p) => user.permissions.includes(p));
}

/**
 * Single source of truth for "where does this user land after login / when
 * they hit a workspace that isn't theirs". Registration status must never
 * substitute for this — it only matters once a participant is already in
 * the participant workspace.
 */
export function getDefaultRoute(user: User | null | undefined): string {
  if (!user) return "/login";
  if (FULL_ADMIN_PERMISSIONS.some((p) => user.permissions.includes(p))) return "/admin";
  if (user.permissions.includes("events.view")) return "/admin/events";
  return "/dashboard";
}
