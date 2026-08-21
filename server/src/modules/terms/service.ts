import { db } from "../../db/connection.js";
import { Errors } from "../../shared/errors.js";

export interface TermsVersionRow {
  id: number;
  event_id: number;
  version: string;
  content: string;
  is_active: number;
  created_at: string;
}

export function getActiveTermsForEvent(eventId: number): TermsVersionRow {
  const row = db
    .prepare(`SELECT * FROM terms_versions WHERE event_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1`)
    .get(eventId) as unknown as TermsVersionRow | undefined;
  if (!row) throw Errors.notFound("No terms and conditions have been published for this event.");
  return row;
}

export function createTermsVersion(eventId: number, version: string, content: string): TermsVersionRow {
  const existing = db
    .prepare(`SELECT id FROM terms_versions WHERE event_id = ? AND version = ?`)
    .get(eventId, version);
  if (existing) throw Errors.conflict("This terms version already exists for the event.");

  db.prepare(`UPDATE terms_versions SET is_active = 0 WHERE event_id = ?`).run(eventId);
  const result = db
    .prepare(`INSERT INTO terms_versions (event_id, version, content, is_active) VALUES (?, ?, ?, 1)`)
    .run(eventId, version, content);
  return db.prepare(`SELECT * FROM terms_versions WHERE id = ?`).get(result.lastInsertRowid) as unknown as TermsVersionRow;
}

export function listTermsVersions(eventId: number): TermsVersionRow[] {
  return db
    .prepare(`SELECT * FROM terms_versions WHERE event_id = ? ORDER BY id DESC`)
    .all(eventId) as unknown as TermsVersionRow[];
}

export function recordAcceptance(userId: number, eventId: number, termsVersionId: number): number {
  const existing = db
    .prepare(
      `SELECT id FROM terms_acceptances WHERE user_id = ? AND event_id = ? AND terms_version_id = ?`
    )
    .get(userId, eventId, termsVersionId) as { id: number } | undefined;
  if (existing) return existing.id;

  const result = db
    .prepare(
      `INSERT INTO terms_acceptances (user_id, event_id, terms_version_id) VALUES (?, ?, ?)`
    )
    .run(userId, eventId, termsVersionId);
  return Number(result.lastInsertRowid);
}

export function getAcceptance(userId: number, eventId: number): (TermsVersionRow & { accepted_at: string; acceptance_id: number }) | undefined {
  return db
    .prepare(
      `SELECT tv.*, ta.accepted_at, ta.id as acceptance_id FROM terms_acceptances ta
       JOIN terms_versions tv ON tv.id = ta.terms_version_id
       WHERE ta.user_id = ? AND ta.event_id = ? ORDER BY ta.accepted_at DESC LIMIT 1`
    )
    .get(userId, eventId) as unknown as (TermsVersionRow & { accepted_at: string; acceptance_id: number }) | undefined;
}
