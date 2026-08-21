const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/+$/, "");

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
  | "INTERNAL_SERVER_ERROR"
  | "NETWORK_ERROR";

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly fieldErrors?: Record<string, string>;
  readonly status: number;

  constructor(code: ErrorCode, message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  raw?: boolean;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = `${API_BASE_URL}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, options.query);

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      credentials: "include",
      headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Unable to reach the server. Check your connection and try again.", 0);
  }

  if (options.raw) {
    return response as unknown as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const errorBody = payload?.error;
    throw new ApiError(
      errorBody?.code ?? "INTERNAL_SERVER_ERROR",
      errorBody?.message ?? "Something went wrong. Please try again.",
      response.status,
      errorBody?.fieldErrors
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions["query"]) => apiRequest<T>(path, { method: "GET", query }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};
