# ADR-017: App-level error boundary

- **Status:** Accepted
- **Date:** 2026-05-02
- **Deciders:** Mehmet Akif Arslan
- **Tags:** #frontend #components #error-handling

## Context

The app had no error boundary anywhere. A render-time exception —
a polling reducer kink, a React Compiler invariant slip, an
unmodeled prop shape — would unmount the whole tree and leave a
white screen. There is no recovery path the user can act on, no
log line beyond whatever React itself prints to the console.

API errors are a separate concern and already handled. Network
failures (4xx/5xx, parse errors) flow through `apiGet` →
`useLeaderboardView`'s `error` state, and the consuming components
(`LeaderboardList`, `OwnRankCluster`, `UserPicker`) render local
`ErrorState` views with `role="alert"`. Polling retries every
tick, so transient API errors self-heal. None of that helps when
a render itself throws.

The gap is small in absolute risk — most renders don't throw —
but the failure mode is the worst kind: silent, mysterious, and
indistinguishable from a hard crash.

## Decision

Wrap the entire route tree in a single `ErrorBoundary` at
`App.tsx`, between `SiteHeader` and `SiteFooter`. Header and
footer stay outside the boundary so the page chrome is still
visible during a fallback render. The boundary takes a
`fallback: (error, reset) => ReactNode` render prop and the
app-level fallback (`AppErrorFallback`, inline in `App.tsx`)
renders:

- a `<main role="alert">` landmark
- "Something went wrong" heading (panteon-fg)
- the thrown error message (mono, muted)
- a "Try again" button wired to `reset()`, which clears the
  boundary's error state and re-mounts the children

`componentDidCatch` is a single `console.error` for now; it is
the explicit hook point for telemetry (Sentry or equivalent)
once telemetry lands. The class component itself is ~30 lines —
React's boundary API is class-only, so we accept the one
non-hook component in an otherwise hooks-only codebase.

## Consequences

### Positive

- A render exception is now a visible, recoverable event instead
  of a white screen. The user can read the error and click "Try
  again" without losing the header/footer.
- Single funnel for telemetry. When Sentry (or similar) ships,
  we wire it in `ErrorBoundary.componentDidCatch` and every
  render exception in the app routes there.
- The fallback API (`(error, reset) => ReactNode`) is a render
  prop, so per-section boundaries can ship later with their own
  fallback shapes without changing the boundary class itself.

### Negative

- One class component in a hooks-only codebase. Unavoidable —
  React has no hook-equivalent for error boundaries. Documented
  here so future readers don't reach for a hooks rewrite.
- A throw inside the fallback itself is unrecoverable (the
  boundary has already caught the original error and is rendering
  the fallback; another throw bubbles out of the boundary).
  Acceptable — keep `AppErrorFallback` simple, no async, no
  thrown-prone code.

### Neutral

- Does not affect API error paths. `useLeaderboardView`'s
  `error` state still surfaces network failures through its
  consumers — the boundary only kicks in for render exceptions.
- Cypress smoke test (added 2026-05-03): a small
  `ForceErrorGate` reads `?force_error=throw` from the URL and
  throws on render, so Cypress can hit `/leaderboard?force_error=throw`
  and assert that `AppErrorFallback` claims the route region while
  header/footer stay mounted. This was originally rejected as
  "more harness than signal" but the gate is a 6-line render-time
  query check — cheap enough that the e2e proof of "boundary is
  actually wired in App.tsx, not just unit-tested in isolation"
  earns its keep. The unit suite (3 cases: passthrough,
  catch-and-render, reset-and-recover) still owns the contract.

## Alternatives Considered

### Alternative A: No boundary

The status quo. Rejected — a white screen on a render exception
is unacceptable for an app that polls and re-renders on every
tick. The blast radius is the entire SPA.

### Alternative B: Per-route boundaries

`<Route path="/leaderboard" element={<ErrorBoundary>...<LeaderboardPage/>...</ErrorBoundary>}>`
for every route. Rejected — there are two routes and a 404 entry
today. Multiplying boundaries fragments the fallback UX (the user
sees a different shape depending on where they were) for no
isolation benefit. If a future feature needs section-isolated
error handling (e.g. a tournament panel that should fail
independently of the leaderboard), nest a boundary at that
section. The render-prop fallback API supports this without any
change to `ErrorBoundary` itself.

### Alternative C: Per-section boundaries inside `LeaderboardPage`

Wrap `UserPicker`, `Podium`, `LeaderboardList`, `OwnRankCluster`,
and `StickySelfBar` each in their own boundary so a single
component's render exception only takes down its own slice.
Rejected for now — the leaderboard sections share state (the
polling registry result) and isolating them would mean a
sub-section keeps showing stale data while another shows a
fallback, which is more confusing than informative. Reconsider
if a future section is genuinely independent (a side widget,
an embedded ad, a separate feed).

### Alternative D: `react-error-boundary` package

The community-standard hook-styled wrapper around the same
React class API. Rejected — minimal-dependency policy
(CLAUDE.md). Our boundary is ~30 lines; a dependency that
wraps the same API would be more maintenance overhead than
saving.

## AI involvement

Claude proposed the boundary during a cross-cutting audit that
mapped what the app didn't have alongside what it does. Placement
(App-level only, not per-section) and the explicit "no Cypress
test" call were the user's after the audit. Decision is mine.

## References

- `src/shared/components/ErrorBoundary/ErrorBoundary.tsx` — the
  class component
- `src/App.tsx` — boundary wraps `<Routes>`, `AppErrorFallback`
  inline alongside `NotFound`
- ADR-005 — thin fetch over TanStack Query, the parent decision
  that left API error handling in component-local state
- ADR-016 — `shared/components/` is the right home for a
  cross-feature primitive like this one
