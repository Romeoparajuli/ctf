import bcrypt from "bcryptjs";
import { db } from "../../db/connection.js";
import { Errors } from "../../shared/errors.js";
import { recordAudit } from "../audit/service.js";
import { notify } from "../notifications/service.js";
import type { SignupInput } from "./schemas.js";
import type { Request } from "express";

const SALT_ROUNDS = 12;

export interface UserRow {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  status: string;
}

export function findUserByEmail(email: string): UserRow | undefined {
  return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as UserRow | undefined;
}

export async function signup(input: SignupInput, req: Request): Promise<number> {
  const existing = findUserByEmail(input.email);
  if (existing) {
    throw Errors.validation("An account with this email already exists.", {
      email: "This email is already registered.",
    });
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const result = db
    .prepare(
      `INSERT INTO users (full_name, email, phone, password_hash, status) VALUES (?, ?, ?, ?, 'ACTIVE')`
    )
    .run(input.fullName, input.email, input.phone || null, passwordHash);

  const userId = Number(result.lastInsertRowid);

  const participantRole = db.prepare(`SELECT id FROM roles WHERE name = 'PARTICIPANT'`).get() as
    | { id: number }
    | undefined;
  if (participantRole) {
    db.prepare(`INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`).run(
      userId,
      participantRole.id
    );
  }

  recordAudit({ userId, action: "USER_CREATED", entityType: "user", entityId: userId, req });
  notify(userId, "ACCOUNT_CREATED", "Welcome to Nepal CTF", "Your account has been created successfully.");

  return userId;
}

export async function verifyPassword(user: UserRow, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password_hash);
}

export async function changePassword(userId: number, newPassword: string): Promise<void> {
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`).run(
    passwordHash,
    userId
  );
}
