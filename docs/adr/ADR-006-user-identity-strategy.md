# ADR-006: User identity via URL param with localStorage fallback

- **Status:** Accepted
- **Date:** 2026-04-26
- **Deciders:** Mehmet Akif Arslan
- **Tags:** #frontend #identity #ux

## Context

The own-rank cluster and the "you are here" highlight need a
`userId`. The case brief does not require authentication; it
frames the screen from a single player's perspective and assumes
identity is supplied by the upstream game client. For the
deliverable we need a way to:

1. Demonstrate the screen for any seeded player without coding a
   login flow.
2. Let the reviewer change the player they're impersonating
   without a rebuild.
3. Survive a page reload.
4. Not pretend to be auth — anything that _looks_ like login is
   misleading and out of scope.

## Decision

Identity resolves in this order:

1. **`?userId=<externalId>` query param** — wins if present.
   Updating the URL re-triggers the polling key and the screen
   re-renders for the new player.
2. **`localStorage['panteon.userId']`** — used if no query param.
   Set on first successful resolution so reloads stick.
3. **A small "switch player" picker** in the header — lists the
   seeded test users from a static `seed-users.json` checked into
   the repo. Selecting one updates both the URL and localStorage.

If none of the three resolves to a valid user, the screen renders
the top-100 only and the own-rank cluster shows an empty state
with a CTA to pick a player.

## Consequences

### Positive

- Reviewer can paste a URL with `?userId=...` and land on a
  specific player's view. Linkable.
- No backend auth integration, no token plumbing, no cookies.
- The picker keeps the demo self-contained — reviewer doesn't
  have to know which seeded users exist.

### Negative

- `localStorage` is per-browser; switching machines loses the
  selection. Acceptable for a demo.
- The picker is dev/demo scaffolding that ships to prod. Marked
  with a `data-demo-only` attribute and a small "demo mode"
  label so it doesn't read as a real product feature.

### Neutral

- The contract `userId = external_id` matches the API. If we ever
  introduce real auth, the `userId` source swaps out; consumers
  of `useUserId()` don't care.

## Alternatives Considered

### Alternative A: Query param only

No localStorage. Reviewer picks a player every time they refresh.
Rejected on UX grounds — too much friction for evaluation.

### Alternative B: Hard-coded test user

Single demo player, no picker. Rejected because the brief asks
for _competitive_ leaderboard UX — showing it from one player's
perspective hides behaviour at top, middle, and bottom of the
ranking.

### Alternative C: Real login screen

Out of scope. Adds backend work and tells the reviewer we
misread the brief.

### Alternative D: Cookie-based session

Same misread as Alternative C, plus it implies server-side
session state that doesn't exist.

## AI involvement

Claude proposed Alternative C (login screen) on its first pass —
classic "make it production-ready" reflex. Pushback: "the brief
explicitly omits auth; what's the cheapest demo-grade identity?"
Answer was the URL-param + localStorage hybrid. Decision is mine;
the picker UX came out of a Discussion about how a reviewer
would actually use the demo.

## References

- API repo — `users.external_id` is the API-facing id.
- `.claude/skills/component-scaffold/SKILL.md` — picker scaffolding.
