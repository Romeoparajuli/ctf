import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "../../db/connection.js";
import { Errors } from "../../shared/errors.js";

export interface PublicUser {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
  roles: string[];
}

function attachRoles(users: Omit<PublicUser, "roles">[]): PublicUser[] {
  const roleRows = db
    .prepare(
      `SELECT ur.user_id, r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id`
    )
    .all() as { user_id: number; name: string }[];
  const rolesByUser = new Map<number, string[]>();
  for (const row of roleRows) {
    if (!rolesByUser.has(row.user_id)) rolesByUser.set(row.user_id, []);
    rolesByUser.get(row.user_id)!.push(row.name);
  }
  return users.map((u) => ({ ...u, roles: rolesByUser.get(u.id) ?? [] }));
}

export function listUsers(params: { page: number; pageSize: number; search?: string }) {
  const filters: string[] = [];
  const args: (string | number)[] = [];
  if (params.search) {
    filters.push("(full_name LIKE ? OR email LIKE ?)");
    args.push(`%${params.search}%`, `%${params.search}%`);
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const total = (
    db.prepare(`SELECT COUNT(*) as count FROM users ${where}`).get(...args) as { count: number }
  ).count;
  const rows = db
    .prepare(
      `SELECT id, full_name, email, phone, status, created_at FROM users ${where}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(...args, params.pageSize, (params.page - 1) * params.pageSize) as Omit<PublicUser, "roles">[];
  return { rows: attachRoles(rows), total };
}

export function getUserById(id: number): PublicUser {
  const row = db
    .prepare(`SELECT id, full_name, email, phone, status, created_at FROM users WHERE id = ?`)
    .get(id) as Omit<PublicUser, "roles"> | undefined;
  if (!row) throw Errors.notFound("User not found.");
  return attachRoles([row])[0];
}

export function updateUser(id: number, patch: { fullName?: string; phone?: string; status?: string }): void {
  const existing = db.prepare(`SELECT id FROM users WHERE id = ?`).get(id);
  if (!existing) throw Errors.notFound("User not found.");

  const fields: string[] = [];
  const args: (string | number)[] = [];
  if (patch.fullName !== undefined) {
    fields.push("full_name = ?");
    args.push(patch.fullName);
  }
  if (patch.phone !== undefined) {
    fields.push("phone = ?");
    args.push(patch.phone);
  }
  if (patch.status !== undefined) {
    fields.push("status = ?");
    args.push(patch.status);
  }
  if (fields.length === 0) return;
  fields.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
  args.push(id);
  db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...args);
}

export function assignRole(userId: number, roleId: number): void {
  const user = db.prepare(`SELECT id FROM users WHERE id = ?`).get(userId);
  if (!user) throw Errors.notFound("User not found.");
  const role = db.prepare(`SELECT id FROM roles WHERE id = ?`).get(roleId);
  if (!role) throw Errors.notFound("Role not found.");
  db.prepare(`INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`).run(userId, roleId);
}

export function removeRole(userId: number, roleId: number): void {
  db.prepare(`DELETE FROM user_roles WHERE user_id = ? AND role_id = ?`).run(userId, roleId);
}

export async function adminResetPassword(userId: number): Promise<string> {
  const user = db.prepare(`SELECT id FROM users WHERE id = ?`).get(userId);
  if (!user) throw Errors.notFound("User not found.");
  const tempPassword = crypto.randomBytes(9).toString("base64url");
  const hash = await bcrypt.hash(tempPassword, 12);
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`).run(
    hash,
    userId
  );
  return tempPassword;
}
