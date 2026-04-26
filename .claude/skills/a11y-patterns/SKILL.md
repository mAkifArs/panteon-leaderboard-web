---
name: a11y-patterns
description: Accessibility baseline for the leaderboard web app. Loads when editing components, forms, or any interactive element. Covers semantic HTML, focus, screen reader labels, keyboard navigation.
---

# Accessibility Patterns — Leaderboard Web

The brief evaluates code quality. Accessibility is part of that.
This skill encodes the baseline so every component inherits it.

## Semantic HTML

- Clickable things are `<button>` or `<a>`. Never `<div onClick>`.
- A button without an `onClick` is a bug.
- A link with `href="#"` and `onClick` is a button — change it.
- The leaderboard list is `<ol>` (ordered list) — rank order
  is semantic, screen readers announce position automatically.

## Focus

- Every interactive element has a visible focus style. Tailwind:
  `focus-visible:ring-2 focus-visible:ring-prize-gold`.
- Modal/dialog opens → focus moves into the dialog. Closes →
  focus returns to the trigger.
- Skipping focus styles to "look cleaner" is forbidden.

## Screen reader labels

Rank context is not visible from the row alone:

```tsx
<RankBadge rank={1} aria-label="Ranked first place" />
```

Patterns:

- Rank 1 → "Ranked first place"
- Rank 2 → "Ranked second place"
- Rank 3 → "Ranked third place"
- Rank N (4+) → "Ranked Nth out of {totalPlayers} players"

Currency values get a label including the unit:
`aria-label="123,000 coins"`.

## Keyboard navigation

- Tab order follows visual order. No `tabIndex={n}` with
  positive numbers.
- The own-rank cluster is reachable by Tab — it is not just
  visual styling.
- A "Jump to my rank" affordance exists and is keyboard-
  reachable.

## Live regions

When the leaderboard ticks and the player's rank changes, the
change is announced:

```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {rankChangeMessage}
</div>
```

Polite, not assertive — we don't interrupt.

## Colour and contrast

- Tailwind tokens meet WCAG AA against their background.
  Test pairs in `tailwind.config.ts` comments.
- Never convey rank position by colour alone. The badge has
  a numeral and a screen-reader label.

## Mobile

- Touch targets are at least 44×44 CSS px.
- Sticky elements do not cover focused inputs (test with
  on-screen keyboard open).

## Testing

- Component tests use `getByRole` / `getByLabelText` — if a
  query like that fails, accessibility broke before the
  visual did.
- One Playwright run with axe-core on the leaderboard page
  before delivery.
