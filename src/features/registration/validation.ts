import { PASSWORD_MIN, TEAM_NAME_MAX, TEAM_NAME_MIN } from "../../services/api/config";

/**
 * Pure, synchronous client-side validation. This exists purely for fast
 * UX feedback — the CTFd backend remains the source of truth and every
 * one of these rules is re-checked server-side. Never treat a clean
 * result here as an authorization or security guarantee.
 */

export type FieldErrors = Record<string, string>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEAM_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9 _-]*$/;

export interface AccountFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function validateAccountFields(values: AccountFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "Enter your name.";
  }

  if (!values.email.trim()) {
    errors.email = "Enter your email.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Choose a password.";
  } else if (values.password.length < PASSWORD_MIN) {
    errors.password = `Password must be at least ${PASSWORD_MIN} characters.`;
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords don't match.";
  }

  return errors;
}

export interface CreateTeamFormValues {
  teamName: string;
  teamPassword: string;
  confirmTeamPassword: string;
}

export function validateCreateTeamFields(values: CreateTeamFormValues): FieldErrors {
  const errors: FieldErrors = {};
  const name = values.teamName.trim();

  if (!name) {
    errors.teamName = "Enter a team name.";
  } else if (name.length < TEAM_NAME_MIN) {
    errors.teamName = `Team name must be at least ${TEAM_NAME_MIN} characters.`;
  } else if (name.length > TEAM_NAME_MAX) {
    errors.teamName = `Team name must be ${TEAM_NAME_MAX} characters or fewer.`;
  } else if (!TEAM_NAME_PATTERN.test(name)) {
    errors.teamName = "Use letters, numbers, spaces, - or _ only, starting with a letter or number.";
  }

  if (!values.teamPassword) {
    errors.teamPassword = "Choose a team password.";
  } else if (values.teamPassword.length < PASSWORD_MIN) {
    errors.teamPassword = `Team password must be at least ${PASSWORD_MIN} characters.`;
  }

  if (!values.confirmTeamPassword) {
    errors.confirmTeamPassword = "Confirm the team password.";
  } else if (values.teamPassword !== values.confirmTeamPassword) {
    errors.confirmTeamPassword = "Passwords don't match.";
  }

  return errors;
}

export interface JoinTeamFormValues {
  teamName: string;
  teamPassword: string;
}

export function validateJoinTeamFields(values: JoinTeamFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.teamName.trim()) {
    errors.teamName = "Enter the team name.";
  }

  if (!values.teamPassword) {
    errors.teamPassword = "Enter the team password.";
  }

  return errors;
}

export function validateRequiredCustomFields(
  fields: { id: string; name: string; required: boolean }[],
  values: Record<string, string>
): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of fields) {
    if (field.required && !values[field.id]?.trim()) {
      errors[`custom_${field.id}`] = `${field.name} is required.`;
    }
  }
  return errors;
}
