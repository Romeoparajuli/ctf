import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/authorize.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { PERMISSIONS } from "../../shared/permissions.js";
import { recordAudit } from "../audit/service.js";
import { createRoleSchema, updateRoleSchema } from "./schemas.js";
import { createRole, deactivateRole, getRoleById, listRoles, listRoleUsers, updateRole } from "./service.js";

export const rolesRouter = Router();

rolesRouter.use(requireAuth);

rolesRouter.get(
  "/permissions",
  requirePermission("roles.view"),
  asyncHandler(async (_req, res) => {
    res.json({ permissions: PERMISSIONS });
  })
);

rolesRouter.get(
  "/",
  requirePermission("roles.view"),
  asyncHandler(async (_req, res) => {
    res.json({ items: listRoles() });
  })
);

rolesRouter.get(
  "/:id",
  requirePermission("roles.view"),
  asyncHandler(async (req, res) => {
    res.json({ role: getRoleById(Number(req.params.id)) });
  })
);

rolesRouter.get(
  "/:id/users",
  requirePermission("roles.view"),
  asyncHandler(async (req, res) => {
    res.json({ items: listRoleUsers(Number(req.params.id)) });
  })
);

rolesRouter.post(
  "/",
  requirePermission("roles.create"),
  asyncHandler(async (req, res) => {
    const input = createRoleSchema.parse(req.body);
    const role = createRole(input);
    recordAudit({ userId: req.user!.id, action: "ROLE_CREATED", entityType: "role", entityId: role.id, newValue: input, req });
    res.status(201).json({ role });
  })
);

rolesRouter.patch(
  "/:id",
  requirePermission("roles.update"),
  asyncHandler(async (req, res) => {
    const input = updateRoleSchema.parse(req.body);
    const role = updateRole(Number(req.params.id), input);
    recordAudit({ userId: req.user!.id, action: "ROLE_UPDATED", entityType: "role", entityId: role.id, newValue: input, req });
    res.json({ role });
  })
);

rolesRouter.delete(
  "/:id",
  requirePermission("roles.delete"),
  asyncHandler(async (req, res) => {
    deactivateRole(Number(req.params.id));
    recordAudit({ userId: req.user!.id, action: "ROLE_DEACTIVATED", entityType: "role", entityId: req.params.id, req });
    res.json({ ok: true });
  })
);
