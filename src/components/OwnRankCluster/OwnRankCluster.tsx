import type { OwnRankPayload } from '@/api/schemas'
import { LeaderboardRow } from '@/components/LeaderboardRow'

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
      <div className={`${containerClass} p-4`} role="alert">
        <p className="text-sm text-red-300">Failed to load: {error.message}</p>
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
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={`skel-${i.toString()}`}
          className="h-12 animate-pulse-soft border-t border-panteon-border bg-panteon-surface-2/30"
        />
      ))}
    </ol>
  )
}
