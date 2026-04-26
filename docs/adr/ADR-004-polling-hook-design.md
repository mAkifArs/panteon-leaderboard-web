# ADR-004: Visibility-aware polling hook with single timer per resource

- **Status:** Accepted
- **Date:** 2026-04-26
- **Deciders:** Mehmet Akif Arslan
- **Tags:** #frontend #data-fetching #performance

## Context

ADR-003 settled the *strategy* (polling, not WebSockets). This ADR
settles the *implementation*: how the hook is shaped, where the
timer lives, and what happens when the tab is hidden, the network
flakes, or the same hook is mounted twice.

The leaderboard screen consumes three independent resources at the
same cadence:

1. `GET /leaderboard/top` (top-100 list)
2. `GET /leaderboard/me/:userId` (own-rank cluster)
3. `GET /pool/:isoWeek` (live prize pool)

A naive "one `setInterval` per `useEffect`" pattern would mean three
timers per resource per mounted component, drifting independently.
With React 19 strict-mode double-mounting in dev, that doubles
again. We need a single source of truth per resource.

## Decision

We ship one **`usePolling<T>(fetcher, { intervalMs, key })`** hook
that:

- Stores the timer + last result on a **module-scoped registry keyed
  by `key`** so multiple components asking for the same resource
  share one timer and one network request.
- Pauses on `document.visibilityState === 'hidden'`, fires an
  immediate refetch on `visibilitychange → 'visible'`.
- Cancels in-flight fetches on unmount via `AbortController`.
- Surfaces `{ data, error, isLoading, lastUpdatedAt }` — never the
  raw fetch primitive.

`useLeaderboard()`, `useOwnRank(userId)`, `usePool(isoWeek)` are
thin wrappers over `usePolling` with hard-coded keys and fetchers.
Components import the wrappers, never `usePolling` directly.

## Consequences

### Positive

- One timer per resource regardless of mount count. Verified via
  `react-scan` and a manual two-tab-of-the-same-component test.
- Visibility-aware pausing falls out of the registry; no
  per-component listener.
- Components stay declarative — no timer plumbing in JSX.

### Negative

- Module-scoped registry is a small piece of global state outside
  Zustand. Acceptable because it's *cache-of-server-state*, not
  app state, and it's keyed (no leakage across resources).
- Test isolation needs care: the registry survives between tests
  unless explicitly reset. We export a `__resetPollingRegistry()`
  for `beforeEach`.

### Neutral

- The hook is hand-rolled, ~80 lines. TanStack Query would do this
  for free but we rejected it in ADR-005 on dependency-surface
  grounds.

## Alternatives Considered

### Alternative A: One `setInterval` per `useEffect`, no sharing

Simplest possible implementation. Rejected because the leaderboard
page mounts the cluster cell inside `<LeaderboardList>` *and*
inside `<OwnRankCluster>` — the same data fetched twice, two
timers, double the request load.

### Alternative B: Zustand store with a single timer driven by the store

Works, but conflates server-cache state with client UI state. Forces
every consumer to subscribe to a store slice that doesn't really
belong there. Rejected on separation-of-concerns grounds.

### Alternative C: TanStack Query

Solves all of the above and more. Rejected in ADR-005; not
re-litigated here.

## AI involvement

Claude's first draft used a `useEffect` with an interval inside the
component — exactly Alternative A. Pushback: "what happens when the
own-rank cluster is rendered both in the list and as a sticky
banner?" Answer surfaced the duplicate-fetch problem and led to
the registry pattern. Decision is mine; the failure-mode list came
faster with AI.

## References

- ADR-003 (polling over WebSockets) — the strategy.
- ADR-005 (thin fetch over TanStack Query) — why we hand-roll.
- `.claude/skills/react-patterns/SKILL.md` — selector + hook discipline.
