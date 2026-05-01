import { clsx } from 'clsx'

interface RankBadgeProps {
  rank: number
  size?: 'sm' | 'md' | 'lg'
  numeric?: boolean
}

const sizeClassName: Record<NonNullable<RankBadgeProps['size']>, string> = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

const numericTextClassName: Record<NonNullable<RankBadgeProps['size']>, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

function toneClassName(rank: number): string {
  if (rank === 1) return 'bg-prize-gold text-black'
  if (rank === 2) return 'bg-prize-silver text-black'
  if (rank === 3) return 'bg-prize-bronze text-white'
  return 'bg-panteon-surface-2 text-panteon-fg'
}

// The circle badge can't widen, so very large ranks are compacted
// (e.g. 1.0M) so the picker card layout doesn't blow out. The
// numeric (in-list) variant prefers full digits with grouping
// separators so adjacent ranks like 499,997 vs 499,998 stay
// distinguishable in the cluster.
function formatCircleRank(rank: number): string {
  if (rank >= 1_000_000) return `${(rank / 1_000_000).toFixed(1)}M`
  if (rank >= 10_000) return `${Math.floor(rank / 1_000).toString()}K`
  return rank.toString()
}

const NUMBER = new Intl.NumberFormat('en-US')

function formatNumericRank(rank: number): string {
  if (rank >= 10_000) return NUMBER.format(rank)
  return rank.toString().padStart(2, '0')
}

export function RankBadge({
  rank,
  size = 'md',
  numeric = false,
}: RankBadgeProps): React.ReactElement {
  if (numeric && rank > 3) {
    return (
      <span
        aria-hidden="true"
        className={clsx(
          'inline-block shrink-0 text-left font-mono font-medium tabular-nums text-panteon-muted',
          numericTextClassName[size],
        )}
      >
        {formatNumericRank(rank)}
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-mono font-semibold tabular-nums',
        sizeClassName[size],
        toneClassName(rank),
      )}
    >
      {formatCircleRank(rank)}
    </span>
  )
}
