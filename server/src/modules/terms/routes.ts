import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/authorize.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { Errors } from "../../shared/errors.js";
import { recordAudit } from "../audit/service.js";
import { getEventById } from "../events/service.js";
import { markdownToSafeHtml } from "./sanitize.js";
import { createTermsSchema, updateTermsSchema } from "./schemas.js";
import {
  archiveTerms,
  createTerms,
  deleteTerms,
  getAcceptance,
  getActiveTermsForEvent,
  getTermsById,
  getTermsPreview,
  listAcceptancesForTerms,
  listTerms,
  publishTerms,
  recordAcceptance,
  updateTerms,
  type TermsStatus,
} from "./service.js";

export const termsRouter = Router();

// --- Participant-facing (registered before the generic /:id admin routes
// below so "/events/..." isn't shadowed by an admin route matching "events"
// as an :id segment) ---

termsRouter.get(
  "/events/:eventId/active",
  asyncHandler(async (req, res) => {
    const terms = getActiveTermsForEvent(Number(req.params.eventId));
    res.json({ terms: { ...terms, renderedHtml: markdownToSafeHtml(terms.content) } });
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
    const acceptanceId = recordAcceptance(req.user!.id, eventId, active.id, req);
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

// --- Administration ---

termsRouter.use(requireAuth);

termsRouter.get(
  "/",
  requirePermission("terms.view"),
  asyncHandler(async (req, res) => {
    const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
    const status = typeof req.query.status === "string" ? (req.query.status as TermsStatus) : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    res.json({ items: listTerms({ eventId, status, search }) });
  })
);

termsRouter.post(
  "/",
  requirePermission("terms.create"),
  asyncHandler(async (req, res) => {
    const input = createTermsSchema.parse(req.body);
    if (input.publish && !req.user!.permissions.includes("terms.publish")) {
      throw Errors.forbidden("You do not have permission to publish terms.");
    }
    getEventById(input.eventId); // 404s if the event doesn't exist
    const terms = createTerms(
      { eventId: input.eventId, title: input.title, version: input.version, content: input.content, effectiveDate: input.effectiveDate },
      req.user!.id,
      input.publish
    );
    recordAudit({
      userId: req.user!.id,
      action: terms.status === "PUBLISHED" ? "TERMS_PUBLISHED" : "TERMS_CREATED",
      entityType: "terms",
      entityId: terms.id,
      newValue: { title: terms.title, version: terms.version, status: terms.status },
      req,
    });
    res.status(201).json({ terms });
  })
);

termsRouter.get(
  "/:id/preview",
  requirePermission("terms.preview"),
  asyncHandler(async (req, res) => {
    res.json({ terms: getTermsPreview(Number(req.params.id)) });
  })
);

termsRouter.get(
  "/:id/acceptances",
  requirePermission("terms.acceptance_view"),
  asyncHandler(async (req, res) => {
    res.json({ items: listAcceptancesForTerms(Number(req.params.id)) });
  })
);

termsRouter.get(
  "/:id",
  requirePermission("terms.view"),
  asyncHandler(async (req, res) => {
    res.json({ terms: getTermsById(Number(req.params.id)) });
  })
);

termsRouter.patch(
  "/:id",
  requirePermission("terms.update"),
  asyncHandler(async (req, res) => {
    const input = updateTermsSchema.parse(req.body);
    const terms = updateTerms(Number(req.params.id), input);
    recordAudit({ userId: req.user!.id, action: "TERMS_UPDATED", entityType: "terms", entityId: terms.id, newValue: input, req });
    res.json({ terms });
  })
);

termsRouter.post(
  "/:id/publish",
  requirePermission("terms.publish"),
  asyncHandler(async (req, res) => {
    const terms = publishTerms(Number(req.params.id), req.user!.id);
    recordAudit({
      userId: req.user!.id,
      action: "TERMS_PUBLISHED",
      entityType: "terms",
      entityId: terms.id,
      newValue: { title: terms.title, version: terms.version },
      req,
    });
    res.json({ terms });
  })
);

termsRouter.post(
  "/:id/archive",
  requirePermission("terms.archive"),
  asyncHandler(async (req, res) => {
    const terms = archiveTerms(Number(req.params.id));
    recordAudit({ userId: req.user!.id, action: "TERMS_ARCHIVED", entityType: "terms", entityId: terms.id, req });
    res.json({ terms });
  })
);

termsRouter.delete(
  "/:id",
  requirePermission("terms.delete"),
  asyncHandler(async (req, res) => {
    deleteTerms(Number(req.params.id));
    recordAudit({ userId: req.user!.id, action: "TERMS_DELETED", entityType: "terms", entityId: req.params.id, req });
    res.json({ ok: true });
  })
);
