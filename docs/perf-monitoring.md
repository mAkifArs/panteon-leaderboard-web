# Performance monitoring

A short note on how render-cost is observed in this app today, and
where it could go.

## Today: react-scan in dev

`react-scan` is wired into `src/main.tsx:7-11` behind an
`import.meta.env.DEV` guard, so it ships zero bytes to production:

```ts
if (import.meta.env.DEV) {
  void import('react-scan').then(({ scan }) => {
    scan({ enabled: true, log: false })
  })
}
```

What this gives us:

- Visual highlights over re-rendering nodes when running `bun dev`.
- A console-accessible `scan()` API for one-off audits.
- `log: false` keeps the console quiet by default — flip it on
  while investigating a specific change.

What it's good at: catching the kind of regression where a
seemingly-innocent prop change blows up memoization across the
polling tick (the failure mode ADR-012 and ADR-004 set up the
codebase to avoid).

What it isn't: a number you can defend in a PR. It is a tool you
look at, not a metric you compare against.

## Why no CI gate yet

A CI baseline ("polling tick must trigger ≤ N re-renders for a
fixed snapshot") is the natural next step, and it's deliberately
not built today:

- The codebase already has structural defenses: stabiliser inside
  `usePolling` (ADR-012, recent commits 58bdf40 / 3db93de) and the
  React Compiler memoisation chain. A regression test that asserts
  on those would be a layer above the unit tests for
  `stabilizeCurrentResponse` — useful, not urgent.
- Without a stable baseline first, a CI gate would be noise. The
  app's render shape is still settling (own-rank cluster, sticky
  bar, podium gate flipping in/out across recent ADRs).
- Cost: a custom Vitest harness + a fake polling source + a
  re-render counter ref. Maybe a hundred lines, plus the discipline
  to keep the baseline updated when the render shape changes
  intentionally.

## When this should change

Bring in a CI baseline if any of the following happens:

- A re-render regression slips past code review and only gets
  caught visually (a "noticed it lagging" bug).
- Polling moves to a sub-5s interval, where the tick-cost margin
  shrinks.
- A new feature lands that subscribes to the polling registry from
  many components at once (e.g. the tournaments view).

Until then: dev-mode react-scan is the audit tool, the unit tests
on the stabiliser are the structural guard, and ADR-004 / ADR-012
are the design intent.

## References

- `src/main.tsx:7-11` — react-scan boot
- `src/shared/hooks/usePolling.ts` — registry + visibility-aware tick
- `src/shared/lib/structural-equal.ts` — referential stability
- ADR-004 — polling hook design
- ADR-012 — data identity contract
