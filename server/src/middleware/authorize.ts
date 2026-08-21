import type { NextFunction, Request, Response } from "express";
import { Errors } from "../shared/errors.js";
import type { Permission } from "../shared/permissions.js";

/** Requires the authenticated user to hold ALL of the given permissions. */
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(Errors.unauthenticated());
    const missing = permissions.filter((p) => !req.user!.permissions.includes(p));
    if (missing.length > 0) {
      return next(
        Errors.forbidden(`Missing required permission(s): ${missing.join(", ")}`)
      );
    }
    next();
  };
}
