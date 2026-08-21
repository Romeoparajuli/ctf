import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/authorize.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { Errors } from "../../shared/errors.js";
import { recordAudit } from "../audit/service.js";
import { db } from "../../db/connection.js";
import { changePassword, findUserByEmail, verifyPassword } from "../auth/service.js";
import {
  adminResetPassword,
  assignRole,
  createUser,
  getUserById,
  listUsers,
  removeRole,
  updateUser,
} from "./service.js";
import {
  assignRoleSchema,
  changePasswordSchema,
  createUserSchema,
  updateProfileSchema,
  updateUserSchema,
} from "./schemas.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);

// --- Self-service (any authenticated user) ---

usersRouter.get(
  "/me/profile",
  asyncHandler(async (req, res) => {
    res.json({ user: getUserById(req.user!.id) });
  })
);

usersRouter.patch(
  "/me/profile",
  asyncHandler(async (req, res) => {
    const input = updateProfileSchema.parse(req.body);
    updateUser(req.user!.id, input);
    res.json({ user: getUserById(req.user!.id) });
  })
);

usersRouter.post(
  "/me/change-password",
  asyncHandler(async (req, res) => {
    const input = changePasswordSchema.parse(req.body);
    const user = findUserByEmail(req.user!.email);
    if (!user || !(await verifyPassword(user, input.currentPassword))) {
      throw Errors.validation("Current password is incorrect.", { currentPassword: "Incorrect password." });
    }
    await changePassword(req.user!.id, input.newPassword);
    recordAudit({ userId: req.user!.id, action: "PASSWORD_CHANGED", entityType: "user", entityId: req.user!.id, req });
    res.json({ ok: true });
  })
);

// --- Administration ---

usersRouter.get(
  "/",
  requirePermission("users.view"),
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 25)));
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const { rows, total } = listUsers({ page, pageSize, search });
    res.json({ items: rows, page, pageSize, total });
  })
);

usersRouter.post(
  "/",
  requirePermission("users.create"),
  asyncHandler(async (req, res) => {
    const input = createUserSchema.parse(req.body);
    const { user, temporaryPassword } = await createUser({ ...input, phone: input.phone || undefined });
    recordAudit({
      userId: req.user!.id,
      action: "USER_CREATED_BY_ADMIN",
      entityType: "user",
      entityId: user.id,
      // Never write the password (temporary or otherwise) to the audit trail.
      newValue: { fullName: user.full_name, email: user.email, status: user.status },
      req,
    });
    res.status(201).json({ user, temporaryPassword });
  })
);

usersRouter.get(
  "/:id",
  requirePermission("users.view"),
  asyncHandler(async (req, res) => {
    res.json({ user: getUserById(Number(req.params.id)) });
  })
);

usersRouter.patch(
  "/:id",
  requirePermission("users.update"),
  asyncHandler(async (req, res) => {
    const input = updateUserSchema.parse(req.body);
    const before = getUserById(Number(req.params.id));
    updateUser(Number(req.params.id), input);
    const after = getUserById(Number(req.params.id));
    recordAudit({
      userId: req.user!.id,
      action: "USER_UPDATED",
      entityType: "user",
      entityId: req.params.id,
      oldValue: before,
      newValue: after,
      req,
    });
    res.json({ user: after });
  })
);

usersRouter.post(
  "/:id/deactivate",
  requirePermission("users.update"),
  asyncHandler(async (req, res) => {
    updateUser(Number(req.params.id), { status: "INACTIVE" });
    recordAudit({ userId: req.user!.id, action: "USER_DEACTIVATED", entityType: "user", entityId: req.params.id, req });
    res.json({ user: getUserById(Number(req.params.id)) });
  })
);

usersRouter.post(
  "/:id/reactivate",
  requirePermission("users.update"),
  asyncHandler(async (req, res) => {
    updateUser(Number(req.params.id), { status: "ACTIVE" });
    recordAudit({ userId: req.user!.id, action: "USER_REACTIVATED", entityType: "user", entityId: req.params.id, req });
    res.json({ user: getUserById(Number(req.params.id)) });
  })
);

// Assigning/removing a role is a role-management action, not merely a user-
// management one — requiring roles.update too (in addition to users.update)
// stops an Administrator who lacks roles.* from granting themselves or
// anyone else SUPER_ADMIN via this endpoint.
usersRouter.post(
  "/:id/roles",
  requirePermission("users.update", "roles.update"),
  asyncHandler(async (req, res) => {
    const input = assignRoleSchema.parse(req.body);
    assignRole(Number(req.params.id), input.roleId);
    recordAudit({
      userId: req.user!.id,
      action: "ROLE_ASSIGNED",
      entityType: "user",
      entityId: req.params.id,
      newValue: input,
      req,
    });
    res.json({ user: getUserById(Number(req.params.id)) });
  })
);

usersRouter.delete(
  "/:id/roles/:roleId",
  requirePermission("users.update", "roles.update"),
  asyncHandler(async (req, res) => {
    removeRole(Number(req.params.id), Number(req.params.roleId));
    recordAudit({
      userId: req.user!.id,
      action: "ROLE_REMOVED",
      entityType: "user",
      entityId: req.params.id,
      oldValue: { roleId: Number(req.params.roleId) },
      req,
    });
    res.json({ user: getUserById(Number(req.params.id)) });
  })
);

usersRouter.post(
  "/:id/reset-password",
  requirePermission("users.update"),
  asyncHandler(async (req, res) => {
    const tempPassword = await adminResetPassword(Number(req.params.id));
    recordAudit({ userId: req.user!.id, action: "PASSWORD_RESET_BY_ADMIN", entityType: "user", entityId: req.params.id, req });
    res.json({ temporaryPassword: tempPassword });
  })
);

usersRouter.get(
  "/:id/activity",
  requirePermission("users.view"),
  asyncHandler(async (req, res) => {
    const rows = db
      .prepare(`SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`)
      .all(Number(req.params.id));
    res.json({ items: rows });
  })
);
