# ADR-003: Polling, not WebSockets

- **Status:** Accepted
- **Date:** 2026-04-24
- **Deciders:** Mehmet Akif Arslan
- **Tags:** #frontend #data-fetching #scale

## Context

The leaderboard is a near-real-time view of player ranks. The
question is: how fresh must it be, and at what infrastructure
cost?

The brief frames the system as "2M DAU idle game" — large scale,
but updates are not interactive (a click does not need to reflect
in another user's view in 50ms). A 5-second stale view is fine
for the user experience.

## Decision

We use **HTTP polling on a 5-second interval**, paused when the
tab is hidden via `document.visibilityState`, with an immediate
refetch on tab return.

## Consequences

### Positive

- No persistent connections to manage at 2M DAU scale.
- Stateless API — every request stands alone, plays nicely with
  horizontal scaling and cache layers.
- Visibility-aware pausing means an open-but-idle tab costs zero
  requests.
- Trivial to implement, trivial to debug, trivial to load-test.

### Negative

- Up to 5 seconds of staleness on rank updates. Acceptable per
  the product framing.
- N requests per N tabs per 5s. At 2M DAU with average 1 active
  tab and 50% concurrent, that is roughly 100k req/min — well
  within the API's headroom.

### Neutral

- We give up the "rank just changed" push experience. The
  visibility-return immediate refetch covers the most common case
  (user comes back to the tab, sees fresh data instantly).

## Alternatives Considered

### Alternative A: WebSockets (Socket.IO)

Push updates as they happen. Solves a problem we don't have
(sub-5s freshness) at a real cost (sticky sessions, connection
pool sizing, reconnection logic, scaling-out coordination,
operational overhead).

### Alternative B: Server-Sent Events

Lighter than WebSockets, still requires a long-lived connection
per tab. Same scale concerns, smaller toolkit.

### Alternative C: Long polling

Worst of both worlds — connection cost without the push
benefit.

## AI involvement

Claude initially proposed Socket.IO with full WebSocket
architecture. Pushback was a YAGNI argument: the brief does not
require sub-5s freshness, so the cost of WebSockets is paid for
no product benefit. Decision is mine.

## References

- ADR-001 (stack).
- `panteon-leaderboard-api` ADR-007 (forthcoming) mirrors this
  decision on the server side.
