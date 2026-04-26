# ADR-008: Four-layer test strategy — unit, component, e2e, render audit

- **Status:** Accepted
- **Date:** 2026-04-26
- **Deciders:** Mehmet Akif Arslan
- **Tags:** #frontend #testing #performance

## Context

The frontend has no database to integration-test against, but it
has its own categories of bugs — re-render storms, accessibility
holes, polling logic that fires twice, layout regressions on
mobile. A single "vitest" target doesn't cover any of those well.

The backend repo runs three test layers (unit / integration / load).
We mirror the *idea* — separate concerns, separate tools — without
copying the *layers*.

## Decision

Four independent layers, each with a clear blast radius:

| Layer            | Tool             | Scope                                      | Where                |
|------------------|------------------|--------------------------------------------|----------------------|
| Unit             | Vitest           | Pure functions, hooks via `renderHook`     | Co-located `*.test.ts`|
| Component        | Vitest + RTL     | One component, mocked data, a11y assertions| Co-located `*.test.tsx`|
| End-to-end       | Cypress          | Real browser, real API (or `cy.intercept` stubs) | `cypress/e2e/`  |
| Re-render audit  | react-scan + Cypress | Manual + scripted check on the leaderboard tick | `cypress/e2e/render-audit.cy.ts` |

Rules:

- **Unit** tests do not render React. If you need to render to
  test it, it's a component test.
- **Component** tests assert behaviour and a11y, never visual
  pixels. Visual regressions go to Playwright snapshots.
- **E2E** runs against `vite preview` (orchestrated by
  `start-server-and-test`) hitting `cy.intercept`-stubbed
  fixtures by default; setting `CYPRESS_BASE_URL` points at the
  deployed staging API for the smoke pass.
- **Re-render audit** is the unique-to-this-app layer. It opens
  the page with `react-scan` instrumented and asserts that on a
  poll tick where one row's score changed, exactly one row
  re-rendered. This is how we keep ADR-002's promise honest.

## Consequences

### Positive

- Each layer answers one question. No "is this a unit or e2e
  test?" debates.
- Re-render audit catches Zustand selector mistakes that no other
  layer would — a cheap O(1) row-update can silently regress
  to O(N) and still pass every other test.
- Layers run in parallel in CI; failed layer is obvious from the
  job name.

### Negative

- Four configs to maintain (`vitest.config.ts`, `playwright.config.ts`,
  the react-scan harness, the mocked-fetch fixture). Mitigated by
  keeping each under 50 lines.
- The render-audit layer is bespoke. If `react-scan`'s
  programmatic API changes we have to adapt.

### Neutral

- The case brief asks for "code quality" but doesn't mandate a
  test count. We aim for ~80% line coverage on logic, not on
  components — components are tested for behaviour, coverage is a
  poor proxy.

## Alternatives Considered

### Alternative A: Vitest only, no E2E

Faster CI, but no real-browser smoke test. The leaderboard's
mobile-vs-desktop sticky-cluster asymmetry is exactly the kind
of bug only a real viewport catches. Rejected.

### Alternative B: Playwright instead of Cypress

Broader browser matrix (WebKit), better trace viewer, faster
parallelisation. Rejected for *this delivery window* on
familiarity grounds — every prior project in the workspace
(`onewell-case-study`, `insider-one-case`) uses Cypress, so
ramp-up cost is zero. We accept losing real-Safari coverage and
will smoke-test mobile Safari manually on a device per the
TIMING.md 30 Apr slot. Playwright is the next-project choice,
not this-project's.

### Alternative C: Skip the render-audit layer

Cheaper to maintain. Rejected because ADR-002 made an explicit
performance promise (one row re-render per tick) and there's no
*other* way to verify it stays true as the codebase grows.

## AI involvement

Claude's first draft proposed two layers (unit + e2e). The
render-audit layer was added after a Discussion: "what kind of
regression would slip past both?" Selector misuse was the answer.
Decision is mine; the gap analysis came faster with AI.

A second pass swapped Playwright → Cypress after a Discussion
about delivery-window cost vs. tool-novelty cost. Claude
initially defended Playwright on technical merits; pushback was
"every other project in the workspace runs Cypress, the marginal
WebKit coverage is not worth a new mental model in an 8-day
build". Decision is mine; the trade-off framing came out of the
Discussion.

## References

- ADR-002 (Zustand over Context) — what the audit verifies.
- `.claude/skills/testing-patterns/SKILL.md` — unit + component conventions.
- `.claude/skills/e2e-patterns/SKILL.md` — Playwright conventions.
