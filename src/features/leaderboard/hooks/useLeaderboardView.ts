import { useRef } from 'react'
import { apiGet } from '@/shared/api/client'
import { CurrentResponseSchema, type CurrentResponse } from '@/shared/api/schemas'
import { stabilizeCurrentResponse } from '@/shared/api/structural-equal'
import { usePolling, type PollingState } from '@/shared/hooks/usePolling'

/**
 * Polling-backed view of the leaderboard for a given user. The hook
 * stabilizes the response object tree across ticks (see ADR-012):
 * if the wire payload is unchanged for an entry, the previous
 * reference is preserved so React Compiler memoization can short
 * the render at the row, podium, cluster, and sticky-bar levels.
 *
 * Stabilisation runs *inside* `usePolling` so the snapshot wrapper
 * `rebuildSnapshot` writes also keeps its reference across no-op
 * ticks — without that, `useSyncExternalStore` re-emits a fresh
 * wrapper every tick and this component re-runs even when the
 * data tree is identical. We additionally cache the wrapper at
 * this layer to absorb any case where data changes shape but the
 * stabilised content reduces to the previous value.
 */
export function useLeaderboardView(userId: string): PollingState<CurrentResponse> {
  const raw = usePolling<CurrentResponse>(
    `leaderboard:current:${userId}`,
    (signal) =>
      apiGet(`/leaderboard/current/${encodeURIComponent(userId)}`, CurrentResponseSchema, signal),
    { stabilize: stabilizeCurrentResponse },
  )

  const cachedRef = useRef<PollingState<CurrentResponse> | undefined>(undefined)
  const cached = cachedRef.current
  if (
    cached !== undefined &&
    cached.data === raw.data &&
    cached.error === raw.error &&
    cached.isLoading === raw.isLoading
  ) {
    return cached
  }
  cachedRef.current = raw
  return raw
}
