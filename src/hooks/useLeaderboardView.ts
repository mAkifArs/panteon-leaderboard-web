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
 */
export function useLeaderboardView(userId: string): PollingState<CurrentResponse> {
  const raw = usePolling<CurrentResponse>(`leaderboard:current:${userId}`, (signal) =>
    apiGet(`/leaderboard/current/${encodeURIComponent(userId)}`, CurrentResponseSchema, signal),
  )
  const prevRef = useRef<CurrentResponse | undefined>(undefined)
  if (raw.data) {
    const stable = stabilizeCurrentResponse(prevRef.current, raw.data)
    prevRef.current = stable
    if (stable !== raw.data) {
      return { ...raw, data: stable }
    }
  }
  return raw
}
