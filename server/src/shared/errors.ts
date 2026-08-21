export type ErrorCode =
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "VALIDATION_ERROR"
  | "REGISTRATION_CLOSED"
  | "TERMS_NOT_ACCEPTED"
  | "TEAM_LIMIT_EXCEEDED"
  | "DUPLICATE_REGISTRATION"
  | "PAYMENT_REQUIRED"
  | "PAYMENT_ALREADY_SUBMITTED"
  | "PAYMENT_VERIFICATION_FAILED"
  | "REGISTRATION_ALREADY_APPROVED"
  | "RESOURCE_NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  AUTHENTICATION_ERROR: 401,
  AUTHORIZATION_ERROR: 403,
  VALIDATION_ERROR: 422,
  REGISTRATION_CLOSED: 409,
  TERMS_NOT_ACCEPTED: 409,
  TEAM_LIMIT_EXCEEDED: 409,
  DUPLICATE_REGISTRATION: 409,
  PAYMENT_REQUIRED: 409,
  PAYMENT_ALREADY_SUBMITTED: 409,
  PAYMENT_VERIFICATION_FAILED: 409,
  REGISTRATION_ALREADY_APPROVED: 409,
  RESOURCE_NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(code: ErrorCode, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.fieldErrors = fieldErrors;
  }
}

export const Errors = {
  unauthenticated: (message = "Authentication required.") =>
    new AppError("AUTHENTICATION_ERROR", message),
  forbidden: (message = "You do not have permission to perform this action.") =>
    new AppError("AUTHORIZATION_ERROR", message),
  validation: (message: string, fieldErrors?: Record<string, string>) =>
    new AppError("VALIDATION_ERROR", message, fieldErrors),
  notFound: (message = "Resource not found.") => new AppError("RESOURCE_NOT_FOUND", message),
  conflict: (message: string) => new AppError("CONFLICT", message),
  registrationClosed: (message = "Registration is not currently open.") =>
    new AppError("REGISTRATION_CLOSED", message),
  termsNotAccepted: (message = "Terms and conditions must be accepted first.") =>
    new AppError("TERMS_NOT_ACCEPTED", message),
  teamLimitExceeded: (message = "Team size limit exceeded.") =>
    new AppError("TEAM_LIMIT_EXCEEDED", message),
  duplicateRegistration: (message = "A registration already exists for this event.") =>
    new AppError("DUPLICATE_REGISTRATION", message),
  paymentRequired: (message = "Payment is required before this action.") =>
    new AppError("PAYMENT_REQUIRED", message),
  paymentAlreadySubmitted: (message = "Payment has already been submitted for review.") =>
    new AppError("PAYMENT_ALREADY_SUBMITTED", message),
  registrationAlreadyApproved: (message = "This registration has already been approved.") =>
    new AppError("REGISTRATION_ALREADY_APPROVED", message),
};
