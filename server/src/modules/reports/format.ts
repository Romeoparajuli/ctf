import type { ColumnType } from "./types.js";

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return `NPR ${amount.toLocaleString("en-IN")}`;
}

export function formatDateDisplay(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

/** Human-readable representation used by CSV, PDF and DOCX (all display text, not typed cells). */
export function formatCellDisplay(value: unknown, type: ColumnType): string {
  if (value === null || value === undefined || value === "") return "—";
  switch (type) {
    case "currency":
      return formatCurrency(Number(value));
    case "date":
      return formatDateDisplay(value);
    case "number":
      return String(value);
    default:
      return String(value);
  }
}
