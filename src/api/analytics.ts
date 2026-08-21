import { api } from "./client";

export interface Kpis {
  totalUsers: number;
  totalTeams: number;
  totalParticipants: number;
  pendingRegistrations: number;
  approvedRegistrations: number;
  pendingPayments: number;
  verifiedPayments: number;
  expectedRevenue: number;
  verifiedRevenue: number;
}

export const analyticsApi = {
  kpis: (eventId?: number) => api.get<Kpis>("/analytics/kpis", { eventId }),
  registrations: (eventId?: number) =>
    api.get<{
      daily: { date: string; count: number }[];
      byPeriod: { period: string; count: number }[];
      byStatus: { status: string; count: number }[];
    }>("/analytics/registrations", { eventId }),
  payments: (eventId?: number) =>
    api.get<{
      byStatus: { status: string; count: number; amount: number }[];
      revenueByPeriod: { period: string | null; revenue: number }[];
    }>("/analytics/payments", { eventId }),
  participants: (eventId?: number) =>
    api.get<{
      perTeam: { team: string; count: number }[];
      byInstitution: { institution: string; count: number }[];
    }>("/analytics/participants", { eventId }),
  users: () =>
    api.get<{
      totalUsers: number;
      activeUsers: number;
      newUsersDaily: { date: string; count: number }[];
      conversionRate: number;
    }>("/analytics/users"),
};
