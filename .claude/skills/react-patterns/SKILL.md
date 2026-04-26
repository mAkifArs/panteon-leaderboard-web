---
name: react-patterns
description: Project-specific React conventions for the leaderboard web app. Loads when editing .tsx files, components, hooks, or anything in src/. Covers component shape, Zustand selector discipline, hook layout, and what we never do.
---

# React Patterns — Leaderboard Web

This skill teaches the conventions for **this specific project**.
Claude already knows React; this file teaches what we do here.

## Component shape

One component per folder:

```
src/components/LeaderboardRow/
├── LeaderboardRow.tsx
├── LeaderboardRow.test.tsx
├── LeaderboardRow.types.ts   (only if shared)
└── index.ts
```

- Default export the component, named export anything else.
- `index.ts` re-exports — barrel imports stay shallow.
- Max 3 levels of folder nesting under `components/`.

## Component API rules

- Props are typed in a `Props` interface at the top of the file,
  never inline.
- Variants are an enum-like union (`'top3' | 'normal' | 'self'`),
  never a boolean flag matrix.
- Boolean props default to `false` and are named affirmatively
  (`isHighlighted`, not `notHighlighted`).
- No optional callback props that the parent must remember to
  pass — if the component needs it, it is required.

## Zustand selector discipline

```ts
// Good
const myRank = useLeaderboardStore(s => s.myRank)
const top10 = useLeaderboardStore(s => s.entries.slice(0, 10))

// Bad — subscribes to the entire store
const store = useLeaderboardStore(s => s)

// Bad — creates a new object every render
const both = useLeaderboardStore(s => ({ a: s.a, b: s.b }))
// (use shallow comparator if combined slices are truly needed)
```

If a selector returns an object or array literal, the component
re-renders every tick because the reference changes. Use
`shallow` from Zustand or split into separate selectors.

## Hooks

- Custom hooks live in `src/hooks/` when reused, or co-located
  when single-component.
- Naming: `useLeaderboard`, `useOwnRank`, `usePolling`.
  Always `use*` prefix; lint enforces.
- A hook either fetches data, manages local state, or wraps a
  side effect. Mixing all three in one hook is a smell.

## React 19 + Compiler

- The React Compiler is enabled. Do not write `useMemo` /
  `useCallback` unless profiling shows a measurable win.
- Refs and effects still apply normally; the compiler does not
  remove the rules of hooks.

## Polling

- `usePolling` hook is the single source of poll behaviour.
  5s interval, visibility-aware (per ADR-003).
- Components do not call `setInterval` directly.

## Error handling

- Render errors → error boundary (one global, scoped to
  `<LeaderboardList>`).
- Fetch errors → state in the store, rendered by the component
  that owns the visual treatment.
- Never swallow an error silently.

## Things we never do

- `<div onClick>` for clickable things. Use `<button>` /
  `<a>` (see `a11y-patterns`).
- Inline styles. Tailwind utility classes only.
- Raw hex colours. Tailwind tokens only.
- `any`. Use `unknown` and narrow.
- `useEffect` for derived values — use a selector or memo.
- Premature virtualisation (no `react-window` until measured).
