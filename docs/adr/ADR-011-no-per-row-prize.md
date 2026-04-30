# ADR-011: No per-row prize on the wire — pool only

- **Status:** Accepted
- **Date:** 2026-04-28
- **Deciders:** Mehmet Akif Arslan
- **Tags:** #frontend #design #api-contract

## Context

The hifi leaderboard design shows a "Prize" value on each top-3
podium card and (optionally) on each row of the Top-100 list.
The backend, however, only returns `meta.pool` (a `BigInt`-as-
string total). Per-row prize allocation is a function of `pool`
and `rank` (20% / 15% / 10% for ranks 1–3, 55% linearly weighted
across ranks 4–100), implemented in
`panteon-leaderboard-api/src/lib/prize-math.ts`.

To render per-row prize, we have three options:

1. **Add `prize` to `ViewEntry`** in the backend response.
2. **Mirror the prize-math formula** in the frontend and compute
   prizes locally with `BigInt`.
3. **Drop per-row prize** from the UI; show only the total pool.

Per CLAUDE.md Invariant 1: _"Money is read as a string from the
API and rendered with `Intl.NumberFormat`. No client-side BigInt
math, no rounding, no currency arithmetic in the frontend. The
API ships values already finalised."_

Option 2 is a direct invariant violation. Option 1 is a backend
PR. Option 3 is a hifi compromise.

## Decision

We pick **Option 3: drop per-row prize from the UI**. Concretely:

- Top-100 list has **no Prize column**.
- Podium cards have a **single "Earned" footer row** — the
  "Prize" footer row from the design is removed.
- Hero StatCard "Prize pool" remains and renders `meta.pool`
  formatted via `formatCompact()`. No arithmetic.
- `PrizePoolInfo` tooltip continues to _describe_ the
  distribution textually (1st 20%, 2nd 15%, 3rd 10%, ranks 4–100
  share 55% linearly). This is documentation, not computation.

`ViewEntry` schema is unchanged; backend stays untouched.

## Consequences

### Positive

- CLAUDE.md money invariant is preserved without exception.
- Backend stays a stateless math service; the frontend never
  performs currency arithmetic.
- Smallest possible diff to ship the design.
- Tooltip still communicates the distribution shape, so the
  user understands how the pool resolves at week-end.

### Negative

- Hifi compromise: a player can't see _their_ projected payout
  on the top-100 list. They see only the pool total and the
  distribution rule.
- If we later decide to show per-rank prize, this is a
  re-decision: backend adds the field, FE displays it. Plumbing
  is ready (`ViewEntry` is the single touchpoint).

### Neutral

- The design `PRIZE` cell and column are visually missing
  compared to the original handoff. The list column-template
  was reduced from six to five columns to keep the row from
  having a phantom empty slot.

## Alternatives Considered

### Alternative A: Backend adds `prize: BigIntString` to ViewEntry

`distributePool(pool, totalWinners)` already produces this. The
route handler would zip payouts with entries and attach `prize`
per row (only for rank ≤ 100; null otherwise). FE renders a new
`Prize` column.

Rejected for now: the user explicitly asked not to extend the
API for this UI iteration. We can revisit if/when prize
visibility becomes a product priority.

### Alternative B: FE mirrors `prize-math.ts`

A 30-line port of the backend formula in `src/lib/prize-math.ts`
with `BigInt` arithmetic. Direct violation of CLAUDE.md
Invariant 1 ("no client-side BigInt math, no rounding, no
currency arithmetic"). Rejected on principle.

## AI involvement

Claude flagged the conflict between the design's per-row prize
requirement and the money invariant during the Discussion
phase, before any code was written. The three options were
laid out with their trade-offs; the user picked Option 3
explicitly. Decision is the user's.

## References

- `CLAUDE.md` — Non-negotiable invariant 1 (money strings, no FE
  arithmetic).
- `panteon-leaderboard-api/src/lib/prize-math.ts` — the formula
  we deliberately do _not_ mirror.
- `src/api/schemas.ts` — `ViewEntry` shape, unchanged.
- `src/components/PrizePoolInfo/PrizePoolInfo.tsx` — textual
  distribution explanation.
