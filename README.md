# Nepal CTF — Team Registration

Custom registration frontend for a CTFd-backed CTF. React + Vite + TypeScript,
no UI framework — a small hand-rolled design system (CSS variables + CSS
Modules) tuned for a technical, high-contrast competition feel.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
```

The app runs entirely against an **in-memory mock API** by default — no
CTFd instance required. A seed team already exists so the Join flow is
demoable: name `CYBER PHANTOMS`, password `letmein123`.

## Wiring up a real CTFd instance

Copy `.env.example` to `.env`, set:

```
VITE_CTFD_BASE_URL=https://your-ctfd-instance.example
VITE_USE_MOCK_API=false
```

Then read the header comment in `src/services/api/httpClient.ts` before
relying on it — it documents CTFd's actual auth model for a decoupled
frontend (session cookie + CSRF nonce scraped from CTFd's own HTML, *not*
the personal-API-token scheme from the getting-started docs, which is meant
for scripts a logged-in user already has a token for). The one likely
integration hole: `/teams/join` is CTFd's own web route, not a versioned
`/api/v1/...` JSON endpoint — its exact response shape isn't in CTFd's
public API docs, so verify it against your deployed CTFd version (or swap
in whatever your instance actually exposes) before going live. Everything
else (`/api/v1/register`, `/api/v1/teams`, `/api/v1/teams/fields`) follows
CTFd's documented REST conventions.

## Architecture

```
Pages (LandingPage, CreateTeamPage, JoinTeamPage, SuccessPage)
  -> useTeamRegistration()          feature hook: form -> API, status/errors out
  -> services/api/index.ts          picks mockApi or ctfdApi by env
  -> services/api/{mock,ctfd}Api.ts both implement the same RegistrationApi contract
  -> services/api/httpClient.ts     (ctfdApi only) session+nonce handling, error normalization
```

Screens never call the API directly or see CTFd's raw error shape —
`RegistrationApiError` always carries human-readable `formError` /
`fieldErrors`, and the mock adapter mirrors CTFd's real constraints (unique
team name, unique email, team capacity) so those states are exercisable
without a live backend.

Every participant needs a CTFd **user account** before they can create or
join a team (that's how CTFd itself works — see
docs.ctfd.io/tutorials/teams/creating-and-joining-teams), so both
Create Team and Join Team collect account fields + team fields in one
combined submit rather than a separate signup step.

## Design system

`src/styles/tokens.css` is the single source of truth for color,
type, spacing, radius, and motion — every component reads from it rather
than hardcoding values. Reusable primitives live in
`src/components/ui/` (Button, Input, PasswordInput, FormField, Card,
Alert, Badge, Spinner).
