import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/authorize.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { listAuditLogs } from "./service.js";

export const auditRouter = Router();

auditRouter.use(requireAuth, requirePermission("audit_logs.view"));

auditRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 25)));
    const entityType = typeof req.query.entityType === "string" ? req.query.entityType : undefined;
    const action = typeof req.query.action === "string" ? req.query.action : undefined;
    const { rows, total } = listAuditLogs({ page, pageSize, entityType, action });
    res.json({ items: rows, page, pageSize, total });
  })
);
