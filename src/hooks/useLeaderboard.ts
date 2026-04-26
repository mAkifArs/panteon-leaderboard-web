import { apiGet } from '@/api/client'
import { TopResponseSchema, type TopResponse } from '@/api/schemas'
import { usePolling, type PollingState } from './usePolling'

export function useLeaderboard(): PollingState<TopResponse> {
  return usePolling<TopResponse>('leaderboard:top', (signal) =>
    apiGet('/leaderboard/top', TopResponseSchema, signal),
  )
}
