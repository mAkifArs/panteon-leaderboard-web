# ADR-001: Vite SPA with React 19, Tailwind, Zustand

- **Status:** Accepted
- **Date:** 2026-04-24
- **Deciders:** Mehmet Akif Arslan
- **Tags:** #frontend #stack

## Context

The brief asks for a React frontend that consumes the leaderboard
API. There is no SEO requirement, no marketing pages, no SSR need.
The user lands on the app and sees a leaderboard — that is the
whole product surface.

## Decision

We ship a **Vite + React 19 + TypeScript SPA**, styled with
**Tailwind CSS**, state managed by **Zustand**, deployed to
Vercel as static assets.

## Consequences

### Positive

- Vite cold start under a second, HMR sub-100ms — fastest feedback
  loop for UI iteration.
- Static deploy means no server cost on the frontend, just CDN.
- React 19 + the React Compiler eliminates most manual memoisation —
  we can skip the `useMemo`/`useCallback` boilerplate.
- Tailwind keeps the design system collapsed into one config file.
- Zustand keeps state local-first; selectors give granular
  re-renders.

### Negative

- No SSR. If we ever needed crawlable leaderboard pages, we'd have
  to migrate. Not a current requirement.
- Bundle size discipline is on us — no framework-level splitting.

### Neutral

- TypeScript strict mode catches issues early but slows initial
  scaffolding by ~10%.

## Alternatives Considered

### Alternative A: Next.js App Router

More structure out of the box, SSR available if needed. Rejected
because we don't need SSR and the App Router adds concepts
(server components, route groups) that don't earn their cost on
a single-screen app.

### Alternative B: Remix

Similar reasoning — SSR-first framework on a non-SSR product.

### Alternative C: Plain CRA / Webpack

Slow dev loop, no React 19 alignment, deprecated tooling.

## AI involvement

Claude was asked to enumerate trade-offs across Vite / Next /
Remix for this specific shape (single-screen, no SEO, polling-based
data). It surfaced the same conclusion I reached independently —
Vite SPA wins on simplicity. Decision is mine; the comparison
table came faster with AI.

## References

- API repo `AI_WORKFLOW.md` for the global stack philosophy.
- ADR-002 (Zustand over Context).
- ADR-003 (polling over WebSockets).
