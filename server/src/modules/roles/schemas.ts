import { z } from "zod";
import { PERMISSIONS } from "../../shared/permissions.js";

export const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[A-Z][A-Z0-9_]*$/, "Role name must be UPPER_SNAKE_CASE."),
  description: z.string().trim().max(300).optional(),
  permissions: z.array(z.enum(PERMISSIONS)).default([]),
});

export const updateRoleSchema = z.object({
  description: z.string().trim().max(300).optional(),
  permissions: z.array(z.enum(PERMISSIONS)).optional(),
});
