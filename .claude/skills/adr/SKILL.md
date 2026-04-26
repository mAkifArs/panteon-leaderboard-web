---
name: adr
description: Create a new Architecture Decision Record in docs/adr/ with the next sequential number. Use whenever a non-trivial frontend decision is made — component API, state shape, fetching strategy, dependency add.
---

# Architecture Decision Record — Frontend

Produce a new ADR in `docs/adr/ADR-NNN-<slug>.md` where `NNN`
is the next three-digit sequential number after the highest
existing ADR. Same format as the backend repo so the two stay
readable side-by-side.

## Arguments

- `<slug>` — short kebab-case identifier. Examples:
  `tanstack-query-for-server-state`, `tailwind-token-taxonomy`,
  `react-window-for-leaderboard`.

## Procedure

1. Find next number from `docs/adr/`.
2. Create the file with the template below. Today's date in the
   Status line.
3. Leave prose for the human author. Skeleton-only as comments.

## Template

```markdown
# ADR-NNN: <Title>

- **Status:** Proposed | Accepted | Deprecated | Superseded
- **Date:** YYYY-MM-DD
- **Deciders:** Mehmet Akif Arslan
- **Tags:** [#frontend] [#state] [#performance] [...]

## Context

<!-- Forcing function. Constraints. What we knew. -->

## Decision

<!-- Present-tense, imperative: "We use X for Y." -->

## Consequences

### Positive
### Negative
### Neutral

## Alternatives Considered

### Alternative A: <name>
### Alternative B: <name>

## AI involvement

<!-- Was AI consulted? What did it suggest? What was overridden? -->

## References
```

## Rules

- Numbers never get reused.
- One decision per ADR.
- "AI involvement" is not optional. Even "no AI input" is a
  valid entry.

## Expected ADRs for this project

- `ADR-001-vite-spa-stack.md` — done
- `ADR-002-zustand-over-context.md` — done
- `ADR-003-polling-over-websockets.md` — done
- `ADR-004-component-variant-strategy.md`
- `ADR-005-tailwind-token-taxonomy.md`
- `ADR-006-own-rank-cluster-shifting-window.md`
- `ADR-007-error-boundary-strategy.md`
