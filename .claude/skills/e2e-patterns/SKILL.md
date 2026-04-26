---
name: e2e-patterns
description: Playwright E2E conventions for the leaderboard web app. Loads when editing files in e2e/ or playwright.config.ts. Covers selector strategy, test scope, network handling.
---

# E2E Patterns — Playwright

## Scope

E2E covers **user-visible flows that span multiple components
and at least one network call.** If a behaviour can be verified
in a component test, it does not belong here.

## Flows we cover

1. **Top-100 view.** Page loads, list renders, polling refreshes
   the data.
2. **Own-rank cluster.** With a known seed user, navigate to the
   page, assert the cluster pins to the bottom (desktop) or top
   (mobile), assert exactly 6 rows.
3. **Reset countdown.** Tick, format, no client-clock drift.
4. **Tab visibility.** Switch tabs, return, see immediate refresh.

That is the whole list. We do not E2E-test individual component
states — those are component tests.

## Selectors

Priority order:

1. `getByRole('button', { name: /rank/i })` — accessibility-first.
2. `getByLabelText(/ranked first/i)` — semantic labels.
3. `getByText(/^Mehmet Arslan$/)` — when content is stable.
4. `getByTestId('leaderboard-list')` — last resort for elements
   without semantic identity.

CSS selectors (`.leaderboard-row`) are forbidden — they couple
tests to styling.

## Network

- Run against a real API (local or staging). No request mocking
  in E2E.
- If staging is down, the E2E run is a blocker, not "skip and
  ship".
- Use Playwright's `page.waitForResponse` for polling
  assertions, not arbitrary `setTimeout`.

## Test data

- One seeded test user with a known rank, used across all
  E2E flows.
- The backend exposes a `/test/seed` endpoint behind an
  environment flag for E2E setup. Never hit in production.

## Mobile

- Run the cluster-position test in two viewports: desktop
  (1280) and mobile (375). The sticky position differs (bottom
  vs top) and the asymmetry is intentional.

## Flake policy

- A flaky test is broken. Quarantining is a 24-hour decision,
  not a long-term plan.
- Retries are not a substitute for fixing the flake.
- If a test passes on rerun without a code change, treat it as
  a bug in the test or in the system, not noise.
