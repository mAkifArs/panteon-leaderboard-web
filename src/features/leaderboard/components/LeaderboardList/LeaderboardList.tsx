import type { ViewEntry } from '@/shared/api/schemas'
import { ErrorState } from '@/shared/components/ErrorState'
import { SkeletonRow } from '@/shared/components/Skeleton'
import { LeaderboardRow } from '@/features/leaderboard/components/LeaderboardRow'
import { ColumnHeader } from './ColumnHeader'

interface LeaderboardListProps {
  entries: ViewEntry[]
  selfUserId: string
  loading: boolean
  error: Error | undefined
  selfRowRef?: React.Ref<HTMLLIElement>
}

export function LeaderboardList({
  entries,
  selfUserId,
  loading,
  error,
  selfRowRef,
}: LeaderboardListProps): React.ReactElement {
  if (loading && entries.length === 0) return <SkeletonList />
  if (error && entries.length === 0)
    return <ErrorState>Failed to load leaderboard: {error.message}</ErrorState>
  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-panteon-border bg-panteon-surface-3 p-6 text-sm text-panteon-muted">
        No earnings recorded for this week yet.
      </p>
    )
  }

  return (
    <ol
      role="table"
      className="overflow-hidden rounded-xl border border-panteon-border bg-panteon-surface-3"
    >
      <ColumnHeader />
      {entries.map((entry) => {
        const isSelf = entry.userId === selfUserId
        return (
          <LeaderboardRow
            key={entry.userId}
            entry={entry}
            variant={isSelf ? 'self' : entry.rank <= 3 ? 'top3' : 'normal'}
            rowRef={isSelf ? selfRowRef : undefined}
          />
        )
      })}
      <li role="status" aria-live="polite" className="sr-only">
        Showing {entries.length.toString()} players
      </li>
    </ol>
  )
}

function SkeletonList(): React.ReactElement {
  return (
    <ol
      className="overflow-hidden rounded-xl border border-panteon-border bg-panteon-surface-3"
      aria-busy="true"
      aria-live="polite"
    >
      <SkeletonRow count={8} />
    </ol>
  )
}

