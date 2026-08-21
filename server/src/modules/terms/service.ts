import type { Request } from "express";
import { db } from "../../db/connection.js";
import { Errors } from "../../shared/errors.js";
import { markdownToSafeHtml } from "./sanitize.js";

export type TermsStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface TermsVersionRow {
  id: number;
  event_id: number;
  title: string;
  version: string;
  content: string;
  status: TermsStatus;
  effective_date: string | null;
  created_by: number | null;
  published_by: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TermsListItem extends TermsVersionRow {
  event_name: string | null;
  created_by_name: string | null;
  published_by_name: string | null;
  acceptance_count: number;
}

function toDetail(row: TermsListItem) {
  return { ...row, rendered_html: markdownToSafeHtml(row.content) };
}

const LIST_SELECT = `
  SELECT tv.*, e.name as event_name,
         cu.full_name as created_by_name, pu.full_name as published_by_name,
         (SELECT COUNT(*) FROM terms_acceptances WHERE terms_version_id = tv.id) as acceptance_count
  FROM terms_versions tv
  LEFT JOIN events e ON e.id = tv.event_id
  LEFT JOIN users cu ON cu.id = tv.created_by
  LEFT JOIN users pu ON pu.id = tv.published_by
`;

export function listTerms(filters: { eventId?: number; status?: TermsStatus; search?: string }): TermsListItem[] {
  const clauses: string[] = [];
  const args: (string | number)[] = [];
  if (filters.eventId) {
    clauses.push("tv.event_id = ?");
    args.push(filters.eventId);
  }
  if (filters.status) {
    clauses.push("tv.status = ?");
    args.push(filters.status);
  }
  if (filters.search) {
    clauses.push("(tv.title LIKE ? OR tv.version LIKE ?)");
    args.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db.prepare(`${LIST_SELECT} ${where} ORDER BY tv.event_id, tv.created_at DESC`).all(...args) as unknown as TermsListItem[];
}

export function getTermsById(id: number): TermsListItem {
  const row = db.prepare(`${LIST_SELECT} WHERE tv.id = ?`).get(id) as unknown as TermsListItem | undefined;
  if (!row) throw Errors.notFound("Terms & Conditions not found.");
  return row;
}

export function getTermsPreview(id: number) {
  return toDetail(getTermsById(id));
}

/**
 * The Terms a participant currently sees for an event: the single PUBLISHED
 * version whose effective date (if set) has arrived. A published version
 * with a future effective date is deliberately NOT returned — publishing
 * ahead of its effective date is allowed (so an admin can prepare it), but
 * it must not be shown or acceptable before that date.
 */
export function getActiveTermsForEvent(eventId: number): TermsVersionRow {
  const row = db
    .prepare(
      `SELECT * FROM terms_versions
       WHERE event_id = ? AND status = 'PUBLISHED'
         AND (effective_date IS NULL OR effective_date <= strftime('%Y-%m-%dT%H:%M:%fZ','now'))
       ORDER BY published_at DESC LIMIT 1`
    )
    .get(eventId) as unknown as TermsVersionRow | undefined;
  if (!row) throw Errors.notFound("No terms and conditions have been published for this event.");
  return row;
}

interface CreateTermsInput {
  eventId: number;
  title: string;
  version: string;
  content: string;
  effectiveDate?: string;
}

function insertTerms(input: CreateTermsInput, actorUserId: number, status: TermsStatus): number {
  const existing = db
    .prepare(`SELECT id FROM terms_versions WHERE event_id = ? AND version = ?`)
    .get(input.eventId, input.version);
  if (existing) throw Errors.conflict("This version already exists for the event.");

  const result = db
    .prepare(
      `INSERT INTO terms_versions (event_id, title, version, content, status, effective_date, created_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))`
    )
    .run(input.eventId, input.title, input.version, input.content, status, input.effectiveDate || null, actorUserId);
  return Number(result.lastInsertRowid);
}

/** Archives whatever is currently PUBLISHED for an event — at most one PUBLISHED version may exist per event. */
function archiveCurrentlyPublished(eventId: number): void {
  db.prepare(
    `UPDATE terms_versions SET status = 'ARCHIVED', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
     WHERE event_id = ? AND status = 'PUBLISHED'`
  ).run(eventId);
}

export function createTerms(input: CreateTermsInput, actorUserId: number, publishImmediately: boolean): TermsListItem {
  const id = insertTerms(input, actorUserId, "DRAFT");
  if (publishImmediately) {
    publishTerms(id, actorUserId);
  }
  return getTermsById(id);
}

export function updateTerms(id: number, patch: { title?: string; content?: string; effectiveDate?: string }): TermsListItem {
  const existing = getTermsById(id);
  if (existing.status !== "DRAFT") {
    throw Errors.conflict("Only draft terms can be edited — create a new version instead of modifying a published or archived one.");
  }
  const fields: string[] = [];
  const args: (string | number)[] = [];
  if (patch.title !== undefined) {
    fields.push("title = ?");
    args.push(patch.title);
  }
  if (patch.content !== undefined) {
    fields.push("content = ?");
    args.push(patch.content);
  }
  if (patch.effectiveDate !== undefined) {
    fields.push("effective_date = ?");
    args.push(patch.effectiveDate || "");
  }
  if (fields.length > 0) {
    fields.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
    args.push(id);
    db.prepare(`UPDATE terms_versions SET ${fields.join(", ")} WHERE id = ?`).run(...args);
  }
  return getTermsById(id);
}

export function publishTerms(id: number, actorUserId: number): TermsListItem {
  const existing = getTermsById(id);
  if (existing.status !== "DRAFT") {
    throw Errors.conflict("Only a draft can be published.");
  }
  archiveCurrentlyPublished(existing.event_id);
  db.prepare(
    `UPDATE terms_versions SET status = 'PUBLISHED', published_by = ?, published_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'),
     updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
  ).run(actorUserId, id);
  return getTermsById(id);
}

export function archiveTerms(id: number): TermsListItem {
  const existing = getTermsById(id);
  if (existing.status === "ARCHIVED") {
    throw Errors.conflict("This version is already archived.");
  }
  db.prepare(
    `UPDATE terms_versions SET status = 'ARCHIVED', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
  ).run(id);
  return getTermsById(id);
}

export function deleteTerms(id: number): void {
  const existing = getTermsById(id);
  if (existing.status !== "DRAFT") {
    throw Errors.conflict("Only draft terms can be deleted — published and archived versions are kept for historical acceptance records.");
  }
  db.prepare(`DELETE FROM terms_versions WHERE id = ?`).run(id);
}

export function listAcceptancesForTerms(termsId: number) {
  return db
    .prepare(
      `SELECT ta.id, ta.accepted_at, ta.ip_address, u.id as user_id, u.full_name, u.email, t.name as team_name
       FROM terms_acceptances ta
       JOIN users u ON u.id = ta.user_id
       LEFT JOIN teams t ON t.event_id = ta.event_id AND t.captain_user_id = ta.user_id
       WHERE ta.terms_version_id = ?
       ORDER BY ta.accepted_at DESC`
    )
    .all(termsId);
}

export function recordAcceptance(userId: number, eventId: number, termsVersionId: number, req?: Request): number {
  const existing = db
    .prepare(`SELECT id FROM terms_acceptances WHERE user_id = ? AND event_id = ? AND terms_version_id = ?`)
    .get(userId, eventId, termsVersionId) as { id: number } | undefined;
  if (existing) return existing.id;

  const result = db
    .prepare(
      `INSERT INTO terms_acceptances (user_id, event_id, terms_version_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)`
    )
    .run(userId, eventId, termsVersionId, req?.ip ?? null, req?.get("user-agent") ?? null);
  return Number(result.lastInsertRowid);
}

export function getAcceptance(
  userId: number,
  eventId: number
): (TermsVersionRow & { accepted_at: string; acceptance_id: number }) | undefined {
  return db
    .prepare(
      `SELECT tv.*, ta.accepted_at, ta.id as acceptance_id FROM terms_acceptances ta
       JOIN terms_versions tv ON tv.id = ta.terms_version_id
       WHERE ta.user_id = ? AND ta.event_id = ? ORDER BY ta.accepted_at DESC LIMIT 1`
    )
    .get(userId, eventId) as unknown as (TermsVersionRow & { accepted_at: string; acceptance_id: number }) | undefined;
}
