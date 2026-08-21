/**
 * Isolated CTFd integration layer. CTFd owns the competition itself (challenges,
 * scoring, live team accounts); this application owns users, registration, payment
 * and approval. Once a registration is APPROVED we best-effort mirror the team into
 * CTFd so participants can start playing — failures here must never corrupt local
 * registration state (Section 77, Principle 7: "fail safely").
 *
 * KNOWN RISK: `/teams/join` is CTFd's own web route, not a versioned `/api/v1/...`
 * JSON endpoint, and its response shape is not covered by CTFd's public API docs.
 * It must be verified against the actual target CTFd version before this is relied
 * on in production (Section 29 / 58). Until verified, `syncTeamToCtfd` is best-effort
 * and always returns a status rather than throwing, so it can never block approval.
 */
export interface CtfdSyncResult {
  ok: boolean;
  message: string;
  attemptedAt: string;
}

const CTFD_BASE_URL = process.env.VITE_CTFD_BASE_URL ?? "";

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 250 * (i + 1)));
    }
  }
  throw lastError;
}

export async function checkCtfdConnectivity(): Promise<CtfdSyncResult> {
  if (!CTFD_BASE_URL) {
    return { ok: false, message: "VITE_CTFD_BASE_URL is not configured.", attemptedAt: new Date().toISOString() };
  }
  try {
    await withRetry(async () => {
      const res = await fetch(`${CTFD_BASE_URL.replace(/\/+$/, "")}/api/v1/config`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`CTFd responded with status ${res.status}`);
    });
    return { ok: true, message: "CTFd instance reachable.", attemptedAt: new Date().toISOString() };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "CTFd instance unreachable.",
      attemptedAt: new Date().toISOString(),
    };
  }
}

/**
 * Best-effort placeholder for mirroring an approved team into CTFd. Intentionally
 * does not throw — a CTFd outage must not corrupt local registration state.
 */
export async function syncTeamToCtfd(_teamName: string): Promise<CtfdSyncResult> {
  if (!CTFD_BASE_URL) {
    return { ok: false, message: "CTFd integration is not configured for this environment.", attemptedAt: new Date().toISOString() };
  }
  return {
    ok: false,
    message: "CTFd team sync is not yet verified against a live instance (see /teams/join risk note).",
    attemptedAt: new Date().toISOString(),
  };
}
