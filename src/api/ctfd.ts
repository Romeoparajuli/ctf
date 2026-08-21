import { api } from "./client";

export interface CtfdSyncResult {
  ok: boolean;
  message: string;
  attemptedAt: string;
}

export const ctfdApi = {
  status: () => api.get<CtfdSyncResult>("/ctfd/status"),
  syncRegistration: (registrationId: number) =>
    api.post<CtfdSyncResult>(`/ctfd/registrations/${registrationId}/sync`),
};
