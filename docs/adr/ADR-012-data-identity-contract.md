# ADR-012: Data identity contract for polling responses

- **Status:** Accepted
- **Date:** 2026-04-29
- **Deciders:** Mehmet Akif Arslan
- **Tags:** #frontend #performance #data-flow

## Context

`useLeaderboardView` polls `/leaderboard/current/:userId` every 5
seconds (ADR-003, ADR-004). The response is parsed by Zod via
`apiGet` (`src/api/client.ts:38` `return schema.parse(json)`).
Zod's `parse` produces a fresh object tree on every call — new
`entries[]` array, new `ViewEntry` objects, new `meta`, new `me` —
even when the underlying JSON is byte-identical to the previous
tick.

That means every consumer of `data` (`LeaderboardList`, `Podium`,
`OwnRankCluster`, `StickySelfBar`) sees a new prop reference each
tick. React Compiler's auto-memoization keys on referential
equality; with non-stable inputs it cannot short-circuit, so
all 100 rows re-render every five seconds. ADR-002 and ADR-008
both promise _"1 row = 1 re-render per tick"_ — the promise was
silently broken once Zod validation entered the data path.

## Decision

We introduce a **data identity contract**: the `data` returned
from `useLeaderboardView` is structurally stable across ticks.
Concretely:

- If the polled response content is unchanged, `data` is the
  same JS reference as the previous tick.
- If a single entry changes, that entry — and the `entries`
  array, and the `top` object, and the root response — get new
  references; every other entry keeps its previous reference.
- The `meta`, `top`, `me`, and `me.cluster` sub-trees obey the
  same rule.

Implementation lives in `src/lib/structural-equal.ts`:
`stabilizeCurrentResponse(prev, next)` walks the tree and
substitutes the previous reference wherever the content matches.
`useLeaderboardView` calls this on every successful poll and
remembers the last stable tree in a `useRef`.

Comparison is field-explicit and primitive-only:

- `ViewEntry`: `rank, userId, score, username, country`
- `Meta`: `isoWeek, weekStart, weekEnd, pool`
- `OwnRankPayload`: `rank, totalPlayers, cluster`

`score` and `pool` are strings (CLAUDE.md money invariant); we
compare them as strings, never coerce to BigInt.

## Consequences

### Positive

- All four downstream consumers (`LeaderboardList`/`LeaderboardRow`,
  `Podium`/`PodiumCard`, `OwnRankCluster`, `StickySelfBar`) see
  stable refs. React Compiler memoizes them automatically; no
  consumer needs `React.memo` or hand-rolled equality.
- A single root-level fix replaces what would otherwise be four
  separate memoization sites — fewer places to drift.
- The render-audit promise from ADR-008 ("1 row = 1 re-render
  per tick") becomes a load-bearing invariant in practice, not
  just an aspiration.
- Stabilization is observable in `react-scan` overlay: ticks
  with no content change produce no row highlights.

### Negative

- `structural-equal.ts` is a maintenance surface that must be
  updated whenever a new field is added to `ViewEntry`, `Meta`,
  or `OwnRankPayload`. The rule: schema changes → stabilizer
  field list update + new unit test. Forgetting this silently
  regresses perf, not correctness, so it can hide.
- Comparison cost is ~100 string compares per tick. Negligible
  in absolute terms (<1ms), but adds a mental "is this stable?"
  question that wasn't there before.

### Neutral

- The contract applies only to `useLeaderboardView` for now. If
  another polling endpoint is added (`useSomethingElse`), it
  needs its own stabilizer or the principle gets diluted.

## Alternatives Considered

### Alternative A: Wrap `LeaderboardRow` in `React.memo` with custom comparator

Same compare logic, but applied at the row leaf instead of the
hook root. Rejected because:

- `Podium`, `OwnRankCluster`, and `StickySelfBar` would still
  re-render every tick. They consume the same data tree.
- CLAUDE.md says "no manual memo unless profiled". Profile
  exists, but a cleaner architectural fix exists too.
- React Compiler is already trying to memoize; manual `memo`
  competes with it instead of feeding it stable input.

### Alternative B: Both A and the hook stabilization

Belt-and-suspenders. Rejected because two paths in parallel
require parallel maintenance. If the hook regresses, the row
memo "saves" us and the real bug stays hidden.

### Alternative C: Skip Zod parse on identical wire payload

Compare raw JSON strings before parsing; reuse the previous
parsed tree if identical. Rejected because:

- Hashing/diffing the JSON string costs roughly the same as
  field-comparing the parsed objects.
- Doesn't help when _part_ of the payload changed (e.g. one
  entry's score). The hook-level structural-equal does.

## AI involvement

Claude flagged the bug after the user observed full-list
re-renders during polling. The trace from `usePolling` →
`apiGet` → Zod `parse` → new objects came from a parallel
Explore-agent inspection. The hook-level fix was Claude's
recommendation; the user asked the open question ("keys
defined?") and Claude reframed it as an identity contract
problem rather than a key problem. Decision is mine.

## References

- ADR-002 — Zustand selectors granular (similar perf invariant
  at the store level).
- ADR-004 — Polling registry / single timer.
- ADR-008 — Re-render audit layer ("1 row = 1 re-render per
  tick" — this ADR is the structural underpinning of that
  promise).
- `CLAUDE.md` — money invariant (string compare only).
- `src/lib/structural-equal.ts` — implementation.
- `src/hooks/useLeaderboardView.ts` — consumer.
