import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import type { OwnRankPayload } from '@/shared/api/schemas'
import { Avatar } from '@/shared/components/Avatar'
import { RankBadge } from '@/features/leaderboard/components/RankBadge'
import { getInitials } from '@/shared/lib/avatar'
import { flagFromCountry } from '@/shared/lib/country'
import { formatCompact, formatScore } from '@/shared/lib/format'

interface StickySelfBarProps {
  me: OwnRankPayload
  userId: string
  targetEl: HTMLElement | null
  onJump: () => void
}

const NUMBER = new Intl.NumberFormat('en-US')

export function StickySelfBar({
  me,
  userId,
  targetEl,
  onJump,
}: StickySelfBarProps): React.ReactElement | null {
  const selfEntry = me.cluster.find((entry) => entry.userId === userId) ?? null
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (!targetEl) {
      setHidden(false)
      return
    }
    const check = (): void => {
      const rect = targetEl.getBoundingClientRect()
      const vh = window.innerHeight
      // Hide whenever any part of the target intersects the viewport —
      // self row in the top-100 list, or the "Around You" cluster.
      // The bar exists to lead the user *to* the target; once the target
      // is on screen, the bar is redundant.
      const intersects = rect.top < vh && rect.bottom > 0
      setHidden(intersects)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [targetEl])

  if (!selfEntry) return null

  const flag = flagFromCountry(selfEntry.country)

  return (
    <div
      data-testid="sticky-self-bar"
      data-visible={hidden ? 'false' : 'true'}
      className={clsx(
        'pointer-events-none sticky bottom-4 z-30 mt-6 w-full',
        'duration-250 transition-[opacity,transform]',
        hidden ? 'translate-y-3 opacity-0' : 'translate-y-0 opacity-100',
      )}
    >
      <div
        className={clsx(
          'shadow-self-bar pointer-events-auto grid items-center rounded-xl border border-l-2 border-panteon-orange bg-panteon-surface/[0.94] backdrop-blur-md',
          'grid-cols-[32px_32px_1fr_auto_auto] gap-2.5 p-3',
          'md:grid-cols-[48px_44px_1fr_auto_160px_auto] md:gap-3.5 md:p-4',
        )}
      >
        <RankBadge rank={me.rank} size="sm" numeric={me.rank > 3} />
        <Avatar
          seed={selfEntry.userId}
          initials={getInitials(selfEntry.username)}
          size={32}
          ring="self"
        />

        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-panteon-fg md:text-[15px]">You</span>
            <span className="rounded-sm bg-panteon-orange px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white">
              Your rank
            </span>
          </div>
          <span className="font-mono text-[10px] tabular-nums text-panteon-muted-soft md:text-[11px]">
            of {NUMBER.format(me.totalPlayers)} players
          </span>
        </div>

        <span className="hidden items-center gap-1 md:inline-flex">
          <span aria-hidden="true" className="text-[16px] leading-none">
            {flag}
          </span>
          <span className="font-mono text-[10px] tracking-[0.05em] text-panteon-muted">
            {selfEntry.country ?? '—'}
          </span>
        </span>

        <span className="hidden whitespace-nowrap text-right font-mono text-[14px] font-medium tabular-nums text-panteon-fg md:inline">
          {formatScore(selfEntry.score)}
        </span>
        <span className="text-right font-mono text-[12px] font-medium tabular-nums text-panteon-fg md:hidden">
          {formatCompact(selfEntry.score)}
        </span>

        <button
          type="button"
          onClick={onJump}
          aria-label="Jump to your rank"
          className="whitespace-nowrap rounded-md bg-panteon-orange px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.06em] text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-panteon-orange focus-visible:ring-offset-2 focus-visible:ring-offset-panteon-bg md:px-3 md:py-2 md:text-[10px]"
        >
          <span className="md:hidden">Jump ↓</span>
          <span className="hidden md:inline">Jump to me ↓</span>
        </button>
      </div>
    </div>
  )
}
