# Panteon Leaderboard — Frontend

[![CI](https://github.com/mAkifArs/panteon-leaderboard-web/actions/workflows/ci.yml/badge.svg)](https://github.com/mAkifArs/panteon-leaderboard-web/actions/workflows/ci.yml)

Weekly leaderboard SPA built for the Panteon case study. React 19 +
Vite + TypeScript, polled against a separate Fastify API
([panteon-leaderboard-api](https://github.com/mAkifArs/panteon-leaderboard-api)).

- **Live demo:** https://panteon-leaderboard-web.pages.dev/leaderboard — see [How to test the live demo](#how-to-test-the-live-demo) for a 90-second guided tour
- **API:** https://panteon-leaderboard-api.onrender.com

The work is intentionally over-documented for the review — the
**`docs/adr/`** folder is the project's memory. If you have ten
minutes, that's where to spend them.

## How to test the live demo

A guided tour through everything worth showing — should take about
90 seconds end-to-end. The live URL is the easiest entry point;
nothing to install.

1. Open the [live demo](https://panteon-leaderboard-web.pages.dev/leaderboard).
   You land on the **player picker** — five sample accounts spanning
   top, mid, and tail ranks, plus an intentional whale (`Player
   #whale-li`) carrying `5e18` earnings to demo the BigInt rendering
   path. Pick a **Top tier** card.
2. You're now on the leaderboard with **your row highlighted**, the
   **podium** for ranks 1–3 above the list, the **week countdown**
   ticking, and a **prize pool** card explaining the 2 % / 20-15-10-55
   split (hover the `i` icon).
3. Click **Switch player** (top right of the hero) → pick a **Mid
   pack** card. The "Around You" cluster slides — your row stays
   centred, the 3-above / 2-below neighbours shift around it.
4. **Scroll down past your row.** A **sticky self-bar** fades in at
   the bottom; the jump arrow points **up (↑)** because your row is
   now above the viewport. Click it — smooth scroll lands you back,
   the bar fades out. Scroll back to the top before your row and the
   arrow flips to **down (↓)**.
5. **Resize to mobile** (or DevTools mobile mode, e.g. iPhone 14).
   The desktop nav collapses into a **hamburger** — tap it for the
   side drawer. Escape, backdrop click, or any link inside dismisses
   it; focus returns to the trigger.
6. Open the **network tab**. Polling fires every **5 s**. Hide the
   tab (or run `document.dispatchEvent(new Event('visibilitychange'))`
   after setting `document.visibilityState`) — polling pauses. Bring
   the tab back — an immediate refetch fires.
7. Hit **back / forward** in the browser after switching players.
   URL state is the source of truth (`?userId=...`); history just
   works, no in-memory player slot to corrupt.
8. (Optional, code path) Read **ADR-016** then **ADR-014** then
   **ADR-004** — that's the shortest path through the architectural
   narrative. Polling-specific decisions live in **ADR-003** (why
   polling, not WebSockets), **ADR-004** (the hook design), and
   **ADR-012** (referential stability across no-op ticks).

## What you'll see

A weekly leaderboard for an idle/clicker game. Concretely:

- **Top-100 list** rendered in full (no virtualisation — measured to
  be unnecessary; see ADR-015).
- **Own-rank cluster** ("Around You"): exactly 6 rows — the player's
  own row plus 3 above and 2 below. The window slides at the edges
  so composition shifts but the row count never does.
- **Sticky self-bar** that appears when the player's row scrolls out
  of view, with a **directional jump arrow** (↑/↓) pointing toward
  wherever the row currently sits.
- **Podium** for ranks 1–3 with crown, glow, and per-rank medal
  border colours.
- **Live pulse** + **week countdown** so the page feels alive —
  the timer ticks down to next Monday 00:00 UTC reset.
- **Prize pool** stat card with the distribution rule (2% pool,
  20/15/10/55% split) explained inline.
- **Demo player picker** at `/leaderboard` (no auth) with sample
  players spanning top/mid/tail ranks. The intentional "whale" entry
  (`Player #whale-li`) carries `5e18` earnings to exercise the
  BigInt rendering path end-to-end.
- **Mobile nav drawer** with hamburger trigger, focus management,
  body scroll lock, escape close, and route-change auto-dismiss.
- **Error boundary** at the App level with a recover button, plus
  an **offline indicator** that pauses polling when the browser
  loses connectivity.

## Quick start

```bash
bun install
cp .env.example .env.local         # defaults to the deployed API
bun run dev                         # http://localhost:5173
```

`.env.example` points `VITE_API_BASE_URL` at
<https://panteon-leaderboard-api.onrender.com> so a fresh clone runs
end-to-end without standing up the backend locally. To use a local
backend instead, edit `.env.local` to `http://localhost:3001` after
starting [the API repo](https://github.com/mAkifArs/panteon-leaderboard-api).

## Commands

| Command | What it does |
|---|---|
| `bun run dev` | Vite dev server (port 5173) |
| `bun run build` | Type-check + production build |
| `bun run preview` | Serve the production build (port 4173) |
| `bun run typecheck` | `tsc -b --noEmit`, strict mode |
| `bun run test` | Vitest — 27 files, 156 unit/component cases |
| `bun run e2e` | Cypress — 16 flows, builds in test mode and runs against `vite preview` |
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
public/                 # static assets — favicon, brand images, _redirects
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

## Deployment

The live demo runs on **Cloudflare Pages** with `bun run build` as
the build command and `dist/` as the output. SPA fallback is
configured via `public/_redirects` (`/*  /index.html  200`) so
`BrowserRouter` deep links survive a refresh on the static host.

The backend (Render free tier) is kept warm by a separate cron-ping
worker so the first request doesn't pay the cold-start tax. CORS on
the API is currently open to wildcard for the review window; it can
be tightened to the Pages origin without redeploying the frontend.

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
Redux, no Context for shared state. ADR-014 has the full walkthrough.

## Tests

```bash
bun run test    # 27 files, 156 unit/component cases
bun run e2e     # 16 Cypress flows, against a test-mode vite preview build
```

E2E covers the rank-tier matrix (top-3, list edge, mid-tier,
outside-100, last player), polling cadence + visibility/online
back-off, picker keyboard a11y, score formatting, the directional
sticky-bar arrow, and the App-level ErrorBoundary + OfflineIndicator
integrations.

The Cypress suite runs against `vite build --mode test` rather than
the production build so the `?force_error=throw` sentinel that
exercises the App-level error boundary stays armed in test runs but
is **not** reachable on the deployed prod build.

## Performance posture

`react-scan` is wired into `src/main.tsx:7-11` behind a DEV guard for
re-render auditing during development; the dynamic `import('react-scan')`
is tree-shaken out of the production bundle. There is no CI
render-cost gate — the rationale (and when one would be worth
building) is in [`docs/perf-monitoring.md`](docs/perf-monitoring.md).

## Backend

The API lives in a separate repository:
[panteon-leaderboard-api](https://github.com/mAkifArs/panteon-leaderboard-api),
deployed at <https://panteon-leaderboard-api.onrender.com>. The split
is covered by backend ADR-002 (separate repos) and backend ADR-008
(polling-over-websockets, mirroring frontend ADR-003). The frontend
treats the API as a stateless poll target; **all money math, prize
distribution, and idempotency live server-side** per the case-study
constraints — the frontend reads scores as opaque BigInt-safe strings
and renders them with `Intl.NumberFormat`, never with `Number`.

## AI-assisted workflow

Tooling, where AI helped, and where I made my own calls is in
[`AI_WORKFLOW.md`](AI_WORKFLOW.md). The companion document in the
backend repo covers the API side. The 19 ADRs in `docs/adr/` are
the durable trace of what was decided and why.
