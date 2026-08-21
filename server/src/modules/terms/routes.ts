import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/authorize.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { recordAudit } from "../audit/service.js";
import { getEventById } from "../events/service.js";
import {
  createTermsVersion,
  getAcceptance,
  getActiveTermsForEvent,
  listTermsVersions,
  recordAcceptance,
} from "./service.js";

export const termsRouter = Router();

termsRouter.get(
  "/events/:eventId/active",
  asyncHandler(async (req, res) => {
    const terms = getActiveTermsForEvent(Number(req.params.eventId));
    res.json({ terms });
  })
);

termsRouter.get(
  "/events/:eventId/versions",
  requireAuth,
  requirePermission("events.update"),
  asyncHandler(async (req, res) => {
    res.json({ items: listTermsVersions(Number(req.params.eventId)) });
  })
);

termsRouter.post(
  "/events/:eventId/versions",
  requireAuth,
  requirePermission("events.update"),
  asyncHandler(async (req, res) => {
    const eventId = Number(req.params.eventId);
    getEventById(eventId);
    const input = z.object({ version: z.string().trim().min(1).max(30), content: z.string().trim().min(1) }).parse(req.body);
    const terms = createTermsVersion(eventId, input.version, input.content);
    recordAudit({ userId: req.user!.id, action: "TERMS_VERSION_PUBLISHED", entityType: "event", entityId: eventId, newValue: input, req });
    res.status(201).json({ terms });
  })
);

termsRouter.get(
  "/events/:eventId/acceptance",
  requireAuth,
  asyncHandler(async (req, res) => {
    const acceptance = getAcceptance(req.user!.id, Number(req.params.eventId));
    res.json({ acceptance: acceptance ?? null });
  })
);

termsRouter.post(
  "/events/:eventId/accept",
  requireAuth,
  asyncHandler(async (req, res) => {
    const eventId = Number(req.params.eventId);
    const active = getActiveTermsForEvent(eventId);
    const acceptanceId = recordAcceptance(req.user!.id, eventId, active.id);
    recordAudit({
      userId: req.user!.id,
      action: "TERMS_ACCEPTED",
      entityType: "event",
      entityId: eventId,
      newValue: { termsVersion: active.version },
      req,
    });
    res.json({ acceptanceId, termsVersion: active.version, acceptedAt: new Date().toISOString() });
  })
);
