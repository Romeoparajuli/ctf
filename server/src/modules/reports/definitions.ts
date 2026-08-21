import { db } from "../../db/connection.js";
import type { ReportDefinition, ReportFilters, SummaryItem } from "./types.js";

interface WhereBuilder {
  clauses: string[];
  args: (string | number)[];
}

function newWhere(): WhereBuilder {
  return { clauses: [], args: [] };
}

function addClause(w: WhereBuilder, sql: string, ...args: (string | number)[]): void {
  w.clauses.push(sql);
  w.args.push(...args);
}

function sql(w: WhereBuilder): string {
  return w.clauses.length ? `WHERE ${w.clauses.join(" AND ")}` : "";
}

function count(rows: Record<string, unknown>[], predicate: (r: Record<string, unknown>) => boolean): number {
  return rows.filter(predicate).length;
}

function sum(rows: Record<string, unknown>[], key: string): number {
  return rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
}

// --- Registration Report ---

function fetchRegistrations(filters: ReportFilters): Record<string, unknown>[] {
  const w = newWhere();
  if (filters.eventId) addClause(w, "r.event_id = ?", filters.eventId);
  if (filters.status) addClause(w, "r.status = ?", filters.status);
  if (filters.dateFrom) addClause(w, "r.created_at >= ?", filters.dateFrom);
  if (filters.dateTo) addClause(w, "r.created_at <= ?", filters.dateTo);
  if (filters.search) {
    addClause(w, "(t.name LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)", `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }
  return db
    .prepare(
      `SELECT r.id, e.name as event, t.name as team, u.full_name as applicant, u.email,
              r.status, r.registration_period, r.fee_amount, r.created_at, r.submitted_at
       FROM registrations r
       LEFT JOIN events e ON e.id = r.event_id
       LEFT JOIN teams t ON t.id = r.team_id
       LEFT JOIN users u ON u.id = r.user_id
       ${sql(w)}
       ORDER BY r.created_at DESC`
    )
    .all(...w.args) as Record<string, unknown>[];
}

function summarizeRegistrations(rows: Record<string, unknown>[]): SummaryItem[] {
  return [
    { label: "Total Registrations", value: rows.length },
    { label: "Approved", value: count(rows, (r) => r.status === "APPROVED") },
    { label: "Rejected", value: count(rows, (r) => r.status === "REJECTED") },
    {
      label: "In Progress",
      value: count(rows, (r) => r.status !== "APPROVED" && r.status !== "REJECTED"),
    },
  ];
}

// --- Team Report ---

function fetchTeams(filters: ReportFilters): Record<string, unknown>[] {
  const w = newWhere();
  if (filters.eventId) addClause(w, "t.event_id = ?", filters.eventId);
  if (filters.search) addClause(w, "(t.name LIKE ? OR t.institution LIKE ?)", `%${filters.search}%`, `%${filters.search}%`);
  return db
    .prepare(
      `SELECT t.id, t.name, e.name as event, t.institution, u.full_name as captain,
              (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count, t.created_at
       FROM teams t LEFT JOIN events e ON e.id = t.event_id LEFT JOIN users u ON u.id = t.captain_user_id
       ${sql(w)}
       ORDER BY t.created_at DESC`
    )
    .all(...w.args) as Record<string, unknown>[];
}

// --- Participant Report ---

function fetchParticipants(filters: ReportFilters): Record<string, unknown>[] {
  const w = newWhere();
  if (filters.eventId) addClause(w, "t.event_id = ?", filters.eventId);
  if (filters.search) addClause(w, "(tm.name LIKE ? OR tm.email LIKE ?)", `%${filters.search}%`, `%${filters.search}%`);
  return db
    .prepare(
      `SELECT tm.id, tm.name, tm.email, tm.phone, tm.institution, tm.role, t.name as team, e.name as event
       FROM team_members tm JOIN teams t ON t.id = tm.team_id LEFT JOIN events e ON e.id = t.event_id
       ${sql(w)}
       ORDER BY tm.id DESC`
    )
    .all(...w.args) as Record<string, unknown>[];
}

// --- Payment Report ---

function fetchPayments(filters: ReportFilters): Record<string, unknown>[] {
  const w = newWhere();
  if (filters.eventId) addClause(w, "r.event_id = ?", filters.eventId);
  if (filters.status) addClause(w, "p.status = ?", filters.status);
  if (filters.dateFrom) addClause(w, "p.updated_at >= ?", filters.dateFrom);
  if (filters.dateTo) addClause(w, "p.updated_at <= ?", filters.dateTo);
  if (filters.search) addClause(w, "(t.name LIKE ? OR p.reference LIKE ?)", `%${filters.search}%`, `%${filters.search}%`);
  return db
    .prepare(
      `SELECT p.id, t.name as team, e.name as event, p.amount, p.method, p.reference, p.status,
              p.submitted_at, p.reviewed_at
       FROM payments p JOIN registrations r ON r.id = p.registration_id
       LEFT JOIN teams t ON t.id = r.team_id LEFT JOIN events e ON e.id = r.event_id
       ${sql(w)}
       ORDER BY p.updated_at DESC`
    )
    .all(...w.args) as Record<string, unknown>[];
}

function summarizePayments(rows: Record<string, unknown>[]): SummaryItem[] {
  return [
    { label: "Total Payments", value: rows.length },
    { label: "Verified", value: count(rows, (r) => r.status === "VERIFIED") },
    { label: "Pending / Submitted", value: count(rows, (r) => r.status === "SUBMITTED" || r.status === "UNDER_REVIEW") },
    { label: "Rejected", value: count(rows, (r) => r.status === "REJECTED") },
    { label: "Verified Revenue (NPR)", value: sum(rows.filter((r) => r.status === "VERIFIED"), "amount") },
  ];
}

// --- Revenue Report ---

function fetchRevenue(filters: ReportFilters): Record<string, unknown>[] {
  const w = newWhere();
  addClause(w, "p.status = 'VERIFIED'");
  if (filters.eventId) addClause(w, "r.event_id = ?", filters.eventId);
  return db
    .prepare(
      `SELECT e.name as event, r.registration_period as period, COUNT(*) as verified_payments,
              COALESCE(SUM(p.amount),0) as revenue
       FROM payments p JOIN registrations r ON r.id = p.registration_id LEFT JOIN events e ON e.id = r.event_id
       ${sql(w)}
       GROUP BY e.id, r.registration_period`
    )
    .all(...w.args) as Record<string, unknown>[];
}

function summarizeRevenue(rows: Record<string, unknown>[]): SummaryItem[] {
  return [{ label: "Total Verified Revenue (NPR)", value: sum(rows, "revenue") }];
}

// --- Approval Report ---

function fetchApprovals(filters: ReportFilters): Record<string, unknown>[] {
  const w = newWhere();
  addClause(w, "r.status IN ('APPROVED','REJECTED')");
  if (filters.eventId) addClause(w, "r.event_id = ?", filters.eventId);
  if (filters.status) addClause(w, "r.status = ?", filters.status);
  if (filters.dateFrom) addClause(w, "r.reviewed_at >= ?", filters.dateFrom);
  if (filters.dateTo) addClause(w, "r.reviewed_at <= ?", filters.dateTo);
  return db
    .prepare(
      `SELECT r.id, t.name as team, e.name as event, r.status, r.reviewed_at, ru.full_name as reviewed_by,
              r.rejection_reason
       FROM registrations r LEFT JOIN teams t ON t.id = r.team_id LEFT JOIN events e ON e.id = r.event_id
       LEFT JOIN users ru ON ru.id = r.reviewed_by_user_id
       ${sql(w)}
       ORDER BY r.reviewed_at DESC`
    )
    .all(...w.args) as Record<string, unknown>[];
}

function summarizeApprovals(rows: Record<string, unknown>[]): SummaryItem[] {
  return [
    { label: "Approved", value: count(rows, (r) => r.status === "APPROVED") },
    { label: "Rejected", value: count(rows, (r) => r.status === "REJECTED") },
  ];
}

// --- User Report ---

function fetchUsers(filters: ReportFilters): Record<string, unknown>[] {
  const w = newWhere();
  if (filters.status) addClause(w, "status = ?", filters.status);
  if (filters.dateFrom) addClause(w, "created_at >= ?", filters.dateFrom);
  if (filters.dateTo) addClause(w, "created_at <= ?", filters.dateTo);
  if (filters.search) addClause(w, "(full_name LIKE ? OR email LIKE ?)", `%${filters.search}%`, `%${filters.search}%`);
  return db
    .prepare(`SELECT id, full_name, email, phone, status, created_at FROM users ${sql(w)} ORDER BY created_at DESC`)
    .all(...w.args) as Record<string, unknown>[];
}

function summarizeUsers(rows: Record<string, unknown>[]): SummaryItem[] {
  return [
    { label: "Total Users", value: rows.length },
    { label: "Active", value: count(rows, (r) => r.status === "ACTIVE") },
  ];
}

export const REPORT_DEFINITIONS: Record<string, ReportDefinition> = {
  registrations: {
    id: "registrations",
    title: "Registration Report",
    supportedFilters: ["eventId", "status", "dateFrom", "dateTo", "search"],
    columns: [
      { key: "id", header: "S.N.", type: "number", width: 8 },
      { key: "event", header: "Event", type: "string", width: 22 },
      { key: "team", header: "Team", type: "string", width: 22 },
      { key: "applicant", header: "Applicant", type: "string", width: 22 },
      { key: "email", header: "Email", type: "string", width: 26 },
      { key: "status", header: "Status", type: "string", width: 16 },
      { key: "registration_period", header: "Period", type: "string", width: 10 },
      { key: "fee_amount", header: "Fee", type: "currency", width: 12 },
      { key: "created_at", header: "Registered At", type: "date", width: 20 },
    ],
    fetchRows: fetchRegistrations,
    computeSummary: summarizeRegistrations,
  },
  teams: {
    id: "teams",
    title: "Team Report",
    supportedFilters: ["eventId", "search"],
    columns: [
      { key: "id", header: "S.N.", type: "number", width: 8 },
      { key: "name", header: "Team", type: "string", width: 22 },
      { key: "event", header: "Event", type: "string", width: 22 },
      { key: "institution", header: "Institution", type: "string", width: 24 },
      { key: "captain", header: "Captain", type: "string", width: 22 },
      { key: "member_count", header: "Members", type: "number", width: 10 },
      { key: "created_at", header: "Created At", type: "date", width: 20 },
    ],
    fetchRows: fetchTeams,
    computeSummary: (rows) => [{ label: "Total Teams", value: rows.length }],
  },
  participants: {
    id: "participants",
    title: "Participant Report",
    supportedFilters: ["eventId", "search"],
    columns: [
      { key: "id", header: "S.N.", type: "number", width: 8 },
      { key: "name", header: "Name", type: "string", width: 22 },
      { key: "email", header: "Email", type: "string", width: 26 },
      { key: "phone", header: "Phone", type: "string", width: 16 },
      { key: "institution", header: "Institution", type: "string", width: 24 },
      { key: "role", header: "Role", type: "string", width: 12 },
      { key: "team", header: "Team", type: "string", width: 22 },
      { key: "event", header: "Event", type: "string", width: 22 },
    ],
    fetchRows: fetchParticipants,
    computeSummary: (rows) => [{ label: "Total Participants", value: rows.length }],
  },
  payments: {
    id: "payments",
    title: "Payment Report",
    supportedFilters: ["eventId", "status", "dateFrom", "dateTo", "search"],
    columns: [
      { key: "id", header: "S.N.", type: "number", width: 8 },
      { key: "team", header: "Team", type: "string", width: 22 },
      { key: "event", header: "Event", type: "string", width: 22 },
      { key: "amount", header: "Amount", type: "currency", width: 12 },
      { key: "method", header: "Method", type: "string", width: 14 },
      { key: "reference", header: "Reference", type: "string", width: 20 },
      { key: "status", header: "Status", type: "string", width: 16 },
      { key: "submitted_at", header: "Submitted At", type: "date", width: 20 },
      { key: "reviewed_at", header: "Reviewed At", type: "date", width: 20 },
    ],
    fetchRows: fetchPayments,
    computeSummary: summarizePayments,
  },
  revenue: {
    id: "revenue",
    title: "Revenue Report",
    supportedFilters: ["eventId"],
    columns: [
      { key: "event", header: "Event", type: "string", width: 22 },
      { key: "period", header: "Period", type: "string", width: 12 },
      { key: "verified_payments", header: "Verified Payments", type: "number", width: 18 },
      { key: "revenue", header: "Revenue", type: "currency", width: 14 },
    ],
    fetchRows: fetchRevenue,
    computeSummary: summarizeRevenue,
  },
  approvals: {
    id: "approvals",
    title: "Approval Report",
    supportedFilters: ["eventId", "status", "dateFrom", "dateTo"],
    columns: [
      { key: "id", header: "S.N.", type: "number", width: 8 },
      { key: "team", header: "Team", type: "string", width: 22 },
      { key: "event", header: "Event", type: "string", width: 22 },
      { key: "status", header: "Status", type: "string", width: 14 },
      { key: "reviewed_at", header: "Reviewed At", type: "date", width: 20 },
      { key: "reviewed_by", header: "Reviewed By", type: "string", width: 22 },
      { key: "rejection_reason", header: "Rejection Reason", type: "string", width: 30 },
    ],
    fetchRows: fetchApprovals,
    computeSummary: summarizeApprovals,
  },
  users: {
    id: "users",
    title: "User Report",
    supportedFilters: ["status", "dateFrom", "dateTo", "search"],
    columns: [
      { key: "id", header: "S.N.", type: "number", width: 8 },
      { key: "full_name", header: "Full Name", type: "string", width: 24 },
      { key: "email", header: "Email", type: "string", width: 26 },
      { key: "phone", header: "Phone", type: "string", width: 16 },
      { key: "status", header: "Status", type: "string", width: 16 },
      { key: "created_at", header: "Created At", type: "date", width: 20 },
    ],
    fetchRows: fetchUsers,
    computeSummary: summarizeUsers,
  },
};
