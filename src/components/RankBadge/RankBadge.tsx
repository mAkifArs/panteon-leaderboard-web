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

const numericWidthClassName: Record<NonNullable<RankBadgeProps['size']>, string> = {
  sm: 'w-7 text-xs',
  md: 'w-10 text-sm',
  lg: 'w-12 text-base',
}

function toneClassName(rank: number): string {
  if (rank === 1) return 'bg-prize-gold text-black'
  if (rank === 2) return 'bg-prize-silver text-black'
  if (rank === 3) return 'bg-prize-bronze text-white'
  return 'bg-panteon-surface-2 text-panteon-fg'
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
          'inline-block shrink-0 text-center font-mono font-medium tabular-nums text-panteon-muted',
          numericWidthClassName[size],
        )}
      >
        {rank.toString().padStart(2, '0')}
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
      {rank}
    </span>
  )
}
