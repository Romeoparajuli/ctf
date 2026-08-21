import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/authorize.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { checkCtfdConnectivity, syncTeamToCtfd } from "./service.js";
import { db } from "../../db/connection.js";
import { Errors } from "../../shared/errors.js";
import { recordAudit } from "../audit/service.js";

export const ctfdRouter = Router();

ctfdRouter.use(requireAuth, requirePermission("system_settings.view"));

ctfdRouter.get(
  "/status",
  asyncHandler(async (_req, res) => {
    res.json(await checkCtfdConnectivity());
  })
);

ctfdRouter.post(
  "/registrations/:id/sync",
  asyncHandler(async (req, res) => {
    const registration = db
      .prepare(`SELECT r.id, r.status, t.name as team_name FROM registrations r LEFT JOIN teams t ON t.id = r.team_id WHERE r.id = ?`)
      .get(Number(req.params.id)) as { id: number; status: string; team_name: string | null } | undefined;
    if (!registration) throw Errors.notFound("Registration not found.");
    if (registration.status !== "APPROVED") {
      throw Errors.conflict("Only approved registrations can be synced to CTFd.");
    }
    const result = await syncTeamToCtfd(registration.team_name ?? "");
    recordAudit({
      userId: req.user!.id,
      action: "CTFD_SYNC_ATTEMPTED",
      entityType: "registration",
      entityId: registration.id,
      newValue: result,
      req,
    });
    res.json(result);
  })
);
