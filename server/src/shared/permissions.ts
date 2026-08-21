export const PERMISSIONS = [
  "users.view", "users.create", "users.update", "users.delete",
  "roles.view", "roles.create", "roles.update", "roles.delete",
  "events.view", "events.create", "events.update", "events.delete",
  "teams.view", "teams.create", "teams.update", "teams.delete",
  "participants.view", "participants.create", "participants.update", "participants.delete",
  "registrations.view", "registrations.create", "registrations.update",
  "registrations.submit", "registrations.approve", "registrations.reject",
  "payments.view", "payments.submit", "payments.verify", "payments.reject",
  "reports.view", "reports.export",
  "analytics.view",
  "audit_logs.view",
  "system_settings.view", "system_settings.update",
  // "terms.acceptance_view" (not "terms.acceptance.view" as in the original
  // spec text) to match this app's existing module.action convention —
  // every other multi-word action already uses an underscore (e.g.
  // system_settings.view), and the admin Roles UI's permission matrix
  // splits a key on its *first* dot to derive the module column.
  "terms.view", "terms.create", "terms.update", "terms.delete",
  "terms.publish", "terms.archive", "terms.preview", "terms.acceptance_view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_DEFINITIONS: Record<string, { description: string; permissions: Permission[] | "*" }> = {
  SUPER_ADMIN: {
    description: "Full system access.",
    permissions: "*",
  },
  ADMINISTRATOR: {
    description: "Administrative management without unrestricted system-level permissions.",
    permissions: [
      "users.view", "users.create", "users.update",
      "events.view", "events.create", "events.update",
      "teams.view", "teams.update", "teams.delete",
      "participants.view", "participants.update",
      "registrations.view", "registrations.update", "registrations.approve", "registrations.reject",
      "payments.view", "payments.verify", "payments.reject",
      "reports.view", "reports.export",
      "analytics.view",
      "audit_logs.view",
      "terms.view", "terms.create", "terms.update",
      "terms.publish", "terms.archive", "terms.preview", "terms.acceptance_view",
    ],
  },
  REGISTRATION_REVIEWER: {
    description: "Can review registrations, participants and payments; approve or reject registrations.",
    permissions: [
      "registrations.view", "registrations.approve", "registrations.reject",
      "participants.view",
      "payments.view",
    ],
  },
  PAYMENT_REVIEWER: {
    description: "Can view, verify and reject payments.",
    permissions: ["payments.view", "payments.verify", "payments.reject", "reports.view"],
  },
  EVENT_MANAGER: {
    description: "Can create and manage events, registration configuration and event content.",
    permissions: [
      "events.view", "events.create", "events.update",
      "terms.view", "terms.create", "terms.update",
      "terms.publish", "terms.archive", "terms.preview", "terms.acceptance_view",
    ],
  },
  PARTICIPANT: {
    // Deliberately excludes events.view / teams.view / registrations.view / payments.view:
    // those exact keys also gate the admin-wide listing endpoints (GET /api/teams,
    // /api/registrations, /api/payments). A participant's own data is reachable
    // through ownership checks on their own routes, not these permissions — granting
    // them here would let any participant list every team/registration/payment in
    // the system, and would also make them misclassify as a staff account in the
    // frontend's role-based routing (see src/auth/roleRouting.ts).
    description: "Standard participant account.",
    permissions: [
      "teams.create", "teams.update",
      "participants.create",
      "registrations.create", "registrations.submit",
      "payments.submit",
    ],
  },
};

export function expandRolePermissions(permissions: Permission[] | "*"): Permission[] {
  return permissions === "*" ? [...PERMISSIONS] : permissions;
}
