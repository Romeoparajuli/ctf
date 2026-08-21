# Nepal CTF — Event Registration & Management Platform

A production-oriented registration platform for Nepal CTF: authentication, RBAC,
event management, terms acceptance, team/participant registration, PhonePe QR
payment workflow, administrative approval, dashboards, analytics, reports, audit
logging, and a CTFd integration boundary. React + Vite + TypeScript frontend,
Express + TypeScript + SQLite backend.

## Architecture

```
src/            React frontend (Vite, TypeScript, CSS Modules)
  api/          Typed fetch wrappers, one module per backend domain
  auth/         AuthContext (session) + ProtectedRoute guards
  components/   Reusable UI kit (components/ui) + layouts (components/layout)
  features/     Route-level feature screens (public, auth, registration wizard,
                participant dashboard, admin)
  hooks/        useAsyncData (loading/error/data), error formatting
  types/        Shared domain types mirroring backend response shapes

server/         Express backend
  src/db/       SQLite schema (schema.sql), migration runner, seed script
  src/modules/  One folder per domain: auth, users, roles, events, terms,
                registrations, payments, teams, notifications, audit,
                analytics, reports, ctfd
  src/middleware/  auth (session), authorize (permission checks), rate
                    limiting, centralized error handler
  src/shared/   AppError/error codes, permission catalog + role defaults,
                registration-period computation
```

Business rules live on the backend and are re-derived from persisted state on
every request (registration fee, registration window, permission checks) —
the frontend never trusts client-submitted fees or authorization decisions.

## Run it

Two processes: the API server and the Vite dev server. The dev server proxies
`/api/*` to `http://localhost:4000`, so cookies and requests work same-origin
without CORS configuration.

```bash
# 1. Backend
cd server
npm install
npm run seed     # creates schema, seeds roles/permissions/admin/demo event
npm run dev       # http://localhost:4000

# 2. Frontend (separate terminal, from repo root)
npm install
npm run dev       # http://localhost:5173
```

The seed script prints a super admin login (default `admin@nepalctf.org` /
`ChangeMe123!` unless `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` are set) —
change this password immediately in any shared environment. It also seeds one
demo event ("Nepal CTF 2026") with registration currently open.

Copy `server/.env.example` to `server/.env` and `.env.example` to `.env` to
override defaults (session secret, DB path, CORS origin, CTFd base URL).

## Registration lifecycle

```
DRAFT → TERMS_ACCEPTED → TEAM_CREATED → PARTICIPANTS_ADDED → PAYMENT_PENDING
  → PAYMENT_SUBMITTED → PAYMENT_VERIFIED → ADMIN_REVIEW → APPROVED | REJECTED
```

Every transition is recorded in `registration_status_history` /
`payment_status_history`. Payment verification and registration approval are
separate steps performed by different permissions (`payments.verify` vs.
`registrations.approve`), matching the spec's separation-of-duties requirement.

## RBAC

Permission-based, not role-name checks. Seeded roles: `SUPER_ADMIN` (all
permissions), `ADMINISTRATOR`, `REGISTRATION_REVIEWER`, `PAYMENT_REVIEWER`,
`EVENT_MANAGER`, `PARTICIPANT`. Permissions are enforced in Express middleware
(`requirePermission`) — frontend permission checks (`useAuth().hasPermission`)
are UI-visibility only, never the source of truth.

## What's intentionally minimal in this pass

- **CTFd sync** is a stubbed, isolated integration (`server/src/modules/ctfd`)
  that never blocks approval — the `/teams/join` endpoint shape must be
  verified against a live CTFd instance before it's relied on.
- **Notifications** are in-app only; email is a documented future channel.
- **Reports** export CSV; Excel/PDF export are not implemented.
- Automated test coverage is minimal by design for this pass — the workflow
  was verified end-to-end via direct API calls (signup → terms → team →
  participants → payment → verification → approval) during development.
