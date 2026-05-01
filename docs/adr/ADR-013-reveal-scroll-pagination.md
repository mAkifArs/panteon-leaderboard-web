# ADR-013: Reveal-style scroll pagination for the Top-100 list

- **Status:** Superseded by [ADR-015](ADR-015-render-full-top-100-no-reveal-pagination.md) on 2026-05-01
- **Date:** 2026-04-29
- **Deciders:** Mehmet Akif Arslan
- **Tags:** #frontend #ux #a11y #performance

> **Superseded.** After click-gating the cluster (rank > 100
> path), the reveal pagination became the next-heaviest UI on
> screen instead of relieving cognitive load. The API ships
> the full top 100 in one response; rendering all 97 list rows
> on first paint is cheap with React Compiler memoization.
> See ADR-015 for the full reasoning.

## Context

`/leaderboard/current/:userId` returns the full top 100 in one
request (ADR-003 / ADR-004); the backend exposes no `offset` or
`cursor` parameter and the case brief in `docs/case/case-en.html`
caps the list at "top 100 + the player's own cluster (3 above,
self, 2 below)". So we are _not_ paginating to discover more
ranks — we already have all of them after the first poll.

What we _do_ have is a 97-row block (ranks 4–100, after the
podium) rendered as a single `.map()` in
`LeaderboardList.tsx`. That produces three concrete problems:

1. **Cognitive overload.** A 97-row wall on first paint reads as
   undifferentiated noise. Users skim the first ~10 and bail.
2. **`Jump to me` ambiguity for ranks 4–100.** The sticky bar
   currently scrolls to the player's own row. That works today
   only because every row is in the DOM. If we ever reveal
   incrementally, the target row may not yet exist.
3. **DOM weight on first paint.** Not measurably slow at 97 rows,
   but it _is_ the kind of premature density that drags Lighthouse
   "time to interactive" without giving anything in return.

## Decision

We render the top-100 list **incrementally on the client**: an
initial slice of 20 rows, expanded by 20 each time a bottom
sentinel intersects the viewport (IntersectionObserver). The
`Jump to me` button becomes rank-aware: when the player is in
ranks 4–100, the list is told to reveal at least up to that
rank in a single state commit, then scrolls smooth to the row
with a 1.5s pulse highlight.

This is a render-layer change only. Polling, schemas, and
identity contracts (ADR-012) are untouched. The full payload
still arrives in one request; we just stage it into the DOM.

## Consequences

### Positive

- Progressive disclosure on the longest visual block — the list
  reads as "here's the leaderboard, scroll for more" instead of
  a tablecloth dump.
- `Jump to me` becomes coherent in every position bucket:
  - Rank 1–3 → button is hidden (already true via `me.rank > 3`).
  - Rank 4–100 → reveal-then-scroll-then-pulse, deterministic.
  - Rank > 100 → unchanged: scroll to the `OwnRankCluster`
    section that always renders fully.
- DOM node count on initial paint drops from ~100 to ~20.
  Negligible perf win in absolute terms but it removes a
  premature-density smell that the case reviewer might flag.
- The sentinel + `aria-live` "Showing N of M" pair gives screen
  reader users a predictable progress signal — more accessible
  than the silent wall it replaces.

### Negative

- New imperative surface on `LeaderboardList`:
  `useImperativeHandle` exposes `ensureRankVisible(rank)`. We
  generally avoid imperative refs (declarative-first), but the
  alternative — lifting `revealed` state to `LeaderboardPage`
  and threading it through props — couples the list's display
  concern to its parent without making the API any cleaner.
  The handle is the smaller blast radius.
- Two reset signals to keep in sync: when `entries` identity
  actually changes (week rollover, user switch), `revealed`
  must reset to `PAGE_SIZE`. ADR-012 stabilizes the array
  reference across no-op ticks, so the reset effect fires only
  when it should — but if the stabilizer's contract drifts,
  this state silently desyncs.
- `Jump to me` for in-list ranks needs a one-frame wait
  (`requestAnimationFrame`) between the reveal commit and the
  scroll, because the target `<li>` mounts in the same render
  the state commit triggered. The `selfRowRef` callback ref
  re-runs and `selfRowEl` updates after commit. If a future
  React mode breaks this timing assumption we fall back to
  `flushSync`.

### Neutral

- We deliberately do **not** add a manual "Show more" button.
  The IntersectionObserver path is enough; an extra button
  doubles the affordance and complicates the `aria-live` story.
  Keyboard users still reach the bottom by tabbing through rows
  or arrow-scrolling — no new interaction is gated.
- Pagination here is decorative, not load-bearing for the data
  contract. If the brief ever changes to "show ranks 101+",
  this scaffold does _not_ extend cleanly to that — we would
  need a new endpoint and a different state shape (cursor +
  fetching status). That's a different ADR.

## Alternatives Considered

### Alternative A: Backend offset/cursor + true pagination

Add `/leaderboard/range?offset=&limit=` to the API and stream
ranks 101+ as the user scrolls. Rejected: the case brief is
explicit ("top 100 + cluster"), ADR-002 separates frontend
from backend repos, and shipping a backend endpoint to enable
a UX nicety blows the case scope.

### Alternative B: Virtualization with `react-window`

Same end state visually, but only the visible rows ever mount.
Rejected per CLAUDE.md ("no premature virtualization") — at 100
rows the ROI is negative and the row variants (`top3`, `self`,
`neighbour`, `normal`) interact with item heights in ways that
make windowing fragile.

### Alternative C: CSS-only "fade-out tail + Show more"

Render all 100 rows but visually mask everything below row 20
with a gradient and a click-to-reveal button. Rejected because
the underlying DOM weight stays the same and screen reader
users get no benefit — pure cosmetic theater.

## AI involvement

Claude proposed reveal-over-pagination after the user asked
"can we add scroll pagination" with a screenshot of the wall
view. The framing — that real pagination is out of scope but
reveal solves the same UX problem — came from Claude. The
user picked the variant via `AskUserQuestion`: top-100-bound
reveal, rank-aware `Jump to me`, IntersectionObserver
sentinel. Decision is mine.

## References

- ADR-003 — Polling, not WebSockets (5s tick).
- ADR-004 — Polling registry, key per resource.
- ADR-008 — Re-render audit ("1 row = 1 re-render per tick").
- ADR-010 — Sticky bar uses scroll listener, not IO. Different
  use case: the bar's target moves between `clusterEl` and
  `selfRowEl`; this sentinel is fixed at the list bottom.
- ADR-012 — Data identity contract. Reveal reset depends on
  the contract holding (entries ref changes only on real diff).
- `docs/case/case-en.html` — top 100 + cluster requirement.
- `src/components/LeaderboardList/LeaderboardList.tsx` — owner.
- `src/pages/LeaderboardPage.tsx` — `handleJump` integration.
