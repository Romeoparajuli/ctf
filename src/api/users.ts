import { api } from "./client";
import type { AdminUserRow, Paginated } from "../types/domain";

export interface CreateUserInput {
  fullName: string;
  email: string;
  phone?: string;
  status?: string;
}

export const usersApi = {
  list: (params: { page?: number; pageSize?: number; search?: string }) =>
    api.get<Paginated<AdminUserRow>>("/users", params),
  get: (id: number) => api.get<{ user: AdminUserRow }>(`/users/${id}`),
  create: (input: CreateUserInput) =>
    api.post<{ user: AdminUserRow; temporaryPassword: string }>("/users", input),
  update: (id: number, patch: { fullName?: string; phone?: string; status?: string }) =>
    api.patch<{ user: AdminUserRow }>(`/users/${id}`, patch),
  deactivate: (id: number) => api.post<{ user: AdminUserRow }>(`/users/${id}/deactivate`),
  reactivate: (id: number) => api.post<{ user: AdminUserRow }>(`/users/${id}/reactivate`),
  assignRole: (id: number, roleId: number) => api.post<{ user: AdminUserRow }>(`/users/${id}/roles`, { roleId }),
  removeRole: (id: number, roleId: number) => api.delete<{ user: AdminUserRow }>(`/users/${id}/roles/${roleId}`),
  resetPassword: (id: number) => api.post<{ temporaryPassword: string }>(`/users/${id}/reset-password`),
  activity: (id: number) => api.get<{ items: unknown[] }>(`/users/${id}/activity`),

  myProfile: () => api.get<{ user: AdminUserRow }>("/users/me/profile"),
  updateMyProfile: (patch: { fullName?: string; phone?: string }) =>
    api.patch<{ user: AdminUserRow }>("/users/me/profile", patch),
  changeMyPassword: (input: { currentPassword: string; newPassword: string }) =>
    api.post<{ ok: true }>("/users/me/change-password", input),
};
