---
name: testing-patterns
description: Frontend testing conventions for the leaderboard web app. Loads when editing test files or src/ files that should be tested. Defines what we test, how we test it, and what we deliberately don't test.
---

# Testing Patterns — Leaderboard Web

This skill defines what tests look like in **this specific
project**. The base model knows Vitest and Playwright; this
file teaches the conventions.

## Layers

| Layer       | Tool         | What it covers                                           |
| ----------- | ------------ | -------------------------------------------------------- |
| Unit        | Vitest       | Pure functions (rank-window math, formatters)            |
| Component   | Vitest + RTL | Single component renders, prop variants, a11y roles      |
| Integration | Vitest       | Hook + Zustand store, polling lifecycle                  |
| E2E         | Playwright   | One full user flow per page (top-100 → own-rank cluster) |

## What we always test

- **Own-rank cluster shifting window.** All five edge cases:
  rank 1, rank 2, rank 50, second-to-last, last. The cluster
  is always 6 rows.
- **Rank formatting.** Top 3 use special badges; ranks 4–100
  use the top-100 style; 101+ use the plain style.
- **Polling lifecycle.** Pauses on `visibilitychange` to hidden;
  refetches immediately on return.
- **Error boundary fallback.** Render error in a row does not
  crash the whole list.
- **Money formatting.** Always renders the API string via
  `Intl.NumberFormat`, never recomputes locally.

## What we deliberately don't test

- Snapshot tests — they catch rendering changes but tell us
  nothing about behaviour. Avoid unless the snapshot is a
  small, stable, intentional contract.
- Implementation details — `expect(setState).toHaveBeenCalled()`
  is a smell. Test what the user sees, not what the code does.
- Trivial getters / pass-throughs.

## Naming

```
LeaderboardRow.test.tsx        # component / unit
useLeaderboard.test.ts          # hook integration
e2e/leaderboard.spec.ts         # Playwright
```

## Component test shape

Test the user-visible behaviour:

```tsx
test('shows gold badge for rank 1', () => {
  render(<LeaderboardRow entry={{ rank: 1, ... }} />)
  expect(screen.getByLabelText(/ranked first/i)).toBeInTheDocument()
})
```

Use accessible queries (`getByRole`, `getByLabelText`) over
`getByTestId`. `data-testid` is a last resort and only for
elements that genuinely have no semantic identity.

## Hooks and stores

Render a hook with `renderHook` from RTL. Drive the Zustand
store with its `setState` directly in arrange steps; assert on
the hook's returned values.

## E2E

- Playwright against a deployed-or-local API.
- One flow per page. Don't re-test what unit/component tests
  already cover.
- Use the **real** API. No mocks. If staging is flaky we
  diagnose staging, we don't paper over it.

## Why "real API" matters

Same reasoning as the backend — mocks drift from reality. A
mocked test that passes against a stale contract is worse than
no test.

## Coverage

Coverage is a smell signal, not a target. We do not gate on a
percentage. We do gate on: every behaviour in "what we always
test" has at least one test, and every bug fix lands with a
regression test.
