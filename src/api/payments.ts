import { api } from "./client";
import type { Paginated, Payment } from "../types/domain";

export interface PaymentListItem extends Payment {
  team_name: string | null;
  event_name: string | null;
  applicant_name: string;
}

export const paymentsApi = {
  getForRegistration: (registrationId: number) =>
    api.get<{ payment: Payment; paymentQr: string | null; paymentInstructions: string | null }>(
      `/payments/registrations/${registrationId}`
    ),
  submit: (registrationId: number, input: { reference: string; proofUrl?: string }) =>
    api.post<{ payment: Payment }>(`/payments/registrations/${registrationId}/submit`, input),

  list: (params: { page?: number; pageSize?: number; status?: string }) =>
    api.get<Paginated<PaymentListItem>>("/payments", params),
  verify: (id: number) => api.post<{ payment: Payment }>(`/payments/${id}/verify`),
  reject: (id: number, reason: string) => api.post<{ payment: Payment }>(`/payments/${id}/reject`, { reason }),
};
