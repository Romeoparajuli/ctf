const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/+$/, "");

export type ReportId = "registrations" | "teams" | "participants" | "payments" | "revenue" | "approvals" | "users";
export type ReportExportFormat = "csv" | "xlsx" | "pdf" | "docx";

export interface ReportFilters {
  eventId?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ReportMeta {
  id: ReportId;
  title: string;
  supportedFilters: (keyof ReportFilters)[];
}

function buildQuery(filters: ReportFilters, extra?: Record<string, string>): string {
  const params = new URLSearchParams();
  if (filters.eventId) params.set("eventId", String(filters.eventId));
  if (filters.status) params.set("status", filters.status);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.search) params.set("search", filters.search);
  if (extra) for (const [k, v] of Object.entries(extra)) params.set(k, v);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function listReportMeta(): Promise<{ items: ReportMeta[] }> {
  const response = await fetch(`${API_BASE_URL}/reports`, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to load report list.");
  return response.json();
}

export async function fetchReportJson<T>(report: ReportId, filters: ReportFilters = {}): Promise<{ items: T[] }> {
  const response = await fetch(`${API_BASE_URL}/reports/${report}${buildQuery(filters)}`, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to load report.");
  return response.json();
}

function filenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const match = /filename="?([^";]+)"?/i.exec(header);
  return match ? match[1] : fallback;
}

/** Downloads a report in the given format, applying the same filters currently shown on screen. */
export async function downloadReport(report: ReportId, format: ReportExportFormat, filters: ReportFilters = {}): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/reports/${report}${buildQuery(filters, { format })}`, {
    credentials: "include",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? "Unable to generate the report. Please try again.");
  }
  const blob = await response.blob();
  const filename = filenameFromDisposition(response.headers.get("content-disposition"), `${report}-report.${format}`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
