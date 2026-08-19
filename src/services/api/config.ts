/**
 * Centralized runtime configuration. Every other module reads config from
 * here instead of touching import.meta.env directly.
 */

export const CTFD_BASE_URL: string = (
  import.meta.env.VITE_CTFD_BASE_URL ?? ""
).replace(/\/+$/, "");

export const USE_MOCK_API: boolean =
  (import.meta.env.VITE_USE_MOCK_API ?? "true") !== "false";

export const EVENT_NAME: string = import.meta.env.VITE_EVENT_NAME ?? "Nepal CTF";

export const TEAM_MAX_SIZE = 4;
export const TEAM_NAME_MIN = 3;
export const TEAM_NAME_MAX = 32;
export const PASSWORD_MIN = 8;
