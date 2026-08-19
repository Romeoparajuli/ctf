/** Domain types shared by the UI, the registration controller, and both API adapters. */

export interface CustomField {
  id: string;
  name: string;
  type: "text" | "select";
  required: boolean;
  options?: string[];
  helperText?: string;
}

export interface AccountInput {
  name: string;
  email: string;
  password: string;
}

export interface CreateTeamInput {
  teamName: string;
  password: string;
  customFields?: Record<string, string>;
}

export interface JoinTeamInput {
  teamName: string;
  password: string;
}

export interface Team {
  id: number;
  name: string;
  memberCount: number;
  maxSize: number;
}

export interface RegisteredSession {
  user: { id: number; name: string; email: string };
  team: Team;
}

/**
 * Normalized, human-readable error the UI renders directly.
 * `fieldErrors` maps a field name (matching form field ids) to a message,
 * so the caller can show it inline; `formError` is a general/non-field message.
 */
export interface ApiError {
  kind:
    | "validation"
    | "conflict"
    | "not_found"
    | "unauthorized"
    | "network"
    | "server";
  formError?: string;
  fieldErrors?: Record<string, string>;
}

export class RegistrationApiError extends Error {
  readonly details: ApiError;

  constructor(details: ApiError) {
    super(details.formError ?? "Registration request failed");
    this.name = "RegistrationApiError";
    this.details = details;
  }
}

export interface RegistrationApi {
  getTeamFields(): Promise<CustomField[]>;
  createAccountAndTeam(
    account: AccountInput,
    team: CreateTeamInput
  ): Promise<RegisteredSession>;
  createAccountAndJoinTeam(
    account: AccountInput,
    join: JoinTeamInput
  ): Promise<RegisteredSession>;
}
