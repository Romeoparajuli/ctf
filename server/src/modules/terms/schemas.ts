import { z } from "zod";

export const createTermsSchema = z.object({
  eventId: z.number().int().positive(),
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(200),
  version: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .regex(/^[A-Za-z0-9.]+$/, "Version may only contain letters, numbers and dots (e.g. 1.0)."),
  content: z.string().trim().min(1, "Content is required.").max(50000),
  effectiveDate: z.string().trim().optional().or(z.literal("")),
  publish: z.boolean().optional().default(false),
});

export const updateTermsSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  content: z.string().trim().min(1).max(50000).optional(),
  effectiveDate: z.string().trim().optional().or(z.literal("")),
});
