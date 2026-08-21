import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: z.string().trim().min(7, "Enter a valid phone number.").max(20).optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"]).optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(20).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"]).optional(),
});

export const assignRoleSchema = z.object({
  roleId: z.number().int().positive(),
});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(20).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Za-z]/, "Password must contain a letter.")
      .regex(/[0-9]/, "Password must contain a number."),
  })
  .strict();
