import type { ViewEntry } from '@/shared/api/schemas'
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
  if (error && entries.length === 0) return <ErrorState message={error.message} />
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
      {Array.from({ length: 8 }).map((_, i) => (
        <li
          key={`skel-${i.toString()}`}
          className="h-12 animate-pulse-soft border-t border-panteon-border bg-panteon-surface-2/30"
        />
      ))}
    </ol>
  )
}

function ErrorState({ message }: { message: string }): React.ReactElement {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300"
    >
      Failed to load leaderboard: {message}
    </div>
  )
}
