import { db } from "../../db/connection.js";
import { Errors } from "../../shared/errors.js";
import { computeRegistrationWindow } from "../../shared/registrationPeriod.js";

export interface EventRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  rules: string | null;
  prize_pool: string | null;
  venue: string | null;
  event_start_date: string | null;
  event_end_date: string | null;
  registration_start_date: string;
  early_registration_end_date: string;
  late_registration_end_date: string;
  early_registration_fee: number;
  late_registration_fee: number;
  payment_instructions: string | null;
  payment_qr_url: string | null;
  min_team_size: number;
  max_team_size: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export function toPublicEvent(row: EventRow) {
  const window = computeRegistrationWindow(row);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    shortDescription: row.short_description,
    rules: row.rules,
    prizePool: row.prize_pool,
    venue: row.venue,
    eventStartDate: row.event_start_date,
    eventEndDate: row.event_end_date,
    registrationStartDate: row.registration_start_date,
    earlyRegistrationEndDate: row.early_registration_end_date,
    lateRegistrationEndDate: row.late_registration_end_date,
    earlyRegistrationFee: row.early_registration_fee,
    lateRegistrationFee: row.late_registration_fee,
    paymentInstructions: row.payment_instructions,
    paymentQr: row.payment_qr_url,
    minTeamSize: row.min_team_size,
    maxTeamSize: row.max_team_size,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    registrationState: window.state,
    currentPeriod: window.period,
    currentFee: window.fee,
  };
}

export function listEvents(): EventRow[] {
  return db.prepare(`SELECT * FROM events ORDER BY registration_start_date DESC`).all() as unknown as EventRow[];
}

export function getEventBySlug(slug: string): EventRow {
  const row = db.prepare(`SELECT * FROM events WHERE slug = ?`).get(slug) as EventRow | undefined;
  if (!row) throw Errors.notFound("Event not found.");
  return row;
}

export function getEventById(id: number): EventRow {
  const row = db.prepare(`SELECT * FROM events WHERE id = ?`).get(id) as EventRow | undefined;
  if (!row) throw Errors.notFound("Event not found.");
  return row;
}

interface EventInput {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  rules?: string;
  prizePool?: string;
  venue?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  registrationStartDate: string;
  earlyRegistrationEndDate: string;
  lateRegistrationEndDate: string;
  earlyRegistrationFee: number;
  lateRegistrationFee: number;
  paymentInstructions?: string;
  paymentQr?: string;
  minTeamSize: number;
  maxTeamSize: number;
}

export function createEvent(input: EventInput): EventRow {
  const existing = db.prepare(`SELECT id FROM events WHERE slug = ?`).get(input.slug);
  if (existing) throw Errors.conflict("An event with this slug already exists.");

  const result = db
    .prepare(
      `INSERT INTO events (
        name, slug, description, short_description, rules, prize_pool, venue,
        event_start_date, event_end_date, registration_start_date,
        early_registration_end_date, late_registration_end_date,
        early_registration_fee, late_registration_fee,
        payment_instructions, payment_qr_url, min_team_size, max_team_size, status
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'DRAFT')`
    )
    .run(
      input.name,
      input.slug,
      input.description ?? null,
      input.shortDescription ?? null,
      input.rules ?? null,
      input.prizePool ?? null,
      input.venue ?? null,
      input.eventStartDate ?? null,
      input.eventEndDate ?? null,
      input.registrationStartDate,
      input.earlyRegistrationEndDate,
      input.lateRegistrationEndDate,
      input.earlyRegistrationFee,
      input.lateRegistrationFee,
      input.paymentInstructions ?? null,
      input.paymentQr ?? null,
      input.minTeamSize,
      input.maxTeamSize
    );
  return getEventById(Number(result.lastInsertRowid));
}

const PATCH_FIELD_MAP: Record<string, string> = {
  name: "name",
  description: "description",
  shortDescription: "short_description",
  rules: "rules",
  prizePool: "prize_pool",
  venue: "venue",
  eventStartDate: "event_start_date",
  eventEndDate: "event_end_date",
  registrationStartDate: "registration_start_date",
  earlyRegistrationEndDate: "early_registration_end_date",
  lateRegistrationEndDate: "late_registration_end_date",
  earlyRegistrationFee: "early_registration_fee",
  lateRegistrationFee: "late_registration_fee",
  paymentInstructions: "payment_instructions",
  paymentQr: "payment_qr_url",
  minTeamSize: "min_team_size",
  maxTeamSize: "max_team_size",
  status: "status",
};

export function updateEvent(id: number, patch: Record<string, unknown>): EventRow {
  getEventById(id); // throws if missing
  const fields: string[] = [];
  const args: (string | number | null)[] = [];
  for (const [key, column] of Object.entries(PATCH_FIELD_MAP)) {
    if (patch[key] !== undefined) {
      fields.push(`${column} = ?`);
      args.push(patch[key] as string | number | null);
    }
  }
  if (fields.length === 0) return getEventById(id);
  fields.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
  args.push(id);
  db.prepare(`UPDATE events SET ${fields.join(", ")} WHERE id = ?`).run(...args);
  return getEventById(id);
}

export function deleteEvent(id: number): void {
  getEventById(id);
  const registrationCount = (
    db.prepare(`SELECT COUNT(*) as count FROM registrations WHERE event_id = ?`).get(id) as {
      count: number;
    }
  ).count;
  if (registrationCount > 0) {
    throw Errors.conflict("Cannot delete an event that already has registrations. Cancel it instead.");
  }
  db.prepare(`DELETE FROM events WHERE id = ?`).run(id);
}
