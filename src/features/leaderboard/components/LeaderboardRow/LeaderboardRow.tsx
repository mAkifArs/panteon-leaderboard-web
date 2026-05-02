import { clsx } from 'clsx'
import type { ViewEntry } from '@/shared/api/schemas'
import { formatCompact, formatScore } from '@/shared/lib/format'
import { getInitials } from '@/shared/lib/avatar'
import { flagFromCountry } from '@/shared/lib/country'
import { Avatar, type AvatarRing } from '@/shared/components/Avatar'
import { RankBadge } from '@/features/leaderboard/components/RankBadge'
import { LIST_GRID, LIST_ROW_GAP, LIST_ROW_PADDING } from '@/features/leaderboard/components/LeaderboardList/grid'

export type LeaderboardRowVariant = 'top3' | 'normal' | 'self' | 'neighbour'

interface LeaderboardRowProps {
  entry: ViewEntry
  variant: LeaderboardRowVariant
  rowRef?: React.Ref<HTMLLIElement> | undefined
  className?: string | undefined
}

const baseRowClass = `grid items-center border-t border-panteon-border ${LIST_GRID} ${LIST_ROW_GAP} ${LIST_ROW_PADDING}`

const variantClass: Record<LeaderboardRowVariant, string> = {
  top3: 'border-l-2 hover:bg-rank-neighbour-bg',
  normal: 'border-l-2 border-l-panteon-border hover:bg-rank-neighbour-bg',
  self: 'border-l-2 border-l-panteon-orange bg-gradient-to-r from-panteon-orange/[0.12] to-panteon-orange/[0.02]',
  neighbour: 'border-l-2 border-l-panteon-border bg-rank-neighbour-bg',
}

const medalLeftBorderClass: Record<1 | 2 | 3, string> = {
  1: 'border-l-prize-gold',
  2: 'border-l-prize-silver',
  3: 'border-l-prize-bronze',
}

function avatarRing(variant: LeaderboardRowVariant, rank: number): AvatarRing {
  if (variant === 'self') return 'self'
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'bronze'
  return 'none'
}

export function LeaderboardRow({
  entry,
  variant,
  rowRef,
  className,
}: LeaderboardRowProps): React.ReactElement {
  const isMedal = entry.rank <= 3
  const flag = flagFromCountry(entry.country)
  const a11yLabel =
    `Rank ${entry.rank.toString()}: ${entry.username}, score ${formatScore(entry.score)}` +
    (variant === 'self' ? ' (you)' : '')

  const top3LeftBorder = (() => {
    if (variant !== 'top3') return ''
    if (entry.rank === 1) return medalLeftBorderClass[1]
    if (entry.rank === 2) return medalLeftBorderClass[2]
    if (entry.rank === 3) return medalLeftBorderClass[3]
    return ''
  })()

  return (
    <li
      ref={rowRef}
      role="row"
      aria-label={a11yLabel}
      className={clsx(
        baseRowClass,
        'transition-colors',
        variantClass[variant],
        top3LeftBorder,
        className,
      )}
    >
      <RankBadge rank={entry.rank} size={isMedal ? 'md' : 'sm'} numeric={!isMedal} />

      <Avatar
        seed={entry.userId}
        initials={getInitials(entry.username)}
        size={isMedal ? 40 : 32}
        ring={avatarRing(variant, entry.rank)}
      />

      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-panteon-fg md:text-[15px]">
            {entry.username}
          </span>
          {variant === 'self' && (
            <span className="rounded-sm bg-panteon-orange px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white">
              You
            </span>
          )}
        </div>
        {/* Mobile: meta strip with flag + country code */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-panteon-muted-soft md:hidden">
          {entry.country && (
            <span>
              <span aria-hidden="true">{flag}</span> {entry.country}
            </span>
          )}
        </div>
        {/* Desktop: user id under the username */}
        <span className="hidden font-mono text-[11px] tabular-nums text-panteon-muted-soft md:inline">
          {entry.userId}
        </span>
      </div>

      <span className="hidden items-center gap-1 md:inline-flex">
        <span aria-hidden="true" className="text-[16px] leading-none">
          {flag}
        </span>
        <span className="font-mono text-[10px] tracking-[0.05em] text-panteon-muted">
          {entry.country ?? '—'}
        </span>
      </span>

      <span className="hidden whitespace-nowrap text-right font-mono text-[14px] font-medium tabular-nums text-panteon-fg md:inline">
        {formatScore(entry.score)}
      </span>

      {/* Mobile-only score (compact) lives in the rightmost mobile column */}
      <span className="text-right font-mono text-[12px] font-medium tabular-nums text-panteon-fg md:hidden">
        {formatCompact(entry.score)}
      </span>
    </li>
  )
}
