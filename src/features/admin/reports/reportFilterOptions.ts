import type { ReportId } from "../../../api/reports";

/** Status dropdown options per report — each report's `status` filter targets a different underlying enum. */
export const STATUS_OPTIONS_BY_REPORT: Partial<Record<ReportId, string[]>> = {
  registrations: [
    "DRAFT", "TERMS_ACCEPTED", "TEAM_CREATED", "PARTICIPANTS_ADDED", "PAYMENT_PENDING",
    "PAYMENT_SUBMITTED", "PAYMENT_VERIFIED", "ADMIN_REVIEW", "APPROVED", "REJECTED", "CANCELLED",
  ],
  payments: ["PENDING", "SUBMITTED", "UNDER_REVIEW", "VERIFIED", "REJECTED"],
  approvals: ["APPROVED", "REJECTED"],
  users: ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"],
};
