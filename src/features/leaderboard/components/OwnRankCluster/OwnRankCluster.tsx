import type { OwnRankPayload } from '@/shared/api/schemas'
import { ErrorState } from '@/shared/components/ErrorState'
import { SkeletonRow } from '@/shared/components/Skeleton'
import { LeaderboardRow } from '@/features/leaderboard/components/LeaderboardRow'

interface OwnRankClusterProps {
  me: OwnRankPayload | null
  userId: string
  loading: boolean
  error: Error | undefined
}

const containerClass =
  'overflow-hidden rounded-xl border border-panteon-border bg-panteon-surface-3'

export function OwnRankCluster({
  me,
  userId,
  loading,
  error,
}: OwnRankClusterProps): React.ReactElement {
  if (loading && me === null && !error) {
    return <SkeletonCluster />
  }

  if (error && me === null) {
    return (
      <div className={`${containerClass} p-4`}>
        <ErrorState variant="compact">Failed to load: {error.message}</ErrorState>
      </div>
    )
  }

  if (me === null) {
    return (
      <div className={`${containerClass} p-6`}>
        <p className="text-sm text-panteon-muted">
          No earnings yet this week. Play a round to claim a rank.
        </p>
      </div>
    )
  }

  return (
    <ol role="table" className={containerClass}>
      {me.cluster.map((entry) => (
        <LeaderboardRow
          key={entry.userId}
          entry={entry}
          variant={entry.userId === userId ? 'self' : 'neighbour'}
        />
      ))}
    </ol>
  )
}

function SkeletonCluster(): React.ReactElement {
  return (
    <ol className={containerClass} aria-busy="true">
      <SkeletonRow count={6} />
    </ol>
  )
}
