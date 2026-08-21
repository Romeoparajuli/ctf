export type RegistrationState = "NOT_STARTED" | "EARLY" | "LATE" | "CLOSED";

export interface EventScheduleLike {
  registration_start_date: string;
  early_registration_end_date: string;
  late_registration_end_date: string;
  early_registration_fee: number;
  late_registration_fee: number;
  status: string;
}

export interface RegistrationWindow {
  state: RegistrationState;
  period: "EARLY" | "LATE" | null;
  fee: number | null;
}

/**
 * Boundary rule (explicit, to resolve the ambiguity called out in the spec at the
 * early/late transition instant): the early window is [start, earlyEnd) and the late
 * window is [earlyEnd, lateEnd) — i.e. the exact instant `earlyRegistrationEndDate`
 * is already LATE pricing, not EARLY. This is evaluated server-side only; the fee the
 * client submits is never trusted.
 */
export function computeRegistrationWindow(event: EventScheduleLike, now: Date = new Date()): RegistrationWindow {
  if (event.status === "CANCELLED" || event.status === "COMPLETED") {
    return { state: "CLOSED", period: null, fee: null };
  }

  const start = new Date(event.registration_start_date).getTime();
  const earlyEnd = new Date(event.early_registration_end_date).getTime();
  const lateEnd = new Date(event.late_registration_end_date).getTime();
  const t = now.getTime();

  if (t < start) return { state: "NOT_STARTED", period: null, fee: null };
  if (t < earlyEnd) return { state: "EARLY", period: "EARLY", fee: event.early_registration_fee };
  if (t < lateEnd) return { state: "LATE", period: "LATE", fee: event.late_registration_fee };
  return { state: "CLOSED", period: null, fee: null };
}
