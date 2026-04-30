# AI Workflow — Frontend (Web)

Companion to the API repo's `AI_WORKFLOW.md`. Read that one first
for the overall philosophy, tooling, and pre-code planning. This
document focuses on the frontend-specific application of the same
operating principle.

---

## The operating principle (recap)

**AI writes drafts. I own decisions and understanding.** Three
passes for every non-trivial piece: Discussion → Decision →
Integration. Plan mode does not replace Discussion; it answers
"how", not "why".

This applies on the frontend too — maybe more, because UI is
where shallow AI output is hardest to spot. Code that _looks_
right can have accessibility holes, re-render storms, or
component APIs that fall apart on the second use case.

---

## Tooling for this repo

- Claude Code (Opus 4.7) in a **dedicated cmux pane**, separate
  from the backend session. Mixing contexts caused the model to
  cross-pollinate concerns once — `useState` showed up in a
  Node route handler. Isolated sessions, isolated minds.
- **react-scan** in dev mode. When Claude proposes memoisation,
  I open react-scan to verify whether it actually reduces
  re-renders or is cargo-cult optimisation.
- **No Cursor, no Copilot.** Inline suggestions interrupt the
  Discussion → Decision rhythm.

---

## Where AI accelerated me

I have strong React experience but had not built a leaderboard
UI with this specific shape (top-100 + own-rank cluster +
polling + reset countdown) before. AI helped me ramp on:

- **react-window virtualisation** trade-offs. I asked Claude
  _"at what list size does virtualisation pay off"_ before
  reaching for it. Answer: not at 100 rows. Plain rendering
  ships, virtualisation skipped.
- **Polling-vs-WebSockets** pros and cons enumeration. The
  decision (polling) is mine and documented in ADR-003; the
  pros/cons list came faster with AI.
- **Tailwind token taxonomy** for a leaderboard (`prize-gold`,
  `prize-silver`, `prize-bronze`, `rank-self-bg`, etc.) — I
  drafted with Claude, then trimmed to half the size.

These would each have cost me an evening of research. With AI
they cost me an hour of reading-and-deciding.

---

## Component API design — discussion-first

Component APIs are where shallow AI output hurts most because
the cost surfaces _the second time you reuse the component_,
not the first. Every component with non-trivial API ran through
Discussion before code:

### `<LeaderboardRow>`

```tsx
<LeaderboardRow entry={entry} variant="top3" | "normal" | "self" | "neighbour" />
```

Discussion question I asked Claude: _"would you build this as one
component with a variant prop, or four separate components?"_
Claude initially leaned toward four. After walking through the
shared structure (90% identical), the variant-prop version won.
This is a Decision I can defend, not a default.

### `<RankBadge>`

`<RankBadge rank={number} size="sm" | "md" | "lg" />` — pure,
stateless. Claude proposed an `animated` prop for a shimmer on
rank 1. Removed: animation state in a component API that only
applies to one edge case is API rot waiting to happen.

### `<OwnRankCluster>`

Always 6 rows. The window slides depending on the player's
position:

- Rank 1: rows 1–6 (self + 5 below)
- Rank 2: rows 1–6 (1 above + self + 4 below)
- Rank 50: rows 47–52 (3 above + self + 2 below)
- Last rank: last 6 rows

This shifting-window logic is where Claude's first draft returned
`null` for missing positions. Discussion fixed it: the rule is
"always 6 rows, composition shifts" — coded once, tested for all
five edge cases.

### `<CountdownToReset>`

Server sends the reset timestamp; client formats. No client-side
clock assumptions. One `setInterval`, cleaned up on unmount.

---

## State management — Zustand, not Context

Discussion: _"if 100 rows subscribe to the same Context, what
happens on every leaderboard tick?"_ Answer: 100 re-renders.
Zustand with selectors gives O(1) re-renders per tick — only the
row whose data changed.

react-scan confirmed this in practice. Decision documented in
ADR-002.

---

## Data fetching — polling, not WebSockets

The brief does not require sub-second updates. 5-second polling
with visibility-aware pause is the quiet, cheap, scalable
solution. WebSockets at 2M DAU is an infra problem that does
not need solving for this case.

Claude initially proposed Socket.IO. Rejected on YAGNI grounds.
ADR-003.

---

## Accessibility — non-negotiable

Discussion question I asked early: _"what are the three things
most React leaderboards get wrong on accessibility?"_ Answer:
`<div onClick>` instead of buttons, no rank context for screen
readers, no keyboard nav for the own-rank cluster.

I wrote them all into the `a11y-patterns` skill so every future
session inherits the same baseline. This is the same leverage
the backend repo gets from `postgres-patterns` and
`redis-patterns`: codify once, apply everywhere.

---

## What I did without AI

- Component API taxonomy and variant naming.
- Mobile vs desktop sticky-cluster asymmetry (top on mobile,
  bottom on desktop — based on thumb-reach testing).
- Tailwind design token palette.
- The Discussion → Decision → Integration discipline itself.
- The skill set in `.claude/skills/` that frames every future
  session.

## What I did with AI

- Vite + TS + Tailwind + Zustand scaffold.
- Initial component JSX/CSS drafts (read line-by-line).
- react-window integration boilerplate (parked unused for now).
- Animation timing and easing curves.
- Test fixtures.
- This document — structure mine, prose drafted together,
  edited line-by-line.

---

## Honest summary

I could build this UI without AI. I could not build it at this
quality, with this many edge cases handled, in this window.
AI accelerates ramp-up on unfamiliar patterns (react-scan
verification, virtualisation trade-offs) and bulk drafting
(scaffolds, fixtures). Decisions stay mine, defensible in a
review, traceable in ADRs.

Same principle as the backend repo: **AI as an accelerant on
understanding, not a substitute for it.**
