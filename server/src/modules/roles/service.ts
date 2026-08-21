import { db } from "../../db/connection.js";
import { Errors } from "../../shared/errors.js";
import type { Permission } from "../../shared/permissions.js";

export interface RoleRow {
  id: number;
  name: string;
  description: string | null;
  is_system: number;
  created_at: string;
}

export interface RoleView extends RoleRow {
  permissions: Permission[];
  userCount: number;
}

function attachDetails(roles: RoleRow[]): RoleView[] {
  return roles.map((role) => {
    const permissions = db
      .prepare(
        `SELECT p.key FROM permissions p JOIN role_permissions rp ON rp.permission_id = p.id WHERE rp.role_id = ?`
      )
      .all(role.id) as { key: Permission }[];
    const userCount = (
      db.prepare(`SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?`).get(role.id) as {
        count: number;
      }
    ).count;
    return { ...role, permissions: permissions.map((p) => p.key), userCount };
  });
}

export function listRoles(): RoleView[] {
  const rows = db.prepare(`SELECT * FROM roles ORDER BY name`).all() as unknown as RoleRow[];
  return attachDetails(rows);
}

export function getRoleById(id: number): RoleView {
  const row = db.prepare(`SELECT * FROM roles WHERE id = ?`).get(id) as unknown as RoleRow | undefined;
  if (!row) throw Errors.notFound("Role not found.");
  return attachDetails([row])[0];
}

function setPermissions(roleId: number, permissions: Permission[]): void {
  db.prepare(`DELETE FROM role_permissions WHERE role_id = ?`).run(roleId);
  const insert = db.prepare(
    `INSERT INTO role_permissions (role_id, permission_id)
     SELECT ?, id FROM permissions WHERE key = ?`
  );
  for (const key of permissions) insert.run(roleId, key);
}

export function createRole(input: { name: string; description?: string; permissions: Permission[] }): RoleView {
  const existing = db.prepare(`SELECT id FROM roles WHERE name = ?`).get(input.name);
  if (existing) throw Errors.conflict("A role with this name already exists.");
  const result = db
    .prepare(`INSERT INTO roles (name, description, is_system) VALUES (?, ?, 0)`)
    .run(input.name, input.description ?? null);
  const roleId = Number(result.lastInsertRowid);
  setPermissions(roleId, input.permissions);
  return getRoleById(roleId);
}

export function updateRole(id: number, patch: { description?: string; permissions?: Permission[] }): RoleView {
  const role = db.prepare(`SELECT * FROM roles WHERE id = ?`).get(id) as { is_system: number } | undefined;
  if (!role) throw Errors.notFound("Role not found.");

  if (patch.description !== undefined) {
    db.prepare(`UPDATE roles SET description = ? WHERE id = ?`).run(patch.description, id);
  }
  if (patch.permissions !== undefined) {
    if (role.is_system) {
      throw Errors.forbidden("System-critical roles cannot have their permissions modified.");
    }
    setPermissions(id, patch.permissions);
  }
  return getRoleById(id);
}

export function deactivateRole(id: number): void {
  const role = db.prepare(`SELECT * FROM roles WHERE id = ?`).get(id) as { is_system: number } | undefined;
  if (!role) throw Errors.notFound("Role not found.");
  if (role.is_system) {
    throw Errors.forbidden("System-critical roles are protected from deletion.");
  }
  const inUse = (
    db.prepare(`SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?`).get(id) as { count: number }
  ).count;
  if (inUse > 0) {
    throw Errors.conflict("Cannot deactivate a role that is still assigned to users.");
  }
  db.prepare(`DELETE FROM roles WHERE id = ?`).run(id);
}

export function listRoleUsers(id: number) {
  return db
    .prepare(
      `SELECT u.id, u.full_name, u.email, u.status FROM users u
       JOIN user_roles ur ON ur.user_id = u.id WHERE ur.role_id = ?`
    )
    .all(id);
}
