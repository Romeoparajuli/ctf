import { api } from "./client";
import type { AuditLogEntry, Paginated } from "../types/domain";

export const auditApi = {
  list: (params: { page?: number; pageSize?: number; entityType?: string; action?: string }) =>
    api.get<Paginated<AuditLogEntry>>("/audit-logs", params),
};
