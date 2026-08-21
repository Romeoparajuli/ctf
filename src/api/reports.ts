const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/+$/, "");

export type ReportName = "registrations" | "teams" | "participants" | "payments" | "revenue" | "approvals" | "users";

/** Triggers a browser download of the given report as CSV. */
export async function downloadReportCsv(report: ReportName): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/reports/${report}?format=csv`, { credentials: "include" });
  if (!response.ok) {
    throw new Error("Failed to generate report.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report}-report.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function fetchReportJson<T>(report: ReportName): Promise<{ items: T[] }> {
  const response = await fetch(`${API_BASE_URL}/reports/${report}`, { credentials: "include" });
  if (!response.ok) {
    throw new Error("Failed to load report.");
  }
  return response.json();
}
