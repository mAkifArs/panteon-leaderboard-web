/**
 * Structural-equal helpers for polling responses.
 *
 * Zod `parse` produces a brand new object tree on every tick, even
 * when the wire JSON is identical. That breaks reference-based
 * memoization downstream — every consumer sees a "new" entry and
 * re-renders. These helpers walk the response and reuse the
 * previous object reference whenever the content hasn't changed,
 * so React Compiler (and any plain `useMemo`) can short-circuit.
 *
 * See ADR-012.
 *
 * Compare strategy: shallow per-field, primitive-only. Money values
 * (`score`, `pool`) are strings per CLAUDE.md invariant 1 — we only
 * compare them, never do arithmetic.
 */

import type { CurrentResponse, Meta, OwnRankPayload, ViewEntry } from '@/shared/api/schemas'

export function stabilizeViewEntry(prev: ViewEntry | undefined, next: ViewEntry): ViewEntry {
  if (!prev) return next
  if (
    prev.rank === next.rank &&
    prev.userId === next.userId &&
    prev.score === next.score &&
    prev.username === next.username &&
    prev.country === next.country
  ) {
    return prev
  }
  return next
}

function stabilizeEntries(prevList: ViewEntry[] | undefined, nextList: ViewEntry[]): ViewEntry[] {
  if (!prevList) return nextList
  const prevByUserId = new Map<string, ViewEntry>()
  for (const entry of prevList) {
    prevByUserId.set(entry.userId, entry)
  }
  let allSame = prevList.length === nextList.length
  const out: ViewEntry[] = nextList.map((next, i) => {
    const stable = stabilizeViewEntry(prevByUserId.get(next.userId), next)
    if (allSame && prevList[i] !== stable) allSame = false
    return stable
  })
  return allSame ? prevList : out
}

export function stabilizeMeta(prev: Meta | undefined, next: Meta): Meta {
  if (!prev) return next
  if (
    prev.isoWeek === next.isoWeek &&
    prev.weekStart === next.weekStart &&
    prev.weekEnd === next.weekEnd &&
    prev.pool === next.pool
  ) {
    return prev
  }
  return next
}

export function stabilizeOwnRankPayload(
  prev: OwnRankPayload | null | undefined,
  next: OwnRankPayload | null,
): OwnRankPayload | null {
  if (next === null) return null
  if (!prev) return next
  const cluster = stabilizeEntries(prev.cluster, next.cluster)
  if (
    prev.rank === next.rank &&
    prev.totalPlayers === next.totalPlayers &&
    cluster === prev.cluster
  ) {
    return prev
  }
  return { rank: next.rank, totalPlayers: next.totalPlayers, cluster }
}

export function stabilizeCurrentResponse(
  prev: CurrentResponse | undefined,
  next: CurrentResponse,
): CurrentResponse {
  if (!prev) return next
  const meta = stabilizeMeta(prev.meta, next.meta)
  const entries = stabilizeEntries(prev.top.entries, next.top.entries)
  const top =
    prev.top.count === next.top.count && entries === prev.top.entries
      ? prev.top
      : { count: next.top.count, entries }
  const me = stabilizeOwnRankPayload(prev.me, next.me)
  if (meta === prev.meta && top === prev.top && me === prev.me) {
    return prev
  }
  return { meta, top, me }
}
