import { useLeaderboard } from '@/hooks/useLeaderboard'
import { LeaderboardRow } from '@/components/LeaderboardRow'

interface LeaderboardListProps {
  selfUserId: string | null
}

export function LeaderboardList({ selfUserId }: LeaderboardListProps): React.ReactElement {
  const { data, error, isLoading } = useLeaderboard()

  if (isLoading && !data) return <SkeletonList />
  if (error && !data) return <ErrorState message={error.message} />
  if (!data) return <EmptyState />
  if (data.entries.length === 0) {
    return (
      <p className="rounded-xl border border-panteon-border bg-panteon-surface p-6 text-sm text-panteon-muted">
        No earnings recorded for this week yet.
      </p>
    )
  }

  return (
    <ol className="flex flex-col gap-2">
      {data.entries.map((entry) => (
        <LeaderboardRow
          key={entry.userId}
          entry={entry}
          variant={
            entry.externalId === selfUserId
              ? 'self'
              : entry.rank <= 3
                ? 'top3'
                : 'normal'
          }
        />
      ))}
    </ol>
  )
}

function SkeletonList(): React.ReactElement {
  return (
    <ol className="flex flex-col gap-2" aria-busy="true" aria-live="polite">
      {Array.from({ length: 8 }).map((_, i) => (
        <li
          key={`skel-${i.toString()}`}
          className="h-14 animate-pulse-soft rounded-xl border border-panteon-border bg-panteon-surface"
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

function EmptyState(): React.ReactElement {
  return (
    <p className="rounded-xl border border-panteon-border bg-panteon-surface p-6 text-sm text-panteon-muted">
      No data.
    </p>
  )
}
