import { z } from "zod";

const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Must be a valid date.");

export const createEventSchema = z.object({
  name: z.string().trim().min(3).max(150),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and hyphens."),
  description: z.string().trim().max(20000).optional(),
  shortDescription: z.string().trim().max(300).optional(),
  rules: z.string().trim().max(20000).optional(),
  prizePool: z.string().trim().max(300).optional(),
  venue: z.string().trim().max(300).optional(),
  eventStartDate: isoDate.optional(),
  eventEndDate: isoDate.optional(),
  registrationStartDate: isoDate,
  earlyRegistrationEndDate: isoDate,
  lateRegistrationEndDate: isoDate,
  earlyRegistrationFee: z.number().int().min(0),
  lateRegistrationFee: z.number().int().min(0),
  paymentInstructions: z.string().trim().max(5000).optional(),
  paymentQr: z.string().trim().max(2000).optional(),
  minTeamSize: z.number().int().min(1).max(50).default(1),
  maxTeamSize: z.number().int().min(1).max(50).default(4),
}).refine((d) => new Date(d.registrationStartDate) < new Date(d.earlyRegistrationEndDate), {
  message: "Early registration end date must be after the registration start date.",
  path: ["earlyRegistrationEndDate"],
}).refine((d) => new Date(d.earlyRegistrationEndDate) < new Date(d.lateRegistrationEndDate), {
  message: "Late registration end date must be after the early registration end date.",
  path: ["lateRegistrationEndDate"],
}).refine((d) => d.minTeamSize <= d.maxTeamSize, {
  message: "Minimum team size cannot exceed maximum team size.",
  path: ["minTeamSize"],
});

export const updateEventSchema = z.object({
  name: z.string().trim().min(3).max(150).optional(),
  description: z.string().trim().max(20000).optional(),
  shortDescription: z.string().trim().max(300).optional(),
  rules: z.string().trim().max(20000).optional(),
  prizePool: z.string().trim().max(300).optional(),
  venue: z.string().trim().max(300).optional(),
  eventStartDate: isoDate.optional(),
  eventEndDate: isoDate.optional(),
  registrationStartDate: isoDate.optional(),
  earlyRegistrationEndDate: isoDate.optional(),
  lateRegistrationEndDate: isoDate.optional(),
  earlyRegistrationFee: z.number().int().min(0).optional(),
  lateRegistrationFee: z.number().int().min(0).optional(),
  paymentInstructions: z.string().trim().max(5000).optional(),
  paymentQr: z.string().trim().max(2000).optional(),
  minTeamSize: z.number().int().min(1).max(50).optional(),
  maxTeamSize: z.number().int().min(1).max(50).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
});
