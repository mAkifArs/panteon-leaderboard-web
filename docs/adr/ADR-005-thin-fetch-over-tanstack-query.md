# ADR-005: Thin fetch wrapper, not TanStack Query

- **Status:** Accepted
- **Date:** 2026-04-26
- **Deciders:** Mehmet Akif Arslan
- **Tags:** #frontend #data-fetching #dependencies

## Context

The frontend talks to three GET endpoints and zero POST endpoints
from the player view. There is no cross-route cache invalidation,
no optimistic update, no mutation flow that needs rollback. The
data shape is:

- Top-100 list — refetched every 5s, replaces in full.
- Own-rank cluster — refetched every 5s, replaces in full.
- Prize pool counter — refetched every 5s, replaces in full.

ADR-002 already touched on this in passing ("TanStack Query is a
fair option") but never made the call explicit. This ADR does.

## Decision

We use a **hand-rolled `apiClient`** — a 30-line `fetch` wrapper
that:

- Prepends `VITE_API_BASE_URL`.
- Sets `Accept: application/json`.
- Rejects on non-2xx with a typed `ApiError` carrying the parsed
  `{ error: { code, message } }` body from the API.
- Returns parsed JSON typed via Zod schemas mirroring the API
  contract.

Polling, retry, and visibility-pausing live in `usePolling` (ADR-004),
not in the client. The client is dumb on purpose.

TanStack Query (or SWR) is **not used**. We revisit if any of these
trigger:

- Cache invalidation across two routes.
- Optimistic updates with rollback.
- More than ~5 distinct server resources in the app.

## Consequences

### Positive

- Zero added runtime dependency. Bundle stays small.
- The whole data layer fits in two files: `apiClient.ts` and
  `usePolling.ts`. Anyone reading the repo understands it in
  under 10 minutes.
- Zod schemas double as runtime validation — typos in the API
  contract surface in dev, not in prod.

### Negative

- We re-implement deduplication and stale-while-revalidate
  ourselves (in `usePolling`). If we ever need request-level
  retries with exponential backoff, that's another bespoke piece.
- No devtools. TanStack Query's devtools panel is genuinely
  useful; we lose that.

### Neutral

- If the app grows past the trigger conditions above, swapping in
  TanStack Query is a contained migration — components consume
  hooks, not the client. We can replace `usePolling` internals
  without touching JSX.

## Alternatives Considered

### Alternative A: TanStack Query

Industry standard for server-state. Rejected for _this scope_ on
YAGNI grounds — we'd use ~5% of the surface area and ship
~13 KB gzipped for it.

### Alternative B: SWR

Lighter than TanStack Query. Same YAGNI argument applies, plus
the ergonomics of revalidation triggers don't match our
visibility-aware pause requirement as cleanly as a hand-rolled
hook does.

### Alternative C: RTK Query

Couples us to Redux Toolkit, which we explicitly rejected in
ADR-002. Non-starter.

## AI involvement

Claude's instinct was to reach for TanStack Query immediately
("the standard choice"). Pushback: "list the features we'd
actually use." The list was short — fetch, polling, error state.
Each is one hook away. Decision is mine; the feature-by-feature
walk came faster with AI.

## References

- ADR-002 (Zustand over Context) — touched on this; this ADR makes it explicit.
- ADR-004 (polling hook design) — where polling actually lives.
