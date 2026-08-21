import type { Request } from "express";
import { db } from "../../db/connection.js";

export interface RecordAuditInput {
  userId: number | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  oldValue?: unknown;
  newValue?: unknown;
  req?: Request;
}

export function recordAudit(input: RecordAuditInput): void {
  db.prepare(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    input.userId,
    input.action,
    input.entityType,
    input.entityId != null ? String(input.entityId) : null,
    input.oldValue != null ? JSON.stringify(input.oldValue) : null,
    input.newValue != null ? JSON.stringify(input.newValue) : null,
    input.req?.ip ?? null,
    input.req?.get("user-agent") ?? null
  );
}

export function listAuditLogs(params: { page: number; pageSize: number; entityType?: string; action?: string }) {
  const filters: string[] = [];
  const args: (string | number)[] = [];
  if (params.entityType) {
    filters.push("entity_type = ?");
    args.push(params.entityType);
  }
  if (params.action) {
    filters.push("action = ?");
    args.push(params.action);
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const total = (
    db.prepare(`SELECT COUNT(*) as count FROM audit_logs ${where}`).get(...args) as { count: number }
  ).count;

  const rows = db
    .prepare(
      `SELECT al.*, u.full_name as user_full_name, u.email as user_email
       FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id
       ${where} ORDER BY al.created_at DESC LIMIT ? OFFSET ?`
    )
    .all(...args, params.pageSize, (params.page - 1) * params.pageSize);

  return { rows, total };
}
