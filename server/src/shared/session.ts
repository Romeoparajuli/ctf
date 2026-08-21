import crypto from "node:crypto";
import type { Request } from "express";
import { db } from "../db/connection.js";
import { env } from "../config/env.js";

interface SessionRow {
  id: string;
  user_id: number;
  expires_at: string;
}

export function createSession(userId: number, req: Request): { token: string; expiresAt: string } {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_SECONDS * 1000).toISOString();
  db.prepare(
    `INSERT INTO sessions (id, user_id, user_agent, ip_address, expires_at) VALUES (?, ?, ?, ?, ?)`
  ).run(token, userId, req.get("user-agent") ?? null, req.ip ?? null, expiresAt);
  return { token, expiresAt };
}

export function getSession(token: string): SessionRow | undefined {
  const row = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(token) as SessionRow | undefined;
  if (!row) return undefined;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    deleteSession(token);
    return undefined;
  }
  return row;
}

export function refreshSession(token: string): void {
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_SECONDS * 1000).toISOString();
  db.prepare(`UPDATE sessions SET expires_at = ? WHERE id = ?`).run(expiresAt, token);
}

export function deleteSession(token: string): void {
  db.prepare(`DELETE FROM sessions WHERE id = ?`).run(token);
}

export function deleteAllSessionsForUser(userId: number): void {
  db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(userId);
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.IS_PRODUCTION,
  path: "/",
};
