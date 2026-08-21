import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/authorize.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { getEventById } from "../events/service.js";
import { getRegistrationById } from "../registrations/service.js";
import { rejectPaymentSchema, submitPaymentSchema } from "./schemas.js";
import { getPaymentByRegistration, listPayments, rejectPayment, submitPayment, verifyPayment } from "./service.js";

export const paymentsRouter = Router();

paymentsRouter.use(requireAuth);

paymentsRouter.get(
  "/registrations/:registrationId",
  asyncHandler(async (req, res) => {
    const registration = getRegistrationById(Number(req.params.registrationId));
    const isOwner = registration.user_id === req.user!.id;
    const isReviewer = req.user!.permissions.includes("payments.view");
    if (!isOwner && !isReviewer) return res.status(403).json({ error: { code: "AUTHORIZATION_ERROR", message: "Forbidden" } });
    const payment = getPaymentByRegistration(registration.id);
    const event = getEventById(registration.event_id);
    res.json({ payment, paymentQr: event.payment_qr_url, paymentInstructions: event.payment_instructions });
  })
);

paymentsRouter.post(
  "/registrations/:registrationId/submit",
  asyncHandler(async (req, res) => {
    const input = submitPaymentSchema.parse(req.body);
    const payment = submitPayment(Number(req.params.registrationId), req.user!.id, input);
    res.json({ payment });
  })
);

paymentsRouter.get(
  "/",
  requirePermission("payments.view"),
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 25)));
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const { rows, total } = listPayments({ page, pageSize, status });
    res.json({ items: rows, page, pageSize, total });
  })
);

paymentsRouter.post(
  "/:id/verify",
  requirePermission("payments.verify"),
  asyncHandler(async (req, res) => {
    const payment = verifyPayment(Number(req.params.id), req.user!.id, req);
    res.json({ payment });
  })
);

paymentsRouter.post(
  "/:id/reject",
  requirePermission("payments.reject"),
  asyncHandler(async (req, res) => {
    const input = rejectPaymentSchema.parse(req.body);
    const payment = rejectPayment(Number(req.params.id), req.user!.id, input.reason, req);
    res.json({ payment });
  })
);
