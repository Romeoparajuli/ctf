import { api } from "./client";
import type { EventSummary } from "../types/domain";

export interface EventInput {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  rules?: string;
  prizePool?: string;
  venue?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  registrationStartDate: string;
  earlyRegistrationEndDate: string;
  lateRegistrationEndDate: string;
  earlyRegistrationFee: number;
  lateRegistrationFee: number;
  paymentInstructions?: string;
  paymentQr?: string;
  minTeamSize: number;
  maxTeamSize: number;
}

export const eventsApi = {
  list: () => api.get<{ items: EventSummary[] }>("/events"),
  getBySlug: (slug: string) => api.get<{ event: EventSummary }>(`/events/${slug}`),
  create: (input: EventInput) => api.post<{ event: EventSummary }>("/events", input),
  update: (id: number, patch: Partial<EventInput & { status: string }>) =>
    api.patch<{ event: EventSummary }>(`/events/${id}`, patch),
  remove: (id: number) => api.delete<{ ok: true }>(`/events/${id}`),
};
