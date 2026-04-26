import { clsx } from 'clsx'
import type { ViewEntry } from '@/api/schemas'
import { formatScore } from '@/lib/format'
import { RankBadge } from '@/components/RankBadge'

export type LeaderboardRowVariant = 'top3' | 'normal' | 'self' | 'neighbour'

interface LeaderboardRowProps {
  entry: ViewEntry
  variant: LeaderboardRowVariant
}

const variantClassName: Record<LeaderboardRowVariant, string> = {
  top3: 'bg-rank-normal-bg border-panteon-border',
  normal: 'bg-rank-normal-bg border-panteon-border',
  self: 'bg-rank-self-bg border-rank-self-border',
  neighbour: 'bg-rank-neighbour-bg border-panteon-border',
}

export function LeaderboardRow({ entry, variant }: LeaderboardRowProps): React.ReactElement {
  const isMedal = entry.rank <= 3
  const a11yLabel =
    `Rank ${entry.rank.toString()}: ${entry.username}, score ${formatScore(entry.score)}` +
    (variant === 'self' ? ' (you)' : '')

  return (
    <li
      aria-label={a11yLabel}
      className={clsx(
        'flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors',
        variantClassName[variant],
      )}
    >
      <RankBadge rank={entry.rank} size={variant === 'top3' && isMedal ? 'lg' : 'md'} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-panteon-fg">{entry.username}</span>
          {variant === 'self' && (
            <span className="rounded-full border border-rank-self-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-nav text-rank-self-text">
              You
            </span>
          )}
        </div>
      </div>

      <span className="font-mono text-sm tabular-nums text-panteon-fg">
        {formatScore(entry.score)}
      </span>
    </li>
  )
}
