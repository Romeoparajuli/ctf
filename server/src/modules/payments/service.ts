import type { Request } from "express";
import { db } from "../../db/connection.js";
import { Errors } from "../../shared/errors.js";
import { getRegistrationById } from "../registrations/service.js";
import { notify } from "../notifications/service.js";
import { recordAudit } from "../audit/service.js";

export interface PaymentRow {
  id: number;
  registration_id: number;
  amount: number;
  method: string;
  reference: string | null;
  proof_url: string | null;
  status: string;
  submitted_at: string | null;
  reviewed_by_user_id: number | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

function transitionPayment(paymentId: number, toStatus: string, userId: number | null, reason?: string): void {
  const current = db.prepare(`SELECT status FROM payments WHERE id = ?`).get(paymentId) as
    | { status: string }
    | undefined;
  db.prepare(
    `UPDATE payments SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
  ).run(toStatus, paymentId);
  db.prepare(
    `INSERT INTO payment_status_history (payment_id, from_status, to_status, changed_by_user_id, reason)
     VALUES (?, ?, ?, ?, ?)`
  ).run(paymentId, current?.status ?? null, toStatus, userId, reason ?? null);
}

export function getPaymentByRegistration(registrationId: number): PaymentRow {
  const row = db.prepare(`SELECT * FROM payments WHERE registration_id = ?`).get(registrationId) as
    | PaymentRow
    | undefined;
  if (!row) throw Errors.notFound("No payment record exists for this registration.");
  return row;
}

export function getPaymentById(id: number): PaymentRow {
  const row = db.prepare(`SELECT * FROM payments WHERE id = ?`).get(id) as PaymentRow | undefined;
  if (!row) throw Errors.notFound("Payment not found.");
  return row;
}

export function submitPayment(
  registrationId: number,
  userId: number,
  input: { reference: string; proofUrl?: string }
): PaymentRow {
  const registration = getRegistrationById(registrationId);
  if (registration.user_id !== userId) throw Errors.forbidden("You do not own this registration.");
  if (registration.status !== "PAYMENT_PENDING") {
    throw Errors.conflict("This registration is not currently awaiting payment.");
  }
  const payment = getPaymentByRegistration(registrationId);
  if (["SUBMITTED", "UNDER_REVIEW", "VERIFIED"].includes(payment.status)) {
    throw Errors.paymentAlreadySubmitted();
  }

  const duplicateReference = db
    .prepare(
      `SELECT id FROM payments WHERE reference = ? AND id != ? AND status IN ('SUBMITTED','UNDER_REVIEW','VERIFIED')`
    )
    .get(input.reference, payment.id);
  if (duplicateReference) {
    throw Errors.validation("This payment reference has already been used.", {
      reference: "This reference has already been submitted.",
    });
  }

  db.prepare(
    `UPDATE payments SET reference = ?, proof_url = ?, submitted_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'),
     rejection_reason = NULL, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
  ).run(input.reference, input.proofUrl ?? null, payment.id);
  transitionPayment(payment.id, "SUBMITTED", userId);

  db.prepare(
    `UPDATE registrations SET status = 'PAYMENT_SUBMITTED', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
  ).run(registrationId);
  db.prepare(
    `INSERT INTO registration_status_history (registration_id, from_status, to_status, changed_by_user_id)
     VALUES (?, 'PAYMENT_PENDING', 'PAYMENT_SUBMITTED', ?)`
  ).run(registrationId, userId);

  return getPaymentByRegistration(registrationId);
}

export function verifyPayment(paymentId: number, reviewerId: number, req?: Request): PaymentRow {
  const payment = getPaymentById(paymentId);
  if (payment.status === "VERIFIED") {
    throw Errors.conflict("This payment has already been verified.");
  }
  if (!["SUBMITTED", "UNDER_REVIEW"].includes(payment.status)) {
    throw Errors.conflict("Only submitted payments can be verified.");
  }
  transitionPayment(paymentId, "VERIFIED", reviewerId);
  db.prepare(
    `UPDATE payments SET reviewed_by_user_id = ?, reviewed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
  ).run(reviewerId, paymentId);

  const registration = getRegistrationById(payment.registration_id);
  db.prepare(
    `UPDATE registrations SET status = 'PAYMENT_VERIFIED', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
  ).run(registration.id);
  db.prepare(
    `INSERT INTO registration_status_history (registration_id, from_status, to_status, changed_by_user_id, reason)
     VALUES (?, ?, 'PAYMENT_VERIFIED', ?, 'Payment verified')`
  ).run(registration.id, registration.status, reviewerId);
  db.prepare(
    `UPDATE registrations SET status = 'ADMIN_REVIEW', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
  ).run(registration.id);
  db.prepare(
    `INSERT INTO registration_status_history (registration_id, from_status, to_status, changed_by_user_id, reason)
     VALUES (?, 'PAYMENT_VERIFIED', 'ADMIN_REVIEW', ?, 'Queued for administrative review')`
  ).run(registration.id, reviewerId);

  notify(registration.user_id, "PAYMENT_VERIFIED", "Payment verified", "Your payment has been verified and your registration is now under administrative review.");
  recordAudit({ userId: reviewerId, action: "PAYMENT_VERIFIED", entityType: "payment", entityId: paymentId, req });
  return getPaymentById(paymentId);
}

export function rejectPayment(paymentId: number, reviewerId: number, reason: string, req?: Request): PaymentRow {
  const payment = getPaymentById(paymentId);
  if (payment.status === "VERIFIED") {
    throw Errors.conflict("A verified payment cannot be rejected.");
  }
  if (!["SUBMITTED", "UNDER_REVIEW"].includes(payment.status)) {
    throw Errors.conflict("Only submitted payments can be rejected.");
  }
  transitionPayment(paymentId, "REJECTED", reviewerId, reason);
  db.prepare(
    `UPDATE payments SET reviewed_by_user_id = ?, reviewed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'), rejection_reason = ? WHERE id = ?`
  ).run(reviewerId, reason, paymentId);

  const registration = getRegistrationById(payment.registration_id);
  db.prepare(
    `UPDATE registrations SET status = 'PAYMENT_PENDING', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
  ).run(registration.id);
  db.prepare(
    `INSERT INTO registration_status_history (registration_id, from_status, to_status, changed_by_user_id, reason)
     VALUES (?, ?, 'PAYMENT_PENDING', ?, ?)`
  ).run(registration.id, registration.status, reviewerId, reason);

  notify(registration.user_id, "PAYMENT_REJECTED", "Payment rejected", `Your payment was rejected: ${reason}. Please submit a valid payment.`);
  recordAudit({ userId: reviewerId, action: "PAYMENT_REJECTED", entityType: "payment", entityId: paymentId, newValue: { reason }, req });
  return getPaymentById(paymentId);
}

export function listPayments(params: { page: number; pageSize: number; status?: string }) {
  const filters: string[] = [];
  const args: (string | number)[] = [];
  if (params.status) {
    filters.push("p.status = ?");
    args.push(params.status);
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const total = (
    db.prepare(`SELECT COUNT(*) as count FROM payments p ${where}`).get(...args) as { count: number }
  ).count;
  const rows = db
    .prepare(
      `SELECT p.*, t.name as team_name, e.name as event_name, u.full_name as applicant_name
       FROM payments p
       JOIN registrations r ON r.id = p.registration_id
       LEFT JOIN teams t ON t.id = r.team_id
       LEFT JOIN events e ON e.id = r.event_id
       LEFT JOIN users u ON u.id = r.user_id
       ${where} ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`
    )
    .all(...args, params.pageSize, (params.page - 1) * params.pageSize);
  return { rows, total };
}
