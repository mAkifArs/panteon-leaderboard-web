import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { clsx } from 'clsx'
import type { ViewEntry } from '@/api/schemas'
import { LeaderboardRow } from '@/components/LeaderboardRow'
import { ColumnHeader } from './ColumnHeader'

interface LeaderboardListProps {
  entries: ViewEntry[]
  selfUserId: string
  loading: boolean
  error: Error | undefined
  selfRowRef?: React.Ref<HTMLLIElement>
}

export interface LeaderboardListHandle {
  /**
   * Reveal at least up to the row whose `entry.rank` matches.
   * Pages-of-PAGE_SIZE rounded up so the row sits inside a
   * full reveal step (no half-revealed pages).
   */
  ensureRankVisible: (rank: number) => void
}

const PAGE_SIZE = 20
// Small reveal latency so the user actually *sees* the loader
// hit the viewport before more rows pop in. Without this the
// expand feels instant and the pagination is invisible.
const REVEAL_DELAY_MS = 350

export const LeaderboardList = forwardRef<LeaderboardListHandle, LeaderboardListProps>(
  function LeaderboardList({ entries, selfUserId, loading, error, selfRowRef }, ref) {
    const [revealed, setRevealed] = useState(PAGE_SIZE)
    const [revealLoading, setRevealLoading] = useState(false)
    const sentinelRef = useRef<HTMLLIElement | null>(null)
    const revealTimerRef = useRef<number | null>(null)
    // Where the previous reveal left off — rows from this index
    // up to `revealed` get the slide-in animation. ensureRankVisible
    // jumps can cover multiple pages; the animation marks them all.
    const prevRevealedRef = useRef(PAGE_SIZE)

    // Reset reveal when the entries identity actually changes
    // (week rollover, user switch). ADR-012's structural-equal
    // contract preserves the array reference across no-op ticks,
    // so this effect only fires on real list changes — not every
    // poll.
    useEffect(() => {
      setRevealed(PAGE_SIZE)
      prevRevealedRef.current = PAGE_SIZE
      setRevealLoading(false)
      if (revealTimerRef.current !== null) {
        window.clearTimeout(revealTimerRef.current)
        revealTimerRef.current = null
      }
    }, [entries])

    useEffect(() => {
      return () => {
        if (revealTimerRef.current !== null) {
          window.clearTimeout(revealTimerRef.current)
        }
      }
    }, [])

    useImperativeHandle(
      ref,
      () => ({
        ensureRankVisible: (rank) => {
          const idx = entries.findIndex((e) => e.rank === rank)
          if (idx === -1) return
          const needed = Math.ceil((idx + 1) / PAGE_SIZE) * PAGE_SIZE
          setRevealed((prev) => {
            if (needed <= prev) return prev
            prevRevealedRef.current = prev
            return Math.min(needed, entries.length)
          })
          // Skip the loading delay for explicit jumps — the user
          // is asking to *go there*, not browse.
          setRevealLoading(false)
          if (revealTimerRef.current !== null) {
            window.clearTimeout(revealTimerRef.current)
            revealTimerRef.current = null
          }
        },
      }),
      [entries],
    )

    const visible = useMemo(() => entries.slice(0, revealed), [entries, revealed])
    const hasMore = revealed < entries.length

    useEffect(() => {
      if (!hasMore) return
      const el = sentinelRef.current
      if (!el) return
      const io = new IntersectionObserver(
        (observed) => {
          for (const entry of observed) {
            if (!entry.isIntersecting) continue
            if (revealTimerRef.current !== null) continue
            setRevealLoading(true)
            revealTimerRef.current = window.setTimeout(() => {
              revealTimerRef.current = null
              setRevealLoading(false)
              setRevealed((prev) => {
                prevRevealedRef.current = prev
                return Math.min(prev + PAGE_SIZE, entries.length)
              })
            }, REVEAL_DELAY_MS)
          }
        },
        // No rootMargin: tetiklenme dibe ulaşınca olsun ki kullanıcı
        // loader'ı görsün, page'in pre-fetch'lenmesi gizli kalmasın.
        { rootMargin: '0px', threshold: 0.01 },
      )
      io.observe(el)
      return () => {
        io.disconnect()
      }
    }, [hasMore, entries.length])

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
        {visible.map((entry, idx) => {
          const isSelf = entry.userId === selfUserId
          const isFreshlyRevealed = idx >= prevRevealedRef.current
          return (
            <LeaderboardRow
              key={entry.userId}
              entry={entry}
              variant={isSelf ? 'self' : entry.rank <= 3 ? 'top3' : 'normal'}
              rowRef={isSelf ? selfRowRef : undefined}
              className={isFreshlyRevealed ? 'lb-row-in' : undefined}
            />
          )
        })}
        {hasMore && (
          <li
            ref={sentinelRef}
            data-testid="reveal-sentinel"
            className={clsx(
              'flex items-center justify-center gap-2 border-t border-panteon-border',
              'bg-panteon-surface-3 px-4 py-4 font-mono text-[10px] uppercase tracking-[0.08em] text-panteon-muted-soft',
            )}
          >
            <span
              aria-hidden="true"
              className="lb-spinner inline-block h-3 w-3 rounded-full border-2 border-panteon-border border-t-panteon-orange"
            />
            <span>
              {revealLoading
                ? `Loading ranks ${(revealed + 1).toString()}–${Math.min(revealed + PAGE_SIZE, entries.length).toString()}…`
                : `Scroll for ranks ${(revealed + 1).toString()}–${Math.min(revealed + PAGE_SIZE, entries.length).toString()}`}
            </span>
          </li>
        )}
        <li role="status" aria-live="polite" className="sr-only">
          Showing {visible.length.toString()} of {entries.length.toString()} players
        </li>
      </ol>
    )
  },
)

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
