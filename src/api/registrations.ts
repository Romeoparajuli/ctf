import { api } from "./client";
import type { Paginated, Registration, RegistrationFull, RegistrationListItem } from "../types/domain";

export interface CreateTeamInput {
  teamName: string;
  description?: string;
  institution?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface AddParticipantInput {
  name: string;
  email: string;
  phone?: string;
  institution?: string;
  role: "CAPTAIN" | "MEMBER";
}

export const registrationsApi = {
  mine: (eventId: number) => api.get<{ registration: RegistrationFull | null }>("/registrations/mine", { eventId }),
  start: (eventId: number) => api.post<{ registration: Registration }>(`/registrations/events/${eventId}/start`),
  get: (id: number) => api.get<RegistrationFull>(`/registrations/${id}`),
  acceptTerms: (id: number) => api.post<{ registration: Registration }>(`/registrations/${id}/accept-terms`),
  createTeam: (id: number, input: CreateTeamInput) =>
    api.post<{ registration: Registration }>(`/registrations/${id}/team`, input),
  addParticipant: (id: number, input: AddParticipantInput) =>
    api.post<{ registration: Registration }>(`/registrations/${id}/participants`, input),
  removeParticipant: (id: number, memberId: number) =>
    api.delete<{ registration: Registration }>(`/registrations/${id}/participants/${memberId}`),
  proceedToPayment: (id: number) => api.post<{ registration: Registration }>(`/registrations/${id}/proceed-to-payment`),

  list: (params: { page?: number; pageSize?: number; status?: string; eventId?: number }) =>
    api.get<Paginated<RegistrationListItem>>("/registrations", params),
  approve: (id: number) => api.post<{ registration: Registration }>(`/registrations/${id}/approve`),
  reject: (id: number, reason: string) =>
    api.post<{ registration: Registration }>(`/registrations/${id}/reject`, { reason }),
};
