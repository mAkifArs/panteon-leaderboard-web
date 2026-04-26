import { ApiError, apiGet } from '@/api/client'
import { OwnRankResponseSchema, type OwnRankResponse } from '@/api/schemas'
import { usePolling, type PollingState } from './usePolling'

export function useOwnRank(userId: string | null): PollingState<OwnRankResponse | null> {
  return usePolling<OwnRankResponse | null>(
    userId ? `leaderboard:me:${userId}` : null,
    async (signal) => {
      if (!userId) return null
      try {
        return await apiGet(
          `/leaderboard/me/${encodeURIComponent(userId)}`,
          OwnRankResponseSchema,
          signal,
        )
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null
        throw err
      }
    },
  )
}
