import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/authorize.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { Errors } from "../../shared/errors.js";
import { recordAudit } from "../audit/service.js";
import { createEventSchema, updateEventSchema } from "./schemas.js";
import {
  createEvent,
  deleteEvent,
  getEventById,
  getEventBySlug,
  listEvents,
  toPublicEvent,
  updateEvent,
} from "./service.js";

export const eventsRouter = Router();

// --- Public ---

eventsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const isAdminView = req.user?.permissions.includes("events.view");
    const rows = listEvents();
    const visible = isAdminView ? rows : rows.filter((r) => r.status !== "DRAFT");
    res.json({ items: visible.map(toPublicEvent) });
  })
);

eventsRouter.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const event = getEventBySlug(req.params.slug);
    if (event.status === "DRAFT" && !req.user?.permissions.includes("events.view")) {
      throw Errors.notFound("Event not found.");
    }
    res.json({ event: toPublicEvent(event) });
  })
);

// --- Administration ---

eventsRouter.post(
  "/",
  requireAuth,
  requirePermission("events.create"),
  asyncHandler(async (req, res) => {
    const input = createEventSchema.parse(req.body);
    const event = createEvent(input);
    recordAudit({ userId: req.user!.id, action: "EVENT_CREATED", entityType: "event", entityId: event.id, newValue: input, req });
    res.status(201).json({ event: toPublicEvent(event) });
  })
);

eventsRouter.patch(
  "/:id",
  requireAuth,
  requirePermission("events.update"),
  asyncHandler(async (req, res) => {
    const input = updateEventSchema.parse(req.body);
    const before = getEventById(Number(req.params.id));
    const event = updateEvent(Number(req.params.id), input);
    recordAudit({
      userId: req.user!.id,
      action: "EVENT_UPDATED",
      entityType: "event",
      entityId: event.id,
      oldValue: before,
      newValue: input,
      req,
    });
    res.json({ event: toPublicEvent(event) });
  })
);

eventsRouter.delete(
  "/:id",
  requireAuth,
  requirePermission("events.delete"),
  asyncHandler(async (req, res) => {
    deleteEvent(Number(req.params.id));
    recordAudit({ userId: req.user!.id, action: "EVENT_DELETED", entityType: "event", entityId: req.params.id, req });
    res.json({ ok: true });
  })
);
