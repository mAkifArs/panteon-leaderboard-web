import { clsx } from 'clsx'
import { Avatar, type AvatarRing } from '@/components/Avatar'
import { getInitials } from '@/lib/avatar'
import { flagFromCountry } from '@/lib/country'
import { formatCompact } from '@/lib/format'
import type { ViewEntry } from '@/api/schemas'

export type PodiumPlace = 1 | 2 | 3

interface PodiumCardProps {
  entry: ViewEntry
  place: PodiumPlace
}

const placeLabel: Record<PodiumPlace, string> = {
  1: '1st',
  2: '2nd',
  3: '3rd',
}

const placeAria: Record<PodiumPlace, string> = {
  1: 'First place',
  2: 'Second place',
  3: 'Third place',
}

const ringByPlace: Record<PodiumPlace, AvatarRing> = {
  1: 'gold',
  2: 'silver',
  3: 'bronze',
}

const pillBg: Record<PodiumPlace, string> = {
  1: 'bg-prize-gold text-black',
  2: 'bg-prize-silver text-black',
  3: 'bg-prize-bronze text-white',
}

const cardChrome: Record<PodiumPlace, string> = {
  1: 'border-prize-gold bg-gradient-to-b from-prize-gold/[0.06] to-panteon-surface to-60% hover:border-prize-gold md:min-h-[240px]',
  2: 'border-panteon-border bg-panteon-surface hover:border-prize-silver md:min-h-[200px]',
  3: 'border-panteon-border bg-panteon-surface hover:border-prize-bronze md:min-h-[180px]',
}

const usernameSize: Record<PodiumPlace, string> = {
  1: 'text-[14px] md:text-[18px]',
  2: 'text-[12px] md:text-[15px]',
  3: 'text-[12px] md:text-[15px]',
}

const avatarSize: Record<PodiumPlace, { mobile: number; desktop: number }> = {
  1: { mobile: 52, desktop: 72 },
  2: { mobile: 40, desktop: 56 },
  3: { mobile: 40, desktop: 56 },
}

export function PodiumCard({ entry, place }: PodiumCardProps): React.ReactElement {
  const isFirst = place === 1
  const sizes = avatarSize[place]
  return (
    <article
      aria-label={`${placeAria[place]}: ${entry.username}`}
      className={clsx(
        'relative flex flex-col items-center gap-2.5 rounded-xl border p-4 pt-5 md:p-5',
        'transition-[transform,border-color] duration-200 ease-out hover:-translate-y-1',
        cardChrome[place],
      )}
    >
      <span
        className={clsx(
          'absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.08em]',
          pillBg[place],
        )}
      >
        {placeLabel[place]}
      </span>

      {isFirst && (
        <svg
          aria-hidden="true"
          width="28"
          height="20"
          viewBox="0 0 28 20"
          className="-mt-1 text-prize-gold"
        >
          <path
            d="M2 18 L4 6 L9 12 L14 2 L19 12 L24 6 L26 18 Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
          <rect x="2" y="17" width="24" height="2" fill="currentColor" />
        </svg>
      )}

      <span className="md:hidden">
        <Avatar
          seed={entry.userId}
          initials={getInitials(entry.username)}
          size={sizes.mobile}
          ring={ringByPlace[place]}
        />
      </span>
      <span className="hidden md:inline-flex">
        <Avatar
          seed={entry.userId}
          initials={getInitials(entry.username)}
          size={sizes.desktop}
          ring={ringByPlace[place]}
        />
      </span>

      <div className="flex w-full min-w-0 flex-col items-center gap-0.5 text-center">
        <span className={clsx('truncate font-semibold text-panteon-fg', usernameSize[place])}>
          {entry.username}
        </span>
        <span className="inline-flex items-center justify-center gap-1 font-mono text-[11px] text-panteon-muted">
          <span aria-hidden="true">{flagFromCountry(entry.country)}</span>
          <span>{entry.country ?? '—'}</span>
        </span>
      </div>

      <div className="mt-auto flex w-full items-baseline justify-between border-t border-panteon-border pt-2.5">
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-panteon-muted-soft">
          Earned
        </span>
        <span className="font-mono text-[13px] font-medium tabular-nums text-panteon-fg">
          {formatCompact(entry.score)}
        </span>
      </div>
    </article>
  )
}
