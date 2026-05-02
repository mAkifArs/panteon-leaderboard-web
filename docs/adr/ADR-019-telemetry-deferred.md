# ADR-019: Telemetry / error tracking deferred

- **Status:** Accepted (revisit when prod traffic begins)
- **Date:** 2026-05-02
- **Deciders:** Mehmet Akif Arslan
- **Tags:** #frontend #observability #scope

## Context

ADR-017 added an app-level `ErrorBoundary` whose `componentDidCatch`
is the explicit single hook point for telemetry — Sentry, Datadog,
self-hosted log endpoint, anything. The boundary today logs to
`console.error` and stops there.

The natural next step would be wiring that hook to Sentry (or
equivalent) so render exceptions become a notification, not a stale
browser tab nobody noticed. We are deliberately **not** doing that
now.

The framing matters: this app is a case-study deployment kept open
for the duration of a review window. There is no real production
traffic, no users tripping over edge cases, no on-call rotation that
would benefit from a paged alert. Adding a telemetry vendor in this
context buys:

- a dashboard with zero meaningful events
- a dependency that needs a DSN, an env var, and a build-time bundle
- an account/ownership model that outlives the review

…in exchange for solving a problem that doesn't exist yet.

## Decision

Defer telemetry/error-tracking integration. Keep the hook point
(`ErrorBoundary.componentDidCatch` in
`src/shared/components/ErrorBoundary/ErrorBoundary.tsx`) so the
integration, when it happens, is a surgical change at one site and
not a refactor of the boundary itself.

Concretely:

- No telemetry SDK is added to dependencies.
- `componentDidCatch` continues to write to `console.error` with
  the error and `componentStack`.
- The same applies to `apiGet` 4xx/5xx surfaces — no out-of-band
  logging, the structured `ApiError` is the in-app contract.
- Backend logging is its own concern (pino in
  `panteon-leaderboard-api`); this ADR is frontend-only.

The decision is recorded so the absence of telemetry reads as a
considered choice, not an oversight a reviewer has to interpret.

## Consequences

### Positive

- One fewer dependency to onboard, version-bump, and audit during
  the review window.
- No DSN/secret to manage in `.env*`, no build-time conditional
  for "telemetry on/off."
- The hook point is documented and tested (ADR-017's boundary test
  already exercises the catch path), so adding a vendor later is
  a focused diff rather than a green-field implementation.

### Negative

- A render exception during the review window goes unobserved
  unless someone has the devtools console open. Acceptable given
  the demo nature of the deployment; the failure mode is "we miss
  one bug" not "we ship a bug to users."
- "Reconsider when prod begins" relies on remembering this ADR
  exists. The Revisit triggers below are the durable answer to
  that.

### Neutral

- Nothing in the runtime depends on a telemetry transport, so the
  app behaves identically whether the integration ships next week
  or next quarter.

## Alternatives Considered

### Alternative A: Wire Sentry (or Datadog/PostHog) now

A free Sentry tier covers a hobby project's volume; the SDK is
~30 lines of init and one `captureException` in `componentDidCatch`.
Rejected — bundle cost (Sentry SDK is non-trivial), env-var sprawl,
and an account whose lifecycle I don't want to manage past the
review. The signal-to-noise during the review window is essentially
zero anyway.

### Alternative B: Self-hosted error log endpoint on the API

`POST /client-errors` on `panteon-leaderboard-api`, the boundary
posts the error there, backend logs it via pino. Rejected — the
backend's scope is leaderboard data, not generic frontend error
collection. Designing a reverse-direction logging contract (auth,
rate limits, retention) for an audience of zero is the wrong shape.

### Alternative C: Keep console-only, no ADR

Just don't write the integration; let the hook point speak for
itself. Rejected — without this ADR, the absence reads as "they
forgot." The point of ADR-019 is to convert a non-decision into
an explicit one.

## Revisit triggers

Re-open this ADR when one of the following holds:

1. The deployment graduates from review demo to a long-lived
   environment (beta program, soft launch, anything with real users).
2. A render exception slips through and only gets caught by
   someone manually noticing the fallback UI — that's the moment
   "no telemetry" becomes a real cost.
3. A second app under the same brand needs a shared error sink —
   then the integration is shared infrastructure, not a per-app
   add-on, and the math flips.

## AI involvement

Claude originally framed Sentry as a natural follow-up to the
boundary in the cross-cutting audit. The "case-study window, no
real traffic" reframing — and the choice to record the deferral
as an ADR rather than a TODO — was the user's. Claude wrote the
draft.

## References

- `src/shared/components/ErrorBoundary/ErrorBoundary.tsx` — the
  hook point that telemetry would attach to.
- ADR-017 — app-level error boundary; this ADR is the deliberate
  pause on its natural next step.
- `docs/perf-monitoring.md` — same shape of decision (react-scan
  in dev, no CI gate yet) for performance monitoring.
