# ADR-010: Sticky self bar visibility via scroll listener (not IntersectionObserver)

- **Status:** Accepted
- **Date:** 2026-04-28
- **Deciders:** Mehmet Akif Arslan
- **Tags:** #frontend #components #performance

## Context

The hifi design ships a `StickySelfBar` pinned to the bottom of
the viewport whenever the player is outside the top 100. The
bar must **fade out** the moment the "Around You" cluster
scrolls into view — otherwise it sits over the cluster it points
to, which is visually awkward and accessibility-hostile.

The cluster is **conditionally rendered**: `me && me.rank > 100
&& <section ref={clusterRef}>...</section>`. The section mounts
and unmounts as polling responses change, and the `clusterRef`
is set asynchronously via the React ref callback or `useRef`.

## Decision

Use a **passive `scroll` + `resize` listener** on `window` that
reads `clusterRef.current.getBoundingClientRect()` on every
event. Visibility threshold:

```ts
const visible = rect.top < window.innerHeight * 0.7 && rect.bottom > 0
```

When `visible` flips true, set `data-visible="false"` on the bar
and apply Tailwind `opacity-0 translate-y-3 transition` for the
fade. The listener is registered inside a `useEffect` that
depends on `clusterRef`, with proper cleanup on unmount.

## Consequences

### Positive

- Works regardless of when the cluster mounts. The next scroll
  event picks it up.
- One listener per `StickySelfBar` instance. Bar mounts once.
- Trivial to test: stub `getBoundingClientRect` on the ref.

### Negative

- A scroll listener is more "noisy" than IntersectionObserver,
  which is fire-and-forget. Mitigation: `passive: true` ensures
  it doesn't block scrolling, and the work inside is one
  arithmetic comparison + one state set.
- If the user is scrolling continuously, React re-renders the
  bar each time `hidden` toggles. In practice the toggle happens
  at most twice per scroll session.

### Neutral

- We could later swap to IntersectionObserver if perf data shows
  scroll-listener overhead. Behavioural contract is the same.

## Alternatives Considered

### Alternative A: IntersectionObserver on the cluster

Rejected because the cluster is conditionally mounted. The
observer needs to be (re-)created every time the cluster mounts
or unmounts, and there's a brief window where the bar would
flash visible-then-hidden. Empirically — confirmed by the
upstream design prototype's note — IntersectionObserver was
"unreliable here because the cluster mounts conditionally."

### Alternative B: Compute visibility from `data-rank > 100` only

Hide the bar whenever the user's rank ≤ 100. Doesn't solve the
"cluster on screen" case for users who _are_ outside the top
100 but happen to scroll the cluster into view.

### Alternative C: CSS `position: fixed` + manual `display: none`

on cluster intersection

Same problem as A — needs an observer or scroll listener anyway.

## AI involvement

Claude flagged the conditional-mount edge case during the Design
phase before any code was written. The decision to use a scroll
listener (not IntersectionObserver) followed directly from the
design handoff README's documented rationale, and Claude
verified the same constraint applies here.

## References

- `design_handoff_leaderboard/README.md` — Sticky self bar
  section: "scroll listener — IntersectionObserver was
  unreliable here because the cluster mounts conditionally."
- `src/components/StickySelfBar/StickySelfBar.tsx` — the
  implementation.
