export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";

export interface User {
  id: number;
  fullName: string;
  email: string;
  status: AccountStatus;
  roles: string[];
  permissions: string[];
}

export interface AdminUserRow {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  status: AccountStatus;
  created_at: string;
  roles: string[];
}

export type RegistrationState = "NOT_STARTED" | "EARLY" | "LATE" | "CLOSED";
export type EventStatus =
  | "DRAFT" | "PUBLISHED" | "REGISTRATION_OPEN" | "REGISTRATION_CLOSED" | "ONGOING" | "COMPLETED" | "CANCELLED";

export interface EventSummary {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  rules: string | null;
  prizePool: string | null;
  venue: string | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
  registrationStartDate: string;
  earlyRegistrationEndDate: string;
  lateRegistrationEndDate: string;
  earlyRegistrationFee: number;
  lateRegistrationFee: number;
  paymentInstructions: string | null;
  paymentQr: string | null;
  minTeamSize: number;
  maxTeamSize: number;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  registrationState: RegistrationState;
  currentPeriod: "EARLY" | "LATE" | null;
  currentFee: number | null;
}

export type RegistrationStatus =
  | "DRAFT" | "TERMS_ACCEPTED" | "TEAM_CREATED" | "PARTICIPANTS_ADDED"
  | "PAYMENT_PENDING" | "PAYMENT_SUBMITTED" | "PAYMENT_VERIFIED"
  | "ADMIN_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface Registration {
  id: number;
  event_id: number;
  team_id: number | null;
  user_id: number;
  status: RegistrationStatus;
  registration_period: "EARLY" | "LATE" | null;
  fee_amount: number | null;
  terms_acceptance_id: number | null;
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_by_user_id: number | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegistrationListItem extends Registration {
  team_name: string | null;
  event_name: string | null;
  applicant_name: string;
  applicant_email: string;
  participant_count: number;
  payment_status: PaymentStatus | null;
}

export interface Team {
  id: number;
  event_id: number;
  name: string;
  description: string | null;
  captain_user_id: number;
  institution: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

export type ParticipantRole = "CAPTAIN" | "MEMBER";

export interface TeamMember {
  id: number;
  team_id: number;
  user_id: number | null;
  role: ParticipantRole;
  name: string;
  email: string;
  phone: string | null;
  institution: string | null;
  created_at: string;
}

export type PaymentStatus = "NOT_REQUIRED" | "PENDING" | "SUBMITTED" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";

export interface Payment {
  id: number;
  registration_id: number;
  amount: number;
  method: string;
  reference: string | null;
  proof_url: string | null;
  status: PaymentStatus;
  submitted_at: string | null;
  reviewed_by_user_id: number | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegistrationFull {
  registration: Registration;
  event: {
    id: number;
    name: string;
    slug: string;
    payment_instructions: string | null;
    payment_qr_url: string | null;
    min_team_size: number;
    max_team_size: number;
  } & Record<string, unknown>;
  team: Team | null;
  members: TeamMember[];
  payment: Payment | null;
  termsAcceptance: { accepted_at: string; version: string } | null;
  statusHistory: { id: number; from_status: string | null; to_status: string; reason: string | null; created_at: string }[];
  applicant: { id: number; full_name: string; email: string; phone: string | null };
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  is_system: number;
  created_at: string;
  permissions: string[];
  userCount: number;
}

export interface AppNotification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

export interface AuditLogEntry {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: string | null;
  new_value: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_full_name: string | null;
  user_email: string | null;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
