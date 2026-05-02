# Panteon Leaderboard — Frontend

Weekly leaderboard SPA built for the Panteon case study. React 19 +
Vite + TypeScript, polled against a separate Fastify API
([panteon-leaderboard-api](../panteon-leaderboard-api)).

The work is intentionally over-documented for the review — the
**`docs/adr/`** folder is the project's memory. If you have ten
minutes, that's where to spend them.

## Quick start

```bash
bun install
cp .env.example .env.local         # adjust if the API isn't on :3001
bun run dev                         # http://localhost:5173
```

## Commands

| Command | What it does |
|---|---|
| `bun run dev` | Vite dev server (port 5173) |
| `bun run build` | Type-check + production build |
| `bun run preview` | Serve the production build (port 4173) |
| `bun run typecheck` | `tsc -b --noEmit`, strict mode |
| `bun run test` | Vitest — 23 files, 129 unit/component cases |
| `bun run e2e` | Cypress — 16 flows against `vite preview` |
| `bun run lint` | ESLint, `--max-warnings 0` |
| `bun run format` | Prettier write |

## What you're looking at

```
src/
  pages/                # thin route entries (HomePage, LeaderboardPage)
  features/leaderboard/ # implementation modules — components / hooks / lib
  shared/               # cross-feature primitives — api, components, hooks, lib
  App.tsx, main.tsx
docs/adr/               # 19 architecture decisions
docs/case/              # the case-study brief this work answers
```

ADR-016 explains the role-based split (`pages` / `features` / `shared`)
and why it was preferred over feature-internal `pages/`.

## Where to start reading the ADRs

If you want the design narrative in roughly that order:

1. **ADR-016** — folder structure, and how it evolved same-day
2. **ADR-014** — why we dropped Zustand once the polling registry
   was doing the job
3. **ADR-003** + backend ADR-008 — polling over WebSockets,
   stateless invariant
4. **ADR-004** — the polling hook design (`src/shared/hooks/usePolling.ts`,
   the heart of the app)
5. **ADR-012** — referential stability for polling responses
   (`src/shared/api/structural-equal.ts`); pairs with ADR-004 to keep
   React Compiler memoisation valid across no-op ticks
6. **ADR-017** + **ADR-018** — error boundary + offline awareness
7. **ADR-019** — telemetry deliberately deferred for the review window

When a decision evolves, the new ADR supersedes the old one and the
chain stays visible: ADR-002 → ADR-014 (Zustand drop), ADR-013 →
ADR-015 (full top-100 render). ADR-016 is itself a same-day revision.

## Configuration

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Origin of the leaderboard API | `http://localhost:3001` |

For a deployment, point `VITE_API_BASE_URL` at the deployed API
origin (set it on the host, or via a `.env.production` file). The
frontend is fully static — any CDN or static host works.

## Tech stack

- React 19 + Vite 6 + TypeScript (strict, `exactOptionalPropertyTypes`,
  zero `any`)
- React Compiler 1.0 (`vite.config.ts:5`)
- Tailwind CSS, design tokens centralised in `tailwind.config.ts`
- React Hook Form + Zod for forms
- Vitest + React Testing Library for unit/component
- Cypress for end-to-end
- bun for install/run

State model is intentionally minimal: server data through the
module-scoped polling registry (ADR-004), user identity through URL
+ `localStorage` (ADR-006), UI state through local `useState`. No
Zustand, no Context for shared state. ADR-014 has the full
walkthrough.

## Tests

```bash
bun run test    # 23 files, 129 unit/component cases
bun run e2e     # 16 Cypress flows, runs against vite preview build
```

E2E covers the rank-tier matrix (top-3, list edge, mid-tier,
outside-100, last player), polling cadence + visibility/online
back-off, picker keyboard a11y, score formatting, and the App-level
ErrorBoundary + OfflineIndicator integrations.

## Performance posture

`react-scan` is wired into `src/main.tsx:7-11` behind a DEV guard for
re-render auditing during development. There is no CI render-cost
gate — the rationale (and when one would be worth building) is in
[`docs/perf-monitoring.md`](docs/perf-monitoring.md).

## Backend

The API lives in a separate repository:
[panteon-leaderboard-api](../panteon-leaderboard-api). The split is
covered by backend ADR-002 (separate repos) and backend ADR-008
(polling-over-websockets, mirroring frontend ADR-003). The frontend
treats the API as a stateless poll target; all money math, prize
distribution, and idempotency live server-side per the case-study
constraints.
