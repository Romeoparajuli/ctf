import { api } from "./client";

export type TermsStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface TermsRecord {
  id: number;
  event_id: number;
  title: string;
  version: string;
  content: string;
  status: TermsStatus;
  effective_date: string | null;
  created_by: number | null;
  created_by_name: string | null;
  published_by: number | null;
  published_by_name: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  event_name: string | null;
  acceptance_count: number;
}

export interface TermsPreview extends TermsRecord {
  rendered_html: string;
}

export interface ActiveTerms {
  id: number;
  event_id: number;
  title: string;
  version: string;
  content: string;
  status: TermsStatus;
  effective_date: string | null;
  renderedHtml: string;
}

export interface TermsAcceptanceRow {
  id: number;
  accepted_at: string;
  ip_address: string | null;
  user_id: number;
  full_name: string;
  email: string;
  team_name: string | null;
}

export interface CreateTermsInput {
  eventId: number;
  title: string;
  version: string;
  content: string;
  effectiveDate?: string;
  publish?: boolean;
}

export interface UpdateTermsInput {
  title?: string;
  content?: string;
  effectiveDate?: string;
}

export const termsApi = {
  // Participant-facing
  getActive: (eventId: number) => api.get<{ terms: ActiveTerms }>(`/terms/events/${eventId}/active`),
  getAcceptance: (eventId: number) =>
    api.get<{ acceptance: (ActiveTerms & { accepted_at: string; acceptance_id: number }) | null }>(
      `/terms/events/${eventId}/acceptance`
    ),
  accept: (eventId: number) =>
    api.post<{ acceptanceId: number; termsVersion: string; acceptedAt: string }>(`/terms/events/${eventId}/accept`),

  // Administration
  list: (params: { eventId?: number; status?: TermsStatus; search?: string }) =>
    api.get<{ items: TermsRecord[] }>("/terms", params),
  get: (id: number) => api.get<{ terms: TermsRecord }>(`/terms/${id}`),
  preview: (id: number) => api.get<{ terms: TermsPreview }>(`/terms/${id}/preview`),
  create: (input: CreateTermsInput) => api.post<{ terms: TermsRecord }>("/terms", input),
  update: (id: number, patch: UpdateTermsInput) => api.patch<{ terms: TermsRecord }>(`/terms/${id}`, patch),
  publish: (id: number) => api.post<{ terms: TermsRecord }>(`/terms/${id}/publish`),
  archive: (id: number) => api.post<{ terms: TermsRecord }>(`/terms/${id}/archive`),
  remove: (id: number) => api.delete<{ ok: true }>(`/terms/${id}`),
  acceptances: (id: number) => api.get<{ items: TermsAcceptanceRow[] }>(`/terms/${id}/acceptances`),
};
