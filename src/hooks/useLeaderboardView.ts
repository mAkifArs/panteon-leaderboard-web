import { useRef } from 'react'
import { apiGet } from '@/api/client'
import { CurrentResponseSchema, type CurrentResponse } from '@/api/schemas'
import { stabilizeCurrentResponse } from '@/lib/structural-equal'
import { usePolling, type PollingState } from './usePolling'

/**
 * Polling-backed view of the leaderboard for a given user. The hook
 * stabilizes the response object tree across ticks (see ADR-012):
 * if the wire payload is unchanged for an entry, the previous
 * reference is preserved so React Compiler memoization can short
 * the render at the row, podium, cluster, and sticky-bar levels.
 *
 * The wrapper itself (PollingState) is also cached: when the
 * stabilized data, error, and isLoading all match the previously
 * returned wrapper, we hand back the same wrapper reference. Without
 * this guard, every poll tick would return a fresh `{ data, error,
 * isLoading }` object even on a no-op tick, causing every consumer
 * of the hook to re-run.
 */
export function useLeaderboardView(userId: string): PollingState<CurrentResponse> {
  const raw = usePolling<CurrentResponse>(`leaderboard:current:${userId}`, (signal) =>
    apiGet(`/leaderboard/current/${encodeURIComponent(userId)}`, CurrentResponseSchema, signal),
  )
  const prevRef = useRef<CurrentResponse | undefined>(undefined)
  const cachedRef = useRef<PollingState<CurrentResponse> | undefined>(undefined)

  let next: PollingState<CurrentResponse> = raw
  if (raw.data) {
    const stable = stabilizeCurrentResponse(prevRef.current, raw.data)
    prevRef.current = stable
    if (stable !== raw.data) {
      next = { ...raw, data: stable }
    }
  }

  const cached = cachedRef.current
  if (
    cached !== undefined &&
    cached.data === next.data &&
    cached.error === next.error &&
    cached.isLoading === next.isLoading
  ) {
    return cached
  }
  cachedRef.current = next
  return next
}
