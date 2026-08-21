import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { attachUser } from "./middleware/auth.js";
import { apiRateLimiter } from "./middleware/rateLimit.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./modules/auth/routes.js";
import { usersRouter } from "./modules/users/routes.js";
import { rolesRouter } from "./modules/roles/routes.js";
import { eventsRouter } from "./modules/events/routes.js";
import { termsRouter } from "./modules/terms/routes.js";
import { registrationsRouter } from "./modules/registrations/routes.js";
import { teamsRouter } from "./modules/teams/routes.js";
import { paymentsRouter } from "./modules/payments/routes.js";
import { notificationsRouter } from "./modules/notifications/routes.js";
import { auditRouter } from "./modules/audit/routes.js";
import { analyticsRouter } from "./modules/analytics/routes.js";
import { reportsRouter } from "./modules/reports/routes.js";
import { ctfdRouter } from "./modules/ctfd/routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(apiRateLimiter);
  app.use(attachUser);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, env: env.NODE_ENV });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/roles", rolesRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/terms", termsRouter);
  app.use("/api/registrations", registrationsRouter);
  app.use("/api/teams", teamsRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/audit-logs", auditRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/ctfd", ctfdRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
