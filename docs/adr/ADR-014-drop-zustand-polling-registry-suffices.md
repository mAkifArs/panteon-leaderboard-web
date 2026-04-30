# ADR-014: Drop Zustand — polling registry covers shared state

- **Status:** Accepted (supersedes ADR-002)
- **Date:** 2026-05-01
- **Deciders:** Mehmet Akif Arslan
- **Tags:** #frontend #state-management #dependencies

## Context

ADR-002 picked Zustand as the shared-state container before any
real code existed, on the assumption that ~100 rows updating
every 5 seconds would need granular selectors to avoid a Context
re-render cascade.

What actually got built is different. Shared state in this app
is not a tree of UI slices; it is **server data, polled and
distributed via a module-scoped registry** (ADR-004). The
registry uses `useSyncExternalStore` and exposes per-key
subscriptions — the same granular-subscription property that
motivated picking Zustand in the first place.

After the hifi redesign landed, the audit showed the actual
shape of state in the codebase:

- **Server data (the leaderboard, own-rank cluster):** owned by
  the polling registry, not React state. Every consuming
  component subscribes to its key via `useSyncExternalStore`.
- **Per-row data identity:** preserved across ticks by
  `stabilizeCurrentResponse` (ADR-012), which is what actually
  prevents the re-render cascade — not a state container.
- **User identity (`userId`):** read in one place
  (`LeaderboardPage`), backed by URL param + `localStorage`
  (ADR-006). Single owner, no cross-tree need.
- **UI state (refs, hover, expand-window, sticky-bar target):**
  local `useState` in the owning component.

There is no Zustand store in `src/`. There has never been one.
The dependency is listed in `package.json` and claimed in
ADR-002 + CLAUDE.md, but unused.

## Decision

Remove `zustand` from dependencies. Treat the polling registry +
URL state + local `useState` as the canonical state model for
this app. Mark ADR-002 as superseded by this record.

If a future feature genuinely needs cross-tree, non-URL,
non-server state (e.g. multi-select compare mode, optimistic
writes with rollback), reintroduce Zustand at that point — the
cost is `bun add zustand` and a 50-line store file.

## Consequences

### Positive

- Documentation matches the code. CLAUDE.md, ADR-002, and the
  actual source no longer disagree on whether a store exists.
- Smaller dependency surface. One fewer package to keep on the
  current major version.
- Clearer mental model for new readers: "state lives in the
  polling registry, the URL, or local state — pick the one that
  fits."

### Negative

- ADR-002's "selector discipline" guidance loses its concrete
  target. The principle (subscribe to the slice you read,
  nothing more) still applies to `useSyncExternalStore`
  subscriptions in the polling registry.
- If we add a store later, we will need an ADR to justify the
  reintroduction — small overhead.

### Neutral

- `react-patterns` skill mentions Zustand selector rules. Those
  lines stay valid as conditional guidance ("if you add a
  Zustand store, follow these rules") rather than active law.

## Alternatives Considered

### Alternative A: Keep the dependency, leave docs unchanged

The dep is tree-shaken, so no bundle cost. But the docs would
keep claiming a store exists when none does. Rejected on
honesty grounds.

### Alternative B: Keep the dependency, write a token store

Move `userId` or polling state into a Zustand store to justify
the dep. Rejected — both are already well-served by URL/registry,
and forcing them through a store adds indirection without value.

### Alternative C: Drop the dep, do not write an ADR

Lighter weight but leaves ADR-002 stranded as a contradiction.
Rejected — the decision evolved, and the evolution should be
recorded so future-me understands why the docs changed.

## AI involvement

Claude ran the full-codebase audit that surfaced the
contradiction (Zustand claimed, not used). The supersede-vs-keep
discussion was mine; Claude argued both sides on request and
flagged the URL-state path for the hypothetical "past weeks"
feature that prompted the question. Decision is mine.

## References

- ADR-002 (superseded) — original Zustand decision.
- ADR-004 — polling hook design, the actual shared-state
  mechanism.
- ADR-006 — user identity strategy (URL + localStorage).
- ADR-012 — data identity contract, the real fix for the
  re-render cascade ADR-002 worried about.
- `src/hooks/usePolling.ts` — registry implementation.
