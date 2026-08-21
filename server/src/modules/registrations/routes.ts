import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/authorize.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { Errors } from "../../shared/errors.js";
import { addParticipantSchema, createTeamSchema, rejectSchema } from "./schemas.js";
import {
  acceptTermsForRegistration,
  addParticipant,
  approveRegistration,
  createTeamForRegistration,
  getMyRegistrationForEvent,
  getRegistrationFull,
  listRegistrations,
  proceedToPayment,
  rejectRegistration,
  removeParticipant,
  startRegistration,
} from "./service.js";

export const registrationsRouter = Router();

registrationsRouter.use(requireAuth);

registrationsRouter.get(
  "/mine",
  asyncHandler(async (req, res) => {
    const eventId = Number(req.query.eventId);
    if (!eventId) throw Errors.validation("eventId query parameter is required.");
    const registration = getMyRegistrationForEvent(req.user!.id, eventId);
    res.json({ registration: registration ? getRegistrationFull(registration.id) : null });
  })
);

registrationsRouter.post(
  "/events/:eventId/start",
  asyncHandler(async (req, res) => {
    const registration = startRegistration(req.user!.id, Number(req.params.eventId));
    res.status(201).json({ registration });
  })
);

registrationsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const full = getRegistrationFull(Number(req.params.id));
    const isOwner = full.registration.user_id === req.user!.id;
    const isReviewer = req.user!.permissions.includes("registrations.view");
    if (!isOwner && !isReviewer) throw Errors.forbidden();
    res.json(full);
  })
);

registrationsRouter.post(
  "/:id/accept-terms",
  asyncHandler(async (req, res) => {
    const registration = acceptTermsForRegistration(Number(req.params.id), req.user!.id);
    res.json({ registration });
  })
);

registrationsRouter.post(
  "/:id/team",
  asyncHandler(async (req, res) => {
    const input = createTeamSchema.parse(req.body);
    const registration = createTeamForRegistration(Number(req.params.id), req.user!.id, input);
    res.json({ registration });
  })
);

registrationsRouter.post(
  "/:id/participants",
  asyncHandler(async (req, res) => {
    const input = addParticipantSchema.parse(req.body);
    const registration = addParticipant(Number(req.params.id), req.user!.id, input);
    res.json({ registration });
  })
);

registrationsRouter.delete(
  "/:id/participants/:memberId",
  asyncHandler(async (req, res) => {
    const registration = removeParticipant(Number(req.params.id), req.user!.id, Number(req.params.memberId));
    res.json({ registration });
  })
);

registrationsRouter.post(
  "/:id/proceed-to-payment",
  asyncHandler(async (req, res) => {
    const registration = proceedToPayment(Number(req.params.id), req.user!.id);
    res.json({ registration });
  })
);

// --- Administrative review queue ---

registrationsRouter.get(
  "/",
  requirePermission("registrations.view"),
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 25)));
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
    const { rows, total } = listRegistrations({ page, pageSize, status, eventId });
    res.json({ items: rows, page, pageSize, total });
  })
);

registrationsRouter.post(
  "/:id/approve",
  requirePermission("registrations.approve"),
  asyncHandler(async (req, res) => {
    const registration = approveRegistration(Number(req.params.id), req.user!.id, req);
    res.json({ registration });
  })
);

registrationsRouter.post(
  "/:id/reject",
  requirePermission("registrations.reject"),
  asyncHandler(async (req, res) => {
    const input = rejectSchema.parse(req.body);
    const registration = rejectRegistration(Number(req.params.id), req.user!.id, input.reason, req);
    res.json({ registration });
  })
);
