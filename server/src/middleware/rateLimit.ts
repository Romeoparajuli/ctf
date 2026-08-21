import rateLimit from "express-rate-limit";

/** Tight limiter for authentication endpoints (brute-force protection). */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "AUTHENTICATION_ERROR", message: "Too many attempts. Try again later." } },
});

/** General-purpose limiter for the rest of the API. */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "CONFLICT", message: "Too many requests. Slow down." } },
});
