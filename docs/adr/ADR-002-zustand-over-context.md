# ADR-002: Zustand for shared state, not React Context

- **Status:** Accepted
- **Date:** 2026-04-24
- **Deciders:** Mehmet Akif Arslan
- **Tags:** #frontend #state-management #performance

## Context

The leaderboard renders ~100 rows that update on every poll tick
(5 seconds). Each row reads a different slice of state — its own
entry, the player's rank, neighbour positions. We need a state
container that gives every component a granular subscription, not
a global re-render on every change.

## Decision

We use **Zustand** as the single shared-state container. Components
subscribe via selector functions: `useLeaderboardStore(s => s.x)`.
Never `useLeaderboardStore(s => s)` — that subscribes to the whole
store and defeats the purpose.

## Consequences

### Positive

- Each row re-renders only when its own data changes. Verified
  with react-scan: 1 re-render per changed row, not 100.
- API surface is tiny — `create()`, `set()`, `get()`. No reducers,
  no actions, no providers.
- Persist middleware available for `localStorage` if we need it
  (we currently don't).

### Negative

- Less ecosystem than Redux. Not relevant at this scope.
- Engineers used to Context patterns need to learn selector
  discipline. Mitigated by the `react-patterns` skill, which
  flags `useStore(s => s)` at review time.

### Neutral

- DevTools middleware is available but not enabled by default.
  Will turn on if debugging gets painful.

## Alternatives Considered

### Alternative A: React Context

Naive Context with the full leaderboard state would re-render
every consumer on every poll tick. 100 rows × 1 tick / 5s =
20 re-renders/second across the tree, most of them wasted.

Splitting into multiple Contexts (one per slice) is possible but
ergonomically worse than Zustand selectors and not measurably
faster.

### Alternative B: Redux Toolkit

Overkill for this scope. RTK Query would be nice for data
fetching but we have a polling hook that does the job in 30
lines. Not worth the boilerplate.

### Alternative C: TanStack Query (React Query)

A fair option for the server-state half. We could combine it with
Zustand for client-only state. Rejected for this case to keep the
dependency surface minimal — the polling hook covers what we
need. If the app grew (cache invalidation across views, optimistic
updates), TanStack Query would earn its weight.

## AI involvement

Claude initially proposed React Context. Pushback was on
performance grounds (re-render cascade), confirmed with a
react-scan demo. The Decision is mine; the alternatives
enumeration was a Discussion with Claude.

## References

- ADR-001 (stack choice).
- `.claude/skills/react-patterns/SKILL.md` — selector discipline.
