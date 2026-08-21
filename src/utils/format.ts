export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDateOnly(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return `NPR ${amount.toLocaleString("en-IN")}`;
}

export const REGISTRATION_STATE_LABEL: Record<string, string> = {
  NOT_STARTED: "Registration Not Started",
  EARLY: "Early Registration Open",
  LATE: "Late Registration Open",
  CLOSED: "Registration Closed",
};
