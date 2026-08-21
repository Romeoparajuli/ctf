import { api } from "./client";
import type { AppNotification } from "../types/domain";

export const notificationsApi = {
  list: () => api.get<{ notifications: AppNotification[]; unreadCount: number }>("/notifications"),
  markRead: (id: number) => api.post<{ ok: true }>(`/notifications/${id}/read`),
  markAllRead: () => api.post<{ ok: true }>("/notifications/read-all"),
};
