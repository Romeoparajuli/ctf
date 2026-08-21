import { Badge } from "./Badge";
import type { BadgeTone } from "./Badge";

const STATUS_TONE: Record<string, BadgeTone> = {
  // Registration
  DRAFT: "neutral",
  TERMS_ACCEPTED: "neutral",
  TEAM_CREATED: "neutral",
  PARTICIPANTS_ADDED: "info",
  PAYMENT_PENDING: "warning",
  PAYMENT_SUBMITTED: "info",
  PAYMENT_VERIFIED: "info",
  ADMIN_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "error",
  CANCELLED: "neutral",
  // Payment
  NOT_REQUIRED: "neutral",
  PENDING: "warning",
  SUBMITTED: "info",
  UNDER_REVIEW: "warning",
  VERIFIED: "success",
  // Account
  ACTIVE: "success",
  INACTIVE: "neutral",
  SUSPENDED: "error",
  PENDING_VERIFICATION: "warning",
  // Event
  PUBLISHED: "info",
  REGISTRATION_OPEN: "success",
  REGISTRATION_CLOSED: "neutral",
  ONGOING: "info",
  COMPLETED: "neutral",
  // Terms & Conditions
  ARCHIVED: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  TERMS_ACCEPTED: "Terms accepted",
  TEAM_CREATED: "Team created",
  PARTICIPANTS_ADDED: "Participants added",
  PAYMENT_PENDING: "Payment pending",
  PAYMENT_SUBMITTED: "Payment submitted",
  PAYMENT_VERIFIED: "Payment verified",
  ADMIN_REVIEW: "Under admin review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  NOT_REQUIRED: "Not required",
  PENDING: "Pending",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  VERIFIED: "Verified",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
  PENDING_VERIFICATION: "Pending verification",
  PUBLISHED: "Published",
  REGISTRATION_OPEN: "Registration open",
  REGISTRATION_CLOSED: "Registration closed",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{STATUS_LABEL[status] ?? status}</Badge>;
}
