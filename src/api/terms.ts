import { api } from "./client";

export interface TermsVersion {
  id: number;
  event_id: number;
  version: string;
  content: string;
  is_active: number;
  created_at: string;
}

export const termsApi = {
  getActive: (eventId: number) => api.get<{ terms: TermsVersion }>(`/terms/events/${eventId}/active`),
  getAcceptance: (eventId: number) =>
    api.get<{ acceptance: (TermsVersion & { accepted_at: string; acceptance_id: number }) | null }>(
      `/terms/events/${eventId}/acceptance`
    ),
  accept: (eventId: number) =>
    api.post<{ acceptanceId: number; termsVersion: string; acceptedAt: string }>(`/terms/events/${eventId}/accept`),
  listVersions: (eventId: number) => api.get<{ items: TermsVersion[] }>(`/terms/events/${eventId}/versions`),
  createVersion: (eventId: number, input: { version: string; content: string }) =>
    api.post<{ terms: TermsVersion }>(`/terms/events/${eventId}/versions`, input),
};
