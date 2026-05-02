# ADR-018: Offline indicator + online-event refetch

- **Status:** Accepted
- **Date:** 2026-05-02
- **Deciders:** Mehmet Akif Arslan
- **Tags:** #frontend #ux #polling #offline

## Context

A polling app that goes offline keeps showing the last successful
response — `useLeaderboardView` reads from `usePolling`'s registry,
and the registry preserves `data` across failed ticks (only `error`
is set). So the user already sees a sensible "frozen but coherent"
leaderboard when they lose connectivity. Two things were missing:

1. **No signal that the data is stale.** A user looking at a
   polling leaderboard while offline has no way to know they're
   seeing minute-old numbers. The page looks the same as when it
   was live.
2. **No fast-recovery path on reconnect.** When the browser comes
   back online, the user has to wait up to 5 seconds for the next
   scheduled tick before the leaderboard catches up. We already do
   the symmetric thing for tab visibility (ADR-003): when the tab
   becomes visible, the polling registry kicks an immediate
   refetch. The same pattern hadn't been wired for `online`.

The full "offline support" question — should the app still work
when there is no network at all, with a service worker caching
HTML/CSS/JS? — is a separate one, addressed under Alternative C
below and rejected.

## Decision

Two small additions, both in the existing polling/registry shape:

1. **`OfflineIndicator` component** at
   `src/shared/components/OfflineIndicator/`. Listens to
   `navigator.onLine` and the `online`/`offline` window events.
   Renders nothing while online. While offline, mounts a small
   icon button at the bottom-right (`fixed bottom-4 right-4`,
   `panteon-orange` ring, inline SVG WiFi-off icon) that reveals
   an explanatory popover on click:
   > **You are offline.** Showing the last known data. We'll
   > refresh as soon as you're back online.
   The popover dismisses on second click, on outside click, or
   automatically when connectivity returns.
2. **`online`-event refetch in `usePolling`** —
   `attachOnlineListener` mirrors the existing
   `attachVisibilityListener` (ADR-003). When the browser fires
   the `window.online` event, every active key in the registry
   runs `runTick` immediately, so reconnect → live data is sub-tick
   instead of "up to `intervalMs`."
3. **Skip the tick while offline** — `runTick` early-returns when
   `navigator.onLine === false`, mirroring the existing
   `document.visibilityState === 'hidden'` guard. Without this the
   timer keeps firing every `intervalMs` while offline and the
   browser network layer rejects each fetch — visible in devtools
   as a steady drumbeat of failed requests, and a flapping `error`
   state for any consumer watching it. Combined with the
   `online`-event listener above, the loop is: offline → no fetch,
   online again → immediate refetch + scheduled ticks resume.

Mount: `<OfflineIndicator />` lives in `src/App.tsx` outside
`<Routes>` so it's available on every route. It's after
`<SiteFooter />` in the JSX so it stacks visually above page
chrome via `z-50`.

## Consequences

### Positive

- Users get a clear, dismissible signal that the app is offline,
  without losing the last-known data they were looking at.
- Reconnect feels instant (next browser tick) instead of "up to 5
  seconds." Visibility and online events are now symmetric in the
  registry.
- No state container, no service worker, no cache layer — the
  feature is the visibility of an existing behaviour plus one new
  registry listener. ~80 lines plus tests.

### Negative

- The "online state" indicator is invisible to most users by
  design (we render nothing when online). A user who never sees
  the icon may not realise the app handles offline gracefully.
  Acceptable — the goal is to inform when something is wrong,
  not to advertise status when nothing is.
- `navigator.onLine` is famously imperfect: in some environments
  it reports `true` while individual requests still fail (captive
  portals, partial connectivity). The polling layer handles this
  correctly anyway — failed fetches keep the last `data` and set
  `error`. The indicator just won't fire in those cases. Documented
  here so future-me doesn't chase a "false positive online" bug.

### Neutral

- The `OfflineIndicator` lives in `shared/components/`. It's not
  feature-specific — any future feature with its own polling will
  benefit from the same indicator without changes.
- Vitest covers six cases: no-render-when-online, render-when-
  offline, popover toggle, online/offline event reactivity, popover
  collapse on reconnect, outside-click dismissal. Cypress smoke
  test (added 2026-05-03) walks the same online → offline →
  popover-click → online cycle by overriding `navigator.onLine`
  via `Object.defineProperty` on `cy.window()` and dispatching the
  `offline`/`online` events; less brittle in practice than the
  initial caveat suggested. Unit owns the contract; e2e owns the
  proof that the indicator is mounted at App level and reacts in
  a real browser.

## Alternatives Considered

### Alternative A: Sticky banner at the top of the page

A full-width "You are offline" banner in the page chrome. Rejected
— more invasive than the signal warrants. The leaderboard keeps
working; a banner permanently consuming layout space across the
top while the user reads the same data anyway is heavier UX than
the situation calls for. The icon button is dismissible and out
of the reading flow.

### Alternative B: Manual cache layer

Cache successful API responses in `localStorage` (or IndexedDB)
and read from cache on cold start when offline. Rejected — the
polling registry already preserves `data` in memory across ticks,
which is enough for the "stay offline mid-session" case. Cold-start
offline (open the app while disconnected) would need cache, but
this is a leaderboard app where any cached number older than ~30
seconds is misleading, not helpful. The cost (cache invalidation
logic, BigInt-safe serialisation, stale-data UX) outweighs the
benefit.

### Alternative C: Service worker + offline-capable PWA

Cache HTML/CSS/JS via a service worker so the app launches
without a network. Rejected — leaderboard data is inherently
live; an app that boots to a leaderboard you can't read is no
better than one that doesn't boot. A PWA shell would also pull in
Workbox/Vite-PWA tooling for a feature with no real user pull.
Reconsider only if the product grows offline-meaningful surfaces
(e.g. a personal stats page where day-old numbers are still
useful).

### Alternative D: Auto-dismiss the popover after N seconds

Open the popover automatically the first time the app goes
offline; auto-close after 5 seconds. Rejected — the popover is
explanatory text the user might still be reading. Auto-dismiss
makes a calm informational signal feel like a transient toast.
Manual dismiss + outside-click is the right shape for an
indicator the user controls.

## AI involvement

Claude proposed the offline question during the cross-cutting
audit and laid out the banner/icon/SW spectrum. The icon-with-
popover shape and "no banner" call were the user's; the
`online`-event symmetry with ADR-003 was Claude's catch on
review. Decision is mine.

## References

- `src/shared/components/OfflineIndicator/OfflineIndicator.tsx`
  — the indicator component
- `src/shared/hooks/usePolling.ts` — `attachOnlineListener`
  alongside the existing `attachVisibilityListener`
- `src/App.tsx` — mount point, alongside `ErrorBoundary` (ADR-017)
- ADR-003 — polling over WebSockets, including the
  visibility-aware tick pattern this ADR mirrors
- ADR-005 — thin fetch over TanStack Query, the parent decision
  that left the registry as the single source of polled state
