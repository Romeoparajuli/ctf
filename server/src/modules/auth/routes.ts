import { Router } from "express";
import { env } from "../../config/env.js";
import { requireAuth } from "../../middleware/auth.js";
import { authRateLimiter } from "../../middleware/rateLimit.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { AppError, Errors } from "../../shared/errors.js";
import { createSession, cookieOptions, deleteSession } from "../../shared/session.js";
import { recordAudit } from "../audit/service.js";
import { findUserByEmail, signup, verifyPassword } from "./service.js";
import { loginSchema, signupSchema } from "./schemas.js";

export const authRouter = Router();

authRouter.post(
  "/signup",
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const input = signupSchema.parse(req.body);
    const userId = await signup(input, req);
    const { token, expiresAt } = createSession(userId, req);
    res.cookie(env.COOKIE_NAME, token, { ...cookieOptions, expires: new Date(expiresAt) });
    res.status(201).json({ ok: true });
  })
);

authRouter.post(
  "/login",
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = findUserByEmail(input.email);

    // Constant-shape error to avoid leaking which part (email vs password) was wrong.
    const invalidCredentials = () => new AppError("AUTHENTICATION_ERROR", "Invalid email or password.");

    if (!user) throw invalidCredentials();
    const valid = await verifyPassword(user, input.password);
    if (!valid) throw invalidCredentials();

    if (user.status === "SUSPENDED") {
      throw Errors.forbidden("This account has been suspended. Contact an administrator.");
    }
    if (user.status === "INACTIVE") {
      throw Errors.forbidden("This account is inactive. Contact an administrator.");
    }
    if (user.status === "PENDING_VERIFICATION") {
      throw Errors.forbidden("Please verify your account before logging in.");
    }

    const { token, expiresAt } = createSession(user.id, req);
    res.cookie(env.COOKIE_NAME, token, { ...cookieOptions, expires: new Date(expiresAt) });
    recordAudit({ userId: user.id, action: "USER_LOGIN", entityType: "user", entityId: user.id, req });
    res.json({ ok: true });
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[env.COOKIE_NAME];
    if (token) deleteSession(token);
    res.clearCookie(env.COOKIE_NAME, cookieOptions);
    res.json({ ok: true });
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);
