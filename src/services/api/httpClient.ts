import { CTFD_BASE_URL } from "./config";
import { ApiError, RegistrationApiError } from "./types";

/**
 * Thin fetch wrapper for talking to a real CTFd instance.
 *
 * CTFd's own frontend authenticates mutating requests with the Flask
 * session cookie plus a CSRF nonce embedded in the HTML CTFd serves
 * (`const csrfNonce = "...";` in its base template) — sent back as the
 * `CSRF-Token` header. Personal API access tokens (the `Authorization:
 * Token <token>` scheme documented at docs.ctfd.io) are meant for
 * out-of-band scripts with a token a user already generated, not for an
 * anonymous visitor registering for the first time, so this client uses
 * the same session+nonce flow CTFd's own UI uses instead of inventing a
 * separate auth mechanism.
 *
 * NOTE: this file targets a real CTFd deployment and has not been
 * exercised against one yet (see project README). The app runs against
 * `mockApi.ts` until VITE_USE_MOCK_API=false and a real instance is wired
 * up — verify field/endpoint names against that instance's CTFd version
 * before flipping the switch.
 */

let cachedNonce: string | null = null;

async function getNonce(): Promise<string> {
  if (cachedNonce) return cachedNonce;

  const res = await fetch(`${CTFD_BASE_URL}/`, { credentials: "include" });
  const html = await res.text();
  const match = html.match(/csrfNonce['"]?\s*[:=]\s*["']([a-f0-9]+)["']/i);

  if (!match) {
    throw new RegistrationApiError({
      kind: "network",
      formError:
        "Couldn't establish a secure session with the competition server. Please refresh and try again.",
    });
  }

  cachedNonce = match[1];
  return cachedNonce;
}

interface CtfdEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]> | string[];
}

function normalizeErrors(
  status: number,
  body: CtfdEnvelope<unknown> | null
): ApiError {
  if (status === 0) {
    return {
      kind: "network",
      formError: "Can't reach the competition server. Check your connection and try again.",
    };
  }

  if (status >= 500) {
    return {
      kind: "server",
      formError: "The competition server hit an error on our end. Please try again shortly.",
    };
  }

  if (status === 401 || status === 403) {
    return {
      kind: "unauthorized",
      formError: body?.message ?? "Your session expired. Please refresh and try again.",
    };
  }

  if (status === 404) {
    return { kind: "not_found", formError: body?.message ?? "Not found." };
  }

  if (body?.errors) {
    if (Array.isArray(body.errors)) {
      return { kind: "validation", formError: body.errors.join(" ") };
    }
    const fieldErrors: Record<string, string> = {};
    for (const [field, messages] of Object.entries(body.errors)) {
      fieldErrors[field] = messages[0];
    }
    return { kind: "conflict", fieldErrors };
  }

  return {
    kind: "validation",
    formError: body?.message ?? "That request couldn't be completed. Please check your input.",
  };
}

export async function ctfdRequest<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  payload?: unknown
): Promise<T> {
  let response: Response;

  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (payload !== undefined) headers["Content-Type"] = "application/json";

    if (method !== "GET") {
      headers["CSRF-Token"] = await getNonce();
    }

    response = await fetch(`${CTFD_BASE_URL}${path}`, {
      method,
      credentials: "include",
      headers,
      body: payload !== undefined ? JSON.stringify(payload) : undefined,
    });
  } catch {
    throw new RegistrationApiError({
      kind: "network",
      formError: "Can't reach the competition server. Check your connection and try again.",
    });
  }

  let body: CtfdEnvelope<T> | null = null;
  try {
    body = (await response.json()) as CtfdEnvelope<T>;
  } catch {
    // Non-JSON response (e.g. an HTML error page) — fall through with no body.
  }

  if (!response.ok || body?.success === false) {
    throw new RegistrationApiError(normalizeErrors(response.status, body));
  }

  return (body?.data as T) ?? (undefined as T);
}
