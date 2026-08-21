import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../shared/errors.js";
import { env } from "../config/env.js";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: "RESOURCE_NOT_FOUND", message: `No route for ${req.method} ${req.path}` },
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, fieldErrors: err.fieldErrors },
    });
    return;
  }

  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of err.issues) {
      fieldErrors[issue.path.join(".") || "_"] = issue.message;
    }
    res.status(422).json({
      error: { code: "VALIDATION_ERROR", message: "Validation failed.", fieldErrors },
    });
    return;
  }

  // Never leak internals in production.
  if (!env.IS_PRODUCTION) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  res.status(500).json({
    error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred." },
  });
}
