import { useOwnRank } from '@/hooks/useOwnRank'
import { LeaderboardRow } from '@/components/LeaderboardRow'

interface OwnRankClusterProps {
  userId: string | null
}

export function OwnRankCluster({ userId }: OwnRankClusterProps): React.ReactElement {
  const { data, error, isLoading } = useOwnRank(userId)

  if (!userId) {
    return (
      <Shell title="Your rank">
        <p className="text-sm text-panteon-muted">
          Pick a player to see their cluster.
        </p>
      </Shell>
    )
  }

  if (isLoading && !data) {
    return (
      <Shell title="Your rank">
        <SkeletonCluster />
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell title="Your rank">
        <p role="alert" className="text-sm text-red-300">
          Failed to load: {error.message}
        </p>
      </Shell>
    )
  }

  if (!data) {
    return (
      <Shell title="Your rank">
        <p className="text-sm text-panteon-muted">
          No earnings yet this week.
        </p>
      </Shell>
    )
  }

  return (
    <Shell
      title="Your rank"
      meta={`#${data.rank.toString()} of ${data.totalPlayers.toLocaleString('en-US')}`}
    >
      <ol className="flex flex-col gap-2">
        {data.cluster.map((entry) => (
          <LeaderboardRow
            key={entry.userId}
            entry={entry}
            variant={entry.externalId === userId ? 'self' : 'neighbour'}
          />
        ))}
      </ol>
    </Shell>
  )
}

function Shell({
  title,
  meta,
  children,
}: {
  title: string
  meta?: string
  children: React.ReactNode
}): React.ReactElement {
  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-panteon-border bg-panteon-surface p-4"
    >
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xs uppercase tracking-nav text-panteon-muted">{title}</h2>
        {meta && <span className="font-mono text-xs tabular-nums text-panteon-muted">{meta}</span>}
      </header>
      {children}
    </section>
  )
}

function SkeletonCluster(): React.ReactElement {
  return (
    <ol className="flex flex-col gap-2" aria-busy="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={`skel-${i.toString()}`}
          className="h-14 animate-pulse-soft rounded-xl border border-panteon-border bg-panteon-surface-2"
        />
      ))}
    </ol>
  )
}
