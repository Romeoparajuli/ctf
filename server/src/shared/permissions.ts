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
    permissions: ["events.view", "events.create", "events.update"],
  },
  PARTICIPANT: {
    description: "Standard participant account.",
    permissions: [
      "events.view",
      "teams.view", "teams.create", "teams.update",
      "participants.view", "participants.create",
      "registrations.view", "registrations.create", "registrations.submit",
      "payments.submit", "payments.view",
    ],
  },
};

export function expandRolePermissions(permissions: Permission[] | "*"): Permission[] {
  return permissions === "*" ? [...PERMISSIONS] : permissions;
}
