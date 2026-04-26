# ADR-007: Single `<LeaderboardRow>` with a variant prop, not four components

- **Status:** Accepted
- **Date:** 2026-04-26
- **Deciders:** Mehmet Akif Arslan
- **Tags:** #frontend #components #api-design

## Context

A leaderboard row appears in four visually-distinct shapes:

- **top3** — gold/silver/bronze treatment, larger rank badge.
- **normal** — the bulk of rows 4..100.
- **self** — the current player's row, highlighted regardless of
  rank.
- **neighbour** — rows around the current player inside the
  own-rank cluster.

The structural content is identical: rank badge, username, score,
optional prize indicator. Only the visual treatment differs.

The question — discussed in `AI_WORKFLOW.md` — is whether to ship
one component with a `variant` prop or four siblings.

## Decision

We ship a **single `<LeaderboardRow>`** with:

```tsx
<LeaderboardRow
  entry={ViewEntry}
  variant="top3" | "normal" | "self" | "neighbour"
  rank={number}
/>
```

Variant maps to a Tailwind className lookup table. The component
has one DOM tree, one accessibility model, one set of tests.
Adding a fifth variant is a one-line table addition + visual test.

## Consequences

### Positive

- One component, one test file, one Storybook entry per variant.
- Shared structure means a change to "show prize next to score"
  lands in one place and applies to all variants.
- TypeScript exhaustiveness on the variant union catches missed
  cases at compile time.

### Negative

- The variant lookup table grows with the variant count. At four
  variants it's trivial; if we ever cross ~eight, the readability
  argument flips and we'd reconsider.
- Visual regressions can leak across variants if a shared
  className changes. Mitigated by per-variant Playwright snapshot
  tests.

### Neutral

- Storybook needs four stories instead of four files. Same
  surface area, different shape.

## Alternatives Considered

### Alternative A: Four separate components

`<TopThreeRow>`, `<NormalRow>`, `<SelfRow>`, `<NeighbourRow>`.
Rejected because 90% of the markup would be duplicated, and
shared changes (e.g., adding a "prize" column) would require
four edits with high drift risk.

### Alternative B: Composition via children/slots

`<LeaderboardRow>{({ rank, score }) => <TopThreeStyling .../>}<...>`.
More flexible but over-engineered for four fixed variants. We
don't need user-defined row layouts.

### Alternative C: Tagged-union props (no variant string)

`<LeaderboardRow {...top3Props}>` where the type itself is the
discriminator. Slightly more type-safe but harder to read at the
call site, and Storybook stories become awkward.

## AI involvement

Claude initially leaned toward Alternative A (four components) —
the "single responsibility per file" reflex. Pushback was a
Discussion about what *changes together*: a row's structure
changes together across all four variants 90% of the time. That
flipped the recommendation. Decision is mine; the reasoning
walk came faster with AI.

## References

- `AI_WORKFLOW.md` — Component API design section.
- `.claude/skills/component-scaffold/SKILL.md` — generated layout.
