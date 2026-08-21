import { api } from "./client";
import type { Role } from "../types/domain";

export const rolesApi = {
  list: () => api.get<{ items: Role[] }>("/roles"),
  get: (id: number) => api.get<{ role: Role }>(`/roles/${id}`),
  permissions: () => api.get<{ permissions: string[] }>("/roles/permissions"),
  users: (id: number) => api.get<{ items: { id: number; full_name: string; email: string; status: string }[] }>(`/roles/${id}/users`),
  create: (input: { name: string; description?: string; permissions: string[] }) =>
    api.post<{ role: Role }>("/roles", input),
  update: (id: number, patch: { description?: string; permissions?: string[] }) =>
    api.patch<{ role: Role }>(`/roles/${id}`, patch),
  remove: (id: number) => api.delete<{ ok: true }>(`/roles/${id}`),
};
