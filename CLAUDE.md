# CLAUDE.md — Panteon Leaderboard Web

Project-level rules for Claude Code in the **frontend** repo. The
global `~/Documents/GitHub/CLAUDE.md` and the backend repo's
philosophy still apply; this file adds the frontend-specific layer.

## What this project is

React + Vite + TypeScript SPA that consumes the leaderboard API
(`panteon-leaderboard-api`). Brief is in `docs/case/case-en.html`.
Backend is a separate repo per ADR-002 in the API repo.

## Stack

- React 19 + Vite + TypeScript (strict)
- Tailwind CSS for styling, design tokens centralised in `tailwind.config.ts`
- Zustand for state, granular selectors only
- React Hook Form + Zod for any form
- Vitest for unit/component tests, Playwright for E2E
- react-scan in dev to audit re-renders
- bun as package manager

## Non-negotiable invariants

1. **Money is read as a string from the API and rendered with
   Intl.NumberFormat.** No client-side BigInt math, no rounding,
   no currency arithmetic in the frontend. The API ships values
   already finalised.
2. **The own-rank cluster is exactly 6 rows.** When the player is
   near the top or bottom, the window slides — composition shifts,
   row count does not.
3. **Polling, not WebSockets.** 5 second interval, paused on
   `document.visibilityState === 'hidden'`, immediate refetch on
   return. ADR-003.
4. **Zustand selectors are granular.** Never `useStore(s => s)` —
   subscribe to the slice you read, nothing more.
5. **Accessibility is not optional.** Every interactive element is
   a real button or link, focus styles visible, screen-reader
   labels for rank context. The `a11y-patterns` skill enforces this
   at review time.
6. **No `any` in committed code.** If a type is unknown, it is
   `unknown` and narrowed before use.

## How we work together

Every non-trivial task runs in three phases, in this order:

1. **Discussion.** Talk through the goal and trade-offs first.
   Component API design, state shape, fetching strategy — all
   discussed before code.
2. **Decision.** Single sentence: _"We will do X because Y."_
   Architectural calls also get an ADR via `/adr <slug>`.
3. **Integration.** Only now do we write code. Tests verify
   behaviour, commits reference the ADR.

I use plan mode often, but Discussion still runs first. Plan mode
answers "how"; Discussion answers "why" and "whether".

I need to understand the code we ship. If I cannot defend a
component's API in a review, it does not ship.

## Commands

```
bun install
bun run dev              # Vite dev server
bun run build            # Production build
bun run preview          # Preview production build
bun run typecheck
bun run test             # Vitest
bun run e2e              # Playwright
bun run lint
bun run format
```

## Workflow rules

- Before every commit: `/review-changes`.
- Before every commit to `main` and before delivery: `/check-case`.
- New architectural decision → `/adr <slug>`, write it before code.
- New component → `/component-scaffold <Name>`. It enforces the
  folder structure, test, and story conventions.
- React conventions auto-load from `react-patterns` when editing
  `.tsx`. Same for `testing-patterns`, `e2e-patterns`, `a11y-patterns`.

## Things we don't do

- No Redux, no Context for shared state. Zustand only.
- No `useEffect` for data fetching when a hook (`useLeaderboard`,
  `useOwnRank`) can encapsulate it.
- No raw hex colours in JSX. Tailwind tokens only.
- No inline styles. Tailwind utility classes only.
- No `<div onClick>`. Use real semantic elements.
- No premature virtualisation. Top-100 renders fine without
  react-window; we only virtualise if measured to be slow.
- No backend logic in this repo. API does the math; we render.

## Commits

- Never add `Co-Authored-By` footers.
- Always ask before running `git commit`.
