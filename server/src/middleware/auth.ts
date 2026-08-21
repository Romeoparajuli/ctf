import type { NextFunction, Request, Response } from "express";
import { db } from "../db/connection.js";
import { env } from "../config/env.js";
import { Errors } from "../shared/errors.js";
import { getSession, refreshSession } from "../shared/session.js";
import type { Permission } from "../shared/permissions.js";

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  status: string;
  mustChangePassword: boolean;
  roles: string[];
  permissions: Permission[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function loadUserWithPermissions(userId: number): AuthUser | undefined {
  const user = db
    .prepare(`SELECT id, full_name, email, status, must_change_password FROM users WHERE id = ?`)
    .get(userId) as
    | { id: number; full_name: string; email: string; status: string; must_change_password: number }
    | undefined;
  if (!user) return undefined;

  const roles = db
    .prepare(
      `SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?`
    )
    .all(userId) as { name: string }[];

  const permissions = db
    .prepare(
      `SELECT DISTINCT p.key FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN user_roles ur ON ur.role_id = rp.role_id
       WHERE ur.user_id = ?`
    )
    .all(userId) as { key: string }[];

  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    status: user.status,
    mustChangePassword: user.must_change_password === 1,
    roles: roles.map((r) => r.name),
    permissions: permissions.map((p) => p.key) as Permission[],
  };
}

/** Populates req.user if a valid session cookie is present; never rejects. */
export function attachUser(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[env.COOKIE_NAME];
  if (!token) return next();

  const session = getSession(token);
  if (!session) return next();

  const user = loadUserWithPermissions(session.user_id);
  if (!user || user.status !== "ACTIVE") return next();

  req.user = user;
  refreshSession(token);
  next();
}

/**
 * Endpoints a user with a forced password change still needs: reading/ending
 * their own session, and the one action that clears the flag. Every other
 * authenticated endpoint is blocked until they change it — this is enforced
 * here, not just hidden in the UI, because an admin-issued password (new
 * account, forced reset) must not stay usable for anything else indefinitely.
 */
const PASSWORD_CHANGE_EXEMPT_PATHS = new Set([
  "/api/auth/me",
  "/api/auth/logout",
  "/api/users/me/change-password",
]);

/** Rejects the request unless a valid authenticated user is attached. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) return next(Errors.unauthenticated());
  // req.path is relative to whichever router this runs inside (varies by
  // call site) — req.originalUrl is the one representation that's stable
  // regardless of mount point, which is what the exempt list is written against.
  const fullPath = req.originalUrl.split("?")[0];
  if (req.user.mustChangePassword && !PASSWORD_CHANGE_EXEMPT_PATHS.has(fullPath)) {
    return next(Errors.passwordChangeRequired());
  }
  next();
}
