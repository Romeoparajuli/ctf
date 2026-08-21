import { z } from "zod";

export const submitPaymentSchema = z.object({
  reference: z.string().trim().min(3, "Enter the payment transaction reference.").max(120),
  proofUrl: z.string().trim().max(2000).optional(),
});

export const rejectPaymentSchema = z.object({
  reason: z.string().trim().min(5, "A rejection reason of at least 5 characters is required.").max(1000),
});
