import { z } from "zod";

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters.").max(120),
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    phone: z.string().trim().min(7, "Enter a valid phone number.").max(20).optional().or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(200)
      .regex(/[A-Za-z]/, "Password must contain a letter.")
      .regex(/[0-9]/, "Password must contain a number."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
