import { z } from "zod";

export const createTeamSchema = z.object({
  teamName: z.string().trim().min(3, "Team name must be at least 3 characters.").max(60),
  description: z.string().trim().max(2000).optional(),
  institution: z.string().trim().max(200).optional(),
  contactEmail: z.string().trim().email().optional(),
  contactPhone: z.string().trim().max(20).optional(),
});

export const addParticipantSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: z.string().trim().max(20).optional(),
  institution: z.string().trim().max(200).optional(),
  role: z.enum(["CAPTAIN", "MEMBER"]).default("MEMBER"),
});

export const rejectSchema = z.object({
  reason: z.string().trim().min(5, "A rejection reason of at least 5 characters is required.").max(1000),
});
