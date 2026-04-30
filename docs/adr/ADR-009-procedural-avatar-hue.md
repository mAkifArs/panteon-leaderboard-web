# ADR-009: Procedural avatar via deterministic hue gradient

- **Status:** Accepted
- **Date:** 2026-04-28
- **Deciders:** Mehmet Akif Arslan
- **Tags:** #frontend #components #design

## Context

The hifi leaderboard design (`design_handoff_leaderboard/`) wants
each row to show a circular avatar beside the username. We don't
have a real avatar pipeline — no upload, no CDN, no profile
service. The backend's `ViewEntry` is `{ rank, userId, username,
score, country? }` only.

We still want the visual texture: a list of identical grey
circles is a regression from the prototype, and gradient avatars
are a recognised idle-game convention.

## Decision

Each player gets a **deterministic gradient avatar** derived from
their `userId`:

- A 32-bit string hash (`hueFromSeed`, djb2-style) maps `userId`
  to a hue in `[0, 360)`.
- The hue is exposed via the CSS variable `--avatar-h`.
- The gradient is fixed in `index.css`:
  `linear-gradient(135deg,
oklch(0.55 0.12 var(--avatar-h)),
oklch(0.32 0.10 calc(var(--avatar-h) + 40)))`.
- Initials (first two stripped letters of `username`) are
  rendered in `JetBrains Mono` over the gradient.

The component is `Avatar` (`src/components/Avatar/`) with the
props `{ seed, initials, size, ring? }`. Inline `style` is used
only to set the CSS variable and the dimensional values that
must be runtime-driven; all colours stay in CSS.

## Consequences

### Positive

- Same `userId` → same gradient across renders, sessions, and
  cache invalidations. No flicker.
- Zero dependencies, zero network. Avatar shows up instantly.
- Visually distinguishes adjacent rows without a real avatar
  pipeline.
- Adding a real avatar later is a one-prop change: `Avatar` can
  take an optional `src` and fall back to the gradient if the
  image fails to load.

### Negative

- Gradient is not a real likeness; if Panteon eventually ships
  user-uploaded avatars, this becomes legacy code.
- `oklch` requires modern browsers (Safari 15.4+, Chrome 111+,
  Firefox 113+). Acceptable for 2026; older browsers degrade to
  the fallback colour the engine picks.

### Neutral

- One inline `style` is required to set `--avatar-h`. This is
  the narrow exception to the "no inline styles" rule —
  documented here.

## Alternatives Considered

### Alternative A: Identicon library (jdenticon, boring-avatars)

External dependency, larger bundle, less control over visual
weight. Rejected — we only need one variant of one shape.

### Alternative B: Pre-generated SVG sprites keyed by hash

More cacheable but requires shipping the sprite sheet and a
build step. Overkill for a procedural gradient.

### Alternative C: Plain monochrome circle with initials

Simpler, no `oklch`, no CSS variable. Rejected — visual texture
loss is real; the design relies on the gradient for hierarchy.

## AI involvement

Claude proposed the gradient + initials pattern after reading
`primitives.jsx` from the design handoff and matching it to our
"no real avatar pipeline" reality. The CSS-variable carve-out
for the runtime hue was Claude's suggestion to keep `no inline
styles` intact in spirit. Decision is mine.

## References

- `design_handoff_leaderboard/primitives.jsx` — original Avatar
  prototype with the same `oklch` gradient.
- `src/lib/avatar.ts` — `hueFromSeed`, `getInitials`.
- `src/components/Avatar/Avatar.tsx` — the component.
- `src/index.css` — `.avatar-bg` utility.
