import { db } from "../../db/connection.js";
import { Errors } from "../../shared/errors.js";
import { computeRegistrationWindow } from "../../shared/registrationPeriod.js";
import { getEventById, type EventRow } from "../events/service.js";
import { getAcceptance, getActiveTermsForEvent } from "../terms/service.js";
import { notify } from "../notifications/service.js";
import { recordAudit } from "../audit/service.js";
import type { Request } from "express";

export interface RegistrationRow {
  id: number;
  event_id: number;
  team_id: number | null;
  user_id: number;
  status: string;
  registration_period: string | null;
  fee_amount: number | null;
  terms_acceptance_id: number | null;
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_by_user_id: number | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

const ACTIVE_STATUSES = [
  "DRAFT", "TERMS_ACCEPTED", "TEAM_CREATED", "PARTICIPANTS_ADDED",
  "PAYMENT_PENDING", "PAYMENT_SUBMITTED", "PAYMENT_VERIFIED", "ADMIN_REVIEW", "APPROVED",
];

function transition(registrationId: number, toStatus: string, userId: number | null, reason?: string): void {
  const current = db
    .prepare(`SELECT status FROM registrations WHERE id = ?`)
    .get(registrationId) as { status: string } | undefined;
  db.prepare(
    `UPDATE registrations SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
  ).run(toStatus, registrationId);
  db.prepare(
    `INSERT INTO registration_status_history (registration_id, from_status, to_status, changed_by_user_id, reason)
     VALUES (?, ?, ?, ?, ?)`
  ).run(registrationId, current?.status ?? null, toStatus, userId, reason ?? null);
}

function requireEventOpenForRegistration(event: EventRow): void {
  const window = computeRegistrationWindow(event);
  if (window.state !== "EARLY" && window.state !== "LATE") {
    throw Errors.registrationClosed(
      window.state === "NOT_STARTED"
        ? "Registration has not started for this event yet."
        : "Registration for this event is closed."
    );
  }
}

export function getRegistrationById(id: number): RegistrationRow {
  const row = db.prepare(`SELECT * FROM registrations WHERE id = ?`).get(id) as RegistrationRow | undefined;
  if (!row) throw Errors.notFound("Registration not found.");
  return row;
}

export function getMyRegistrationForEvent(userId: number, eventId: number): RegistrationRow | undefined {
  return db
    .prepare(`SELECT * FROM registrations WHERE user_id = ? AND event_id = ? ORDER BY id DESC LIMIT 1`)
    .get(userId, eventId) as RegistrationRow | undefined;
}

function assertOwner(registration: RegistrationRow, userId: number): void {
  if (registration.user_id !== userId) throw Errors.forbidden("You do not own this registration.");
}

export function startRegistration(userId: number, eventId: number): RegistrationRow {
  const event = getEventById(eventId);
  requireEventOpenForRegistration(event);

  const existing = db
    .prepare(
      `SELECT * FROM registrations WHERE user_id = ? AND event_id = ? AND status IN (${ACTIVE_STATUSES.map(() => "?").join(",")})`
    )
    .get(userId, eventId, ...ACTIVE_STATUSES) as RegistrationRow | undefined;
  if (existing) throw Errors.duplicateRegistration("You already have an active registration for this event.");

  const result = db
    .prepare(`INSERT INTO registrations (event_id, team_id, user_id, status) VALUES (?, NULL, ?, 'DRAFT')`)
    .run(eventId, userId);
  const id = Number(result.lastInsertRowid);
  transition(id, "DRAFT", userId);
  return getRegistrationById(id);
}

export function acceptTermsForRegistration(registrationId: number, userId: number): RegistrationRow {
  const registration = getRegistrationById(registrationId);
  assertOwner(registration, userId);
  if (registration.status !== "DRAFT") {
    return registration;
  }
  const acceptance = getAcceptance(userId, registration.event_id);
  const activeTerms = getActiveTermsForEvent(registration.event_id);
  // `acceptance.id` here is the terms_versions.id the user accepted (via the
  // `tv.*` join in getAcceptance), not the acceptance record's own id.
  if (!acceptance || acceptance.id !== activeTerms.id) {
    throw Errors.termsNotAccepted(
      acceptance
        ? "The terms and conditions have been updated. Please review and accept the current version."
        : "Accept the terms and conditions before continuing."
    );
  }
  db.prepare(`UPDATE registrations SET terms_acceptance_id = ? WHERE id = ?`).run(
    acceptance.acceptance_id,
    registrationId
  );
  transition(registrationId, "TERMS_ACCEPTED", userId);
  return getRegistrationById(registrationId);
}

interface TeamInput {
  teamName: string;
  description?: string;
  institution?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export function createTeamForRegistration(registrationId: number, userId: number, input: TeamInput): RegistrationRow {
  const registration = getRegistrationById(registrationId);
  assertOwner(registration, userId);
  if (registration.status !== "TERMS_ACCEPTED") {
    throw Errors.conflict("Terms must be accepted before creating a team.");
  }
  const event = getEventById(registration.event_id);
  requireEventOpenForRegistration(event);

  const existingName = db
    .prepare(`SELECT id FROM teams WHERE event_id = ? AND name = ?`)
    .get(event.id, input.teamName);
  if (existingName) {
    throw Errors.validation("This team name is already taken for this event.", {
      teamName: "This team name is already taken.",
    });
  }

  const user = db.prepare(`SELECT full_name, email, phone FROM users WHERE id = ?`).get(userId) as {
    full_name: string;
    email: string;
    phone: string | null;
  };

  const teamResult = db
    .prepare(
      `INSERT INTO teams (event_id, name, description, captain_user_id, institution, contact_email, contact_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      event.id,
      input.teamName,
      input.description ?? null,
      userId,
      input.institution ?? null,
      input.contactEmail ?? user.email,
      input.contactPhone ?? user.phone ?? null
    );
  const teamId = Number(teamResult.lastInsertRowid);

  db.prepare(
    `INSERT INTO team_members (team_id, user_id, role, name, email, phone, institution)
     VALUES (?, ?, 'CAPTAIN', ?, ?, ?, ?)`
  ).run(teamId, userId, user.full_name, user.email, user.phone, input.institution ?? null);

  db.prepare(`UPDATE registrations SET team_id = ? WHERE id = ?`).run(teamId, registrationId);
  // The captain counts toward the minimum team size, so a min size of 1 is already
  // satisfied at this point — skip straight to PARTICIPANTS_ADDED in that case.
  transition(registrationId, event.min_team_size <= 1 ? "PARTICIPANTS_ADDED" : "TEAM_CREATED", userId);
  return getRegistrationById(registrationId);
}

interface ParticipantInput {
  name: string;
  email: string;
  phone?: string;
  institution?: string;
  role: "CAPTAIN" | "MEMBER";
}

export function addParticipant(registrationId: number, userId: number, input: ParticipantInput): RegistrationRow {
  const registration = getRegistrationById(registrationId);
  assertOwner(registration, userId);
  if (!registration.team_id || !["TEAM_CREATED", "PARTICIPANTS_ADDED"].includes(registration.status)) {
    throw Errors.conflict("A team must be created before adding participants.");
  }
  const event = getEventById(registration.event_id);
  requireEventOpenForRegistration(event);

  const currentCount = (
    db.prepare(`SELECT COUNT(*) as count FROM team_members WHERE team_id = ?`).get(registration.team_id) as {
      count: number;
    }
  ).count;
  if (currentCount >= event.max_team_size) {
    throw Errors.teamLimitExceeded(`This event allows a maximum of ${event.max_team_size} participants per team.`);
  }

  const dupInTeam = db
    .prepare(`SELECT id FROM team_members WHERE team_id = ? AND email = ?`)
    .get(registration.team_id, input.email);
  if (dupInTeam) {
    throw Errors.validation("This participant is already part of the team.", {
      email: "Already added to this team.",
    });
  }

  const dupInEvent = db
    .prepare(
      `SELECT tm.id FROM team_members tm JOIN teams t ON t.id = tm.team_id
       WHERE t.event_id = ? AND tm.email = ? AND tm.team_id != ?`
    )
    .get(event.id, input.email, registration.team_id);
  if (dupInEvent) {
    throw Errors.validation("This person is already registered on another team for this event.", {
      email: "Already registered on another team.",
    });
  }

  db.prepare(
    `INSERT INTO team_members (team_id, role, name, email, phone, institution) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(registration.team_id, input.role, input.name, input.email, input.phone ?? null, input.institution ?? null);

  const newCount = currentCount + 1;
  if (newCount >= event.min_team_size && registration.status !== "PARTICIPANTS_ADDED") {
    transition(registrationId, "PARTICIPANTS_ADDED", userId);
  }
  return getRegistrationById(registrationId);
}

export function removeParticipant(registrationId: number, userId: number, memberId: number): RegistrationRow {
  const registration = getRegistrationById(registrationId);
  assertOwner(registration, userId);
  if (!["TEAM_CREATED", "PARTICIPANTS_ADDED"].includes(registration.status)) {
    throw Errors.conflict("Participants can only be modified while the registration is in draft.");
  }
  const member = db
    .prepare(`SELECT * FROM team_members WHERE id = ? AND team_id = ?`)
    .get(memberId, registration.team_id) as { role: string } | undefined;
  if (!member) throw Errors.notFound("Participant not found.");
  if (member.role === "CAPTAIN") throw Errors.conflict("The team captain cannot be removed.");
  db.prepare(`DELETE FROM team_members WHERE id = ?`).run(memberId);

  const event = getEventById(registration.event_id);
  const remaining = (
    db.prepare(`SELECT COUNT(*) as count FROM team_members WHERE team_id = ?`).get(registration.team_id) as {
      count: number;
    }
  ).count;
  if (remaining < event.min_team_size && registration.status === "PARTICIPANTS_ADDED") {
    transition(registrationId, "TEAM_CREATED", userId);
  }
  return getRegistrationById(registrationId);
}

export function proceedToPayment(registrationId: number, userId: number): RegistrationRow {
  const registration = getRegistrationById(registrationId);
  assertOwner(registration, userId);
  if (registration.status !== "PARTICIPANTS_ADDED") {
    throw Errors.conflict("Add the minimum number of participants before proceeding to payment.");
  }
  const event = getEventById(registration.event_id);
  const window = computeRegistrationWindow(event);
  requireEventOpenForRegistration(event);

  db.prepare(`UPDATE registrations SET registration_period = ?, fee_amount = ? WHERE id = ?`).run(
    window.period,
    window.fee,
    registrationId
  );

  const existingPayment = db.prepare(`SELECT id FROM payments WHERE registration_id = ?`).get(registrationId);
  if (!existingPayment) {
    db.prepare(
      `INSERT INTO payments (registration_id, amount, method, status) VALUES (?, ?, 'PHONEPE_QR', 'PENDING')`
    ).run(registrationId, window.fee);
  }

  transition(registrationId, "PAYMENT_PENDING", userId);
  return getRegistrationById(registrationId);
}

export function moveToAdminReview(registrationId: number): void {
  transition(registrationId, "ADMIN_REVIEW", null, "Payment verified; queued for administrative review.");
}

export function approveRegistration(registrationId: number, adminUserId: number, req?: Request): RegistrationRow {
  const registration = getRegistrationById(registrationId);
  if (registration.status === "APPROVED") {
    throw Errors.registrationAlreadyApproved();
  }
  if (registration.status !== "ADMIN_REVIEW") {
    throw Errors.conflict("Only registrations in admin review can be approved.");
  }
  db.prepare(
    `UPDATE registrations SET reviewed_by_user_id = ?, reviewed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
  ).run(adminUserId, registrationId);
  transition(registrationId, "APPROVED", adminUserId);
  notify(registration.user_id, "REGISTRATION_APPROVED", "Registration approved", "Your team registration has been approved. Welcome to Nepal CTF!");
  recordAudit({ userId: adminUserId, action: "REGISTRATION_APPROVED", entityType: "registration", entityId: registrationId, req });
  return getRegistrationById(registrationId);
}

export function rejectRegistration(registrationId: number, adminUserId: number, reason: string, req?: Request): RegistrationRow {
  const registration = getRegistrationById(registrationId);
  if (registration.status === "APPROVED") {
    throw Errors.conflict("Approved registrations cannot be rejected. Cancel it instead if needed.");
  }
  if (registration.status !== "ADMIN_REVIEW") {
    throw Errors.conflict("Only registrations in admin review can be rejected.");
  }
  db.prepare(
    `UPDATE registrations SET reviewed_by_user_id = ?, reviewed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'), rejection_reason = ? WHERE id = ?`
  ).run(adminUserId, reason, registrationId);
  transition(registrationId, "REJECTED", adminUserId, reason);
  notify(registration.user_id, "REGISTRATION_REJECTED", "Registration rejected", `Your registration was rejected: ${reason}`);
  recordAudit({ userId: adminUserId, action: "REGISTRATION_REJECTED", entityType: "registration", entityId: registrationId, newValue: { reason }, req });
  return getRegistrationById(registrationId);
}

export function getRegistrationFull(id: number) {
  const registration = getRegistrationById(id);
  const event = getEventById(registration.event_id);
  const team = registration.team_id
    ? (db.prepare(`SELECT * FROM teams WHERE id = ?`).get(registration.team_id) as Record<string, unknown>)
    : null;
  const members = registration.team_id
    ? db.prepare(`SELECT * FROM team_members WHERE team_id = ? ORDER BY role DESC, id ASC`).all(registration.team_id)
    : [];
  const payment = db.prepare(`SELECT * FROM payments WHERE registration_id = ?`).get(id) ?? null;
  const termsAcceptance = registration.terms_acceptance_id
    ? db
        .prepare(
          `SELECT ta.accepted_at, tv.version FROM terms_acceptances ta JOIN terms_versions tv ON tv.id = ta.terms_version_id WHERE ta.id = ?`
        )
        .get(registration.terms_acceptance_id)
    : null;
  const statusHistory = db
    .prepare(`SELECT * FROM registration_status_history WHERE registration_id = ? ORDER BY created_at ASC`)
    .all(id);
  const applicant = db
    .prepare(`SELECT id, full_name, email, phone FROM users WHERE id = ?`)
    .get(registration.user_id);

  return { registration, event, team, members, payment, termsAcceptance, statusHistory, applicant };
}

export function listRegistrations(params: { page: number; pageSize: number; status?: string; eventId?: number }) {
  const filters: string[] = [];
  const args: (string | number)[] = [];
  if (params.status) {
    filters.push("r.status = ?");
    args.push(params.status);
  }
  if (params.eventId) {
    filters.push("r.event_id = ?");
    args.push(params.eventId);
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const total = (
    db.prepare(`SELECT COUNT(*) as count FROM registrations r ${where}`).get(...args) as { count: number }
  ).count;
  const rows = db
    .prepare(
      `SELECT r.*, t.name as team_name, e.name as event_name, u.full_name as applicant_name, u.email as applicant_email,
              (SELECT COUNT(*) FROM team_members WHERE team_id = r.team_id) as participant_count,
              p.status as payment_status
       FROM registrations r
       LEFT JOIN teams t ON t.id = r.team_id
       LEFT JOIN events e ON e.id = r.event_id
       LEFT JOIN users u ON u.id = r.user_id
       LEFT JOIN payments p ON p.registration_id = r.id
       ${where}
       ORDER BY r.created_at DESC LIMIT ? OFFSET ?`
    )
    .all(...args, params.pageSize, (params.page - 1) * params.pageSize);
  return { rows, total };
}
