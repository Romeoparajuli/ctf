import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { listNotifications, markAllRead, markRead, unreadCount } from "./service.js";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json({ notifications: listNotifications(req.user!.id), unreadCount: unreadCount(req.user!.id) });
  })
);

notificationsRouter.post(
  "/:id/read",
  asyncHandler(async (req, res) => {
    markRead(req.user!.id, Number(req.params.id));
    res.json({ ok: true });
  })
);

notificationsRouter.post(
  "/read-all",
  asyncHandler(async (req, res) => {
    markAllRead(req.user!.id);
    res.json({ ok: true });
  })
);
