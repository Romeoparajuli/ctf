export type ColumnType = "string" | "number" | "currency" | "date";

export interface ReportColumn {
  key: string;
  header: string;
  type: ColumnType;
  /** Approximate character width, used for xlsx column sizing. */
  width?: number;
}

export interface SummaryItem {
  label: string;
  value: string | number;
}

export interface ReportFilters {
  eventId?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ReportDefinition {
  id: string;
  title: string;
  /** Which filter fields this report actually understands — drives what the frontend should offer. */
  supportedFilters: (keyof ReportFilters)[];
  columns: ReportColumn[];
  fetchRows: (filters: ReportFilters) => Record<string, unknown>[];
  computeSummary?: (rows: Record<string, unknown>[]) => SummaryItem[];
}

export type ExportFormat = "csv" | "xlsx" | "pdf" | "docx" | "json";

export const EXPORT_FORMATS: ExportFormat[] = ["csv", "xlsx", "pdf", "docx"];
