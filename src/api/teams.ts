import { api } from "./client";
import type { Team, TeamMember } from "../types/domain";

export interface TeamListItem extends Team {
  event_name: string;
  member_count: number;
}

export const teamsApi = {
  list: (eventId?: number) => api.get<{ items: TeamListItem[] }>("/teams", { eventId }),
  get: (id: number) => api.get<{ team: Team; members: TeamMember[] }>(`/teams/${id}`),
};
