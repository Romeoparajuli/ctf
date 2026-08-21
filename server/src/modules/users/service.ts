import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "../../db/connection.js";
import { Errors } from "../../shared/errors.js";

const SALT_ROUNDS = 12;

export interface PublicUser {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  must_change_password: number;
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
      `SELECT id, full_name, email, phone, status, must_change_password, created_at FROM users ${where}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(...args, params.pageSize, (params.page - 1) * params.pageSize) as Omit<PublicUser, "roles">[];
  return { rows: attachRoles(rows), total };
}

export function getUserById(id: number): PublicUser {
  const row = db
    .prepare(`SELECT id, full_name, email, phone, status, must_change_password, created_at FROM users WHERE id = ?`)
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

/** Cryptographically random, URL-safe, ~72 bits of entropy — never chosen or seen by the caller. */
function generateTempPassword(): string {
  return crypto.randomBytes(9).toString("base64url");
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  phone?: string;
  status?: string;
}

/**
 * Admin-initiated account creation. Deliberately does not accept a
 * caller-supplied password or an initial role: the password is always a
 * random one-time value the recipient must rotate before the account is
 * usable for anything else (must_change_password), and role assignment is a
 * separate, more tightly permissioned action (see users/routes.ts).
 */
export async function createUser(input: CreateUserInput): Promise<{ user: PublicUser; temporaryPassword: string }> {
  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(input.email);
  if (existing) {
    throw Errors.validation("An account with this email already exists.", {
      email: "This email is already registered.",
    });
  }

  const temporaryPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);
  const result = db
    .prepare(
      `INSERT INTO users (full_name, email, phone, password_hash, status, must_change_password)
       VALUES (?, ?, ?, ?, ?, 1)`
    )
    .run(input.fullName, input.email, input.phone ?? null, passwordHash, input.status ?? "ACTIVE");

  return { user: getUserById(Number(result.lastInsertRowid)), temporaryPassword };
}

export async function adminResetPassword(userId: number): Promise<string> {
  const user = db.prepare(`SELECT id FROM users WHERE id = ?`).get(userId);
  if (!user) throw Errors.notFound("User not found.");
  const tempPassword = generateTempPassword();
  const hash = await bcrypt.hash(tempPassword, SALT_ROUNDS);
  db.prepare(
    `UPDATE users SET password_hash = ?, must_change_password = 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
  ).run(hash, userId);
  return tempPassword;
}
