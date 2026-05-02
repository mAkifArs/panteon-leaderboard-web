# ADR-016: Feature-based folder structure

- **Status:** Accepted (revised same-day — see Revision History)
- **Date:** 2026-05-02
- **Deciders:** Mehmet Akif Arslan
- **Tags:** #frontend #architecture #refactor

## Context

`src/` grew under a flat layout: every component sits side-by-side
under `components/`, every hook under `hooks/`, and so on across
`api/`, `lib/`, `pages/`. After the hifi redesign and the post-ADR-015
simplification, the tree looks like this:

```
src/components/   — 15 component folders
src/hooks/        — 4 hooks
src/lib/          — 5 utility modules
src/api/          — 2 files
src/pages/        — 2 files
```

Three problems showed up in code review:

1. **Reusable vs. feature-local is invisible.** `Avatar` is used by
   three different leaderboard pieces and is genuinely a UI
   primitive; `LeaderboardRow` is single-purpose. They live in the
   same folder. A new reader cannot tell the difference at a glance.
2. **The case study calls out reusable components as a design
   axis.** Treating reusability as an architectural property —
   instead of an in-line decision — is the cleaner answer. We need a
   structural place for "this is reusable" to live.
3. **Future features have no obvious home.** If a tournament view
   or a season archive ships next, the flat layout would force
   every new component to mix with the leaderboard's components.
   The directory itself stops communicating what the app does.

The flat layout was the right starting shape. It is no longer.

## Decision

Reorganize `src/` into three top-level concerns: **pages**,
**features**, and **shared**:

```
src/
  pages/                  # thin route entries — one file per route
    HomePage.tsx
    LeaderboardPage.tsx
  features/               # implementation modules (multi-file domains)
    leaderboard/
      components/
      hooks/
      lib/
  shared/                 # cross-feature primitives
    api/
    components/
    hooks/
    lib/
  App.tsx
  main.tsx
  index.css
  vite-env.d.ts
```

The split is by **role**, not by domain:

- **`pages/`** is for route entries. A page composes feature
  modules and wires them into a route; it owns no implementation
  detail of its own beyond a bit of layout glue. `HomePage` is a
  static panteon.games clone; `LeaderboardPage` composes
  `UserPicker`, `HeroBanner`, `Podium`, `LeaderboardList`,
  `OwnRankCluster`, `StickySelfBar`. Both are route-level
  concerns, both live in `pages/`.
- **`features/<name>/`** is for an implementation module — a
  domain that has multiple parts (components, hooks, lib).
  Keeping pages out of `features/` means a feature folder
  contains only the parts a page (or another feature) imports;
  the route entry is one level up where `App.tsx` can find it.
- **`shared/`** is for primitives used across features (or
  designed to be).

A module belongs in `shared/` when it is **already used by more
than one feature** *or* when it is a primitive whose purpose is
feature-agnostic (e.g. `usePolling` — only one caller today, but
its design is cross-feature). Anything else stays in its feature
folder. Promotion to `shared/` is a one-line `git mv` when a second
caller appears; demotion is the same.

Concrete classification:

- **`pages/`**: `HomePage`, `LeaderboardPage`.
- **`shared/components/`**: `Avatar`, `SiteHeader`, `SiteFooter`.
  Avatar is used by `LeaderboardRow`, `PodiumCard`, `StickySelfBar`
  — already cross-component within leaderboard, and obviously
  reusable for any future profile surface. Header/footer are
  app-level layout (`App.tsx`).
- **`shared/hooks/`**: `usePolling`. Module-scoped registry
  primitive (ADR-004); feature-agnostic by design.
- **`shared/api/`**: `client.ts`, `schemas.ts`. One API surface, one
  set of schemas — there is no per-feature API.
- **`shared/lib/`**: `format`, `avatar` (hue/initials helpers),
  `country`, `structural-equal`. Pure utilities, no leaderboard
  semantics. `structural-equal` imports types from `shared/api/`,
  which is fine — `shared/lib → shared/api` is a normal direction.
- **`features/leaderboard/`**: everything else that backs the
  leaderboard view — `LeaderboardList`, `LeaderboardRow`,
  `OwnRankCluster`, `Podium`, `StickySelfBar`, `RankBadge`,
  `HeroBanner`, `CountdownToReset`, `LivePulse`, `PrizePoolInfo`,
  `StatCard`, `UserPicker`, plus `useLeaderboardView`,
  `useSampleUsers`, `useUserId`, and `iso-week`.

Path alias `@/` (vite.config.ts:17-21, tsconfig.app.json:27-29) is
preserved. Only the right-hand side of imports changes — for
example `@/components/Avatar` becomes `@/shared/components/Avatar`,
`@/hooks/useLeaderboardView` becomes
`@/features/leaderboard/hooks/useLeaderboardView`. No code logic
changes; this is a pure refactor.

## Consequences

### Positive

- Reusability is structural, not editorial. A component lives in
  `shared/` only because at least one cross-feature caller exists
  (or it is a primitive). Reading the tree answers "what is
  reusable here?" in seconds.
- Adding a second feature is a `mkdir features/<name>` — no
  pre-existing junk drawer to navigate around.
- Sets up the coming reusable-components task: the inventory of
  "what should we expose to the design system" is now literally
  the contents of `shared/components/`.
- Test files travel with their subjects (each test stays next to
  the unit it tests), so colocation is preserved.

### Negative

- One-time churn: every existing import path inside `src/` changes
  string. Mitigated by the `@/` alias — no relative path rewrites,
  every change is a clean string replace.
- Promotions and demotions between `features/` and `shared/`
  require a `git mv` and a few import updates. Acceptable cost;
  the rule for when to do it is clear (cross-feature caller appears
  or disappears).

### Neutral

- Cypress, ESLint, Vitest setup, `index.html`, and `public/` do
  not import from `src/` directly, so they are unaffected.
- Each component folder keeps its `index.ts` re-export pattern.
  Imports continue to point at the folder, not the file inside.

## Alternatives Considered

### Alternative A: Keep the flat layout

Lowest effort. Loses every benefit listed above — reusability stays
invisible, future features have no obvious home, the case-study
"reusable components" axis stays an in-prose claim. Rejected.

### Alternative B: Type-based grouping inside features
(`features/leaderboard/{ui,state,api,utils}/`)

Splits a feature by concern instead of by feature/shared boundary.
Looks tidy but repeats the existing problem one level down — every
feature would gain its own flat `ui/` folder. Rejected — the axis
that matters is feature vs. shared, not concern.

### Alternative C: Promote everything cross-component to `shared/`
(e.g. `RankBadge`, since multiple leaderboard pieces use it)

Pulls leaderboard-only primitives out of the leaderboard. The rule
"shared = used by ≥2 features" stays clean only if "feature" is the
unit. `RankBadge` is used by three leaderboard parts but no other
feature; it stays in `features/leaderboard/components/`. Rejected.

### Alternative D: Pages live inside their feature
(`features/leaderboard/pages/LeaderboardPage.tsx`,
`features/home/pages/HomePage.tsx`)

The first cut of this ADR took this shape, on a "boundary, not size"
argument. It collapsed under its own weight: `features/home/` had
exactly one file, three folders deep, with no other home parts to
keep it company. A folder whose only purpose is to hold one file is
scaffolding, not a feature. Worse, it forced an asymmetry where a
"feature" could mean either a multi-part implementation module
(leaderboard) or a single page (home). Rejected — pages live in
`pages/`, features are the implementation modules they compose.

## Revision History

- **2026-05-02 (initial):** Pages lived inside their feature
  folder (`features/leaderboard/pages/`, `features/home/pages/`).
  Argued from "tutarlılık" — every page in the same shape.
- **2026-05-02 (same-day revision):** Moved pages out to
  `src/pages/`. The single-file `features/home/` was the visible
  failure mode — a feature folder with one page in it is just a
  page in disguise. Pages are route-entry concerns, separate
  from feature implementations. The `pages/feature/shared` split
  recorded above is the durable shape.

## AI involvement

Claude proposed the reorg during a post-redesign review and mapped
the import dependencies before any code moved (no relative imports,
all `@/` aliases — clean string-replace path). The first cut put
pages inside their feature folders; the user pushed back on
`features/home/` as a one-file folder with no obvious mantığı, and
on review the page-as-feature-content idea didn't survive. Same-day
revision moved pages out. Decision is mine.

## References

- ADR-004 — polling hook design (`usePolling` in shared/hooks/).
- ADR-014 — drop Zustand; polling registry suffices.
- `vite.config.ts:17-21`, `tsconfig.app.json:27-29` — `@/` alias
  config that makes the rename a string-replace.
