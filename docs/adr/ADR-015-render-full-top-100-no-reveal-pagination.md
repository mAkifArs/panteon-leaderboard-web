# ADR-015: Render full top-100 in one shot, drop reveal pagination

- **Status:** Accepted (supersedes ADR-013)
- **Date:** 2026-05-01
- **Deciders:** Mehmet Akif Arslan
- **Tags:** #frontend #components #ux

## Context

ADR-013 added an IntersectionObserver-driven "reveal-scroll
pagination" to `LeaderboardList`: ranks 4–23 mounted on first
paint, scrolling the sentinel into view triggered a 350ms
delayed reveal of the next 20, and so on up to rank 100. The
goal was cognitive-load reduction — "don't drop 100 rows on
the user."

Two things changed since:

1. **The cluster is now click-gated.** ADR-014's spirit
   carried into the leaderboard view: when the player is
   outside the top 100, `OwnRankCluster` is not rendered until
   the user clicks "Jump to me" (avoids the orphaned-data look
   under a still-paginated list). With the cluster gated, the
   reveal-pagination at the bottom of the list is the *next*
   thing in the user's eyeline — it stacks UI weight rather
   than relieving it.

2. **The API hands back the entire top-100 in a single
   response.** The pagination was never a network optimisation;
   it was purely UX framing. The cost of rendering 97 rows at
   once on a modern browser, with React Compiler memoising
   per-row, is invisible — measurable as zero on the dev
   machine after the redesign landed.

The "cognitive load" argument also weakened in practice. A
ranked list is a thing users naturally scan; segmenting it
into 5 implicit pages added more interruption than relief, and
left the page in an awkward "spinner sitting at the bottom"
state when the user reached the cluster via Jump.

## Decision

Render the entire `entries` array in `LeaderboardList` on
first paint. Remove the reveal state, the
IntersectionObserver, the sentinel row, the reveal-loading
spinner, the per-jump `ensureRankVisible` / `revealAll`
imperative methods, and the `.lb-row-in` animation
class. `handleJump` simplifies to "scroll to the
already-mounted target."

## Consequences

### Positive

- Simpler `LeaderboardList`: ~70 lines fewer, one mental model
  ("render entries").
- Simpler `LeaderboardPage.handleJump`: no double-rAF, no
  imperative handle dance — just `scrollToEl` on a node that's
  already in the DOM.
- Smoother Jump-to-me UX: target node is mounted before the
  user even thinks about scrolling. No layout shift mid-scroll
  because the list isn't growing.
- One fewer source of subtle bugs (stale closures around
  `selfRowEl` after `setRevealed` re-renders).

### Negative

- Lose the "fresh reveal" slide-in animation. Worth keeping in
  the codebase only if we add it back as a one-time entrance
  on first mount; otherwise dead code. Removing for now.
- Slightly more DOM at paint time (97 rows vs. 20). React
  Compiler memoization per row keeps the polling tick cost
  flat, so this is a one-time mount cost — not a continuous
  one. No measurable user-visible regression.

### Neutral

- ADR-013's `LeaderboardListHandle` (imperative ref) goes
  away. The component no longer forwards a ref. Tests that
  asserted on the sentinel get removed; tests that exercise
  jump-to-me stay valid (they always asserted on row
  visibility, not on reveal state).

## Alternatives Considered

### Alternative A: Keep pagination, ungate the cluster

Reverts the "don't auto-show cluster" choice and brings back
the orphan-data confusion from before. Rejected — the cluster
gating is itself a UX win.

### Alternative B: Replace IO-driven reveal with an explicit
"Show more" button

Solves the spinner-at-bottom problem but keeps the page in two
states. Adds another button in a view that already has
"Switch player" + "Jump to me" + "Store" + "EN". Rejected —
reduces total clicks-to-information by going to zero pages.

### Alternative C: Render all 100 immediately, but keep a
soft entrance animation

A 200ms fade/slide on initial mount only, applied via a
single CSS class on the `<ol>`. Considered for the future. Not
in this ADR — keep the change tight.

## AI involvement

Claude flagged the reveal-pagination as the next thing to
question after the cluster gate landed: the two interact in
the user's visual field, and stacking both controls felt
heavier than either alone. The "API already ships the full
list" framing was the deciding observation. Decision is mine.

## References

- ADR-013 (superseded) — original reveal-scroll pagination.
- `src/components/LeaderboardList/LeaderboardList.tsx` —
  the simplified component.
- `src/pages/LeaderboardPage.tsx` — `handleJump` after the
  simplification.
