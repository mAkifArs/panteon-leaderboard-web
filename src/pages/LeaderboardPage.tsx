import { useCallback, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { HeroBanner } from '@/components/HeroBanner'
import { LeaderboardList } from '@/components/LeaderboardList'
import { OwnRankCluster } from '@/components/OwnRankCluster'
import { Podium } from '@/components/Podium'
import { StickySelfBar } from '@/components/StickySelfBar'
import { UserPicker } from '@/components/UserPicker'
import { useLeaderboardView } from '@/hooks/useLeaderboardView'
import { useUserId } from '@/hooks/useUserId'

export function LeaderboardPage(): React.ReactElement {
  const { userId, setUserId } = useUserId()

  if (!userId) {
    return <UserPicker onSelect={setUserId} />
  }

  return (
    <LeaderboardView
      userId={userId}
      onSwitchPlayer={() => {
        setUserId(null)
      }}
    />
  )
}

interface LeaderboardViewProps {
  userId: string
  onSwitchPlayer: () => void
}

function LeaderboardView({ userId, onSwitchPlayer }: LeaderboardViewProps): React.ReactElement {
  const { data, error, isLoading } = useLeaderboardView(userId)
  const meta = data?.meta
  const entries = data?.top.entries ?? []
  const me = data?.me ?? null

  // Callback refs let the bar's effect re-bind when the target element
  // actually mounts (e.g. after the first poll resolves). A useRef object
  // is not reactive — useState + callback ref is. The mirrored ref alongside
  // the state lets handleJump read the latest node synchronously after the
  // cluster mounts on click, without waiting for a re-render closure.
  const [clusterEl, setClusterEl] = useState<HTMLElement | null>(null)
  const clusterRef = useRef<HTMLElement | null>(null)
  const [selfRowEl, setSelfRowEl] = useState<HTMLLIElement | null>(null)
  const clusterCb = useCallback((node: HTMLElement | null) => {
    clusterRef.current = node
    setClusterEl(node)
  }, [])
  const selfRowCb = useCallback((node: HTMLLIElement | null) => {
    setSelfRowEl(node)
  }, [])

  // Outside top 100, we wait for an explicit "Jump to me" before
  // mounting the cluster. Auto-rendering it underneath a paginated
  // top-100 list looked orphaned and confused users into thinking
  // their data had loaded in the wrong place.
  const [showCluster, setShowCluster] = useState(false)

  // Sticky bar tracks the cluster when the player is outside the top 100,
  // otherwise it tracks the player's own row inside the top-100 list. When
  // that target is on screen, the bar fades out.
  const targetEl: HTMLElement | null = me && me.rank > 100 ? clusterEl : selfRowEl

  const scrollToEl = (el: HTMLElement): void => {
    const top = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const triggerPulse = (el: HTMLElement): void => {
    el.classList.remove('lb-jump-pulse')
    // Force reflow so the animation re-triggers on consecutive
    // jumps (consecutive class adds without a reflow are coalesced).
    void el.offsetWidth
    el.classList.add('lb-jump-pulse')
    window.setTimeout(() => {
      el.classList.remove('lb-jump-pulse')
    }, 1600)
  }

  const handleJump = (): void => {
    if (!me) return
    // Outside top 100: cluster is gated behind this click. Mount
    // it, then double-rAF for commit + layout, then scroll. We
    // read clusterRef (not state) so the second rAF sees the node
    // synchronously after the callback ref fires on mount.
    if (me.rank > 100) {
      setShowCluster(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (clusterRef.current) scrollToEl(clusterRef.current)
        })
      })
      return
    }
    // Inside top 100 (rank > 3 enforced by StickySelfBar): the
    // self row is already mounted (full top-100 renders on first
    // paint per ADR-015), so just scroll and pulse.
    if (!selfRowEl) return
    scrollToEl(selfRowEl)
    triggerPulse(selfRowEl)
  }

  return (
    <main id="leaderboard" className="flex-1">
      {meta && (
        <HeroBanner
          meta={meta}
          selfRank={me?.rank ?? null}
          totalPlayers={me?.totalPlayers ?? null}
          userId={userId}
          onSwitchPlayer={onSwitchPlayer}
        />
      )}

      <div className="mx-auto max-w-[1140px] px-3 pb-16 pt-6 md:px-6 md:pt-8">
        {(() => {
          const podiumShown = entries.length >= 3
          const listEntries = podiumShown ? entries.slice(3) : entries
          const rangeLabel = podiumShown
            ? `Ranks 4–${entries.length.toString()}`
            : `Ranks 1–${entries.length.toString()}`
          return (
            <>
              {podiumShown && <Podium entries={entries.slice(0, 3)} />}
              <SectionHeader title="Top 100 · Global" rangeLabel={rangeLabel} accent="muted" />
              <LeaderboardList
                entries={listEntries}
                selfUserId={userId}
                loading={isLoading}
                error={error}
                selfRowRef={selfRowCb}
              />
            </>
          )
        })()}

        {me && me.rank > 100 && showCluster && (
          <section
            ref={clusterCb}
            aria-label={`Around your rank #${me.rank.toString()}`}
            className="mt-10"
          >
            <SectionHeader
              title={`Around You · Rank #${me.rank.toString()}`}
              rangeLabel="3 above · you · 2 below"
              accent="orange"
            />
            <OwnRankCluster me={me} userId={userId} loading={isLoading} error={error} />
          </section>
        )}

        {me && me.rank > 3 && (
          <StickySelfBar me={me} userId={userId} targetEl={targetEl} onJump={handleJump} />
        )}

        {meta && <FooterNote isoWeek={meta.isoWeek} />}
      </div>
    </main>
  )
}

interface SectionHeaderProps {
  title: string
  rangeLabel: string
  accent: 'muted' | 'orange'
}

function SectionHeader({ title, rangeLabel, accent }: SectionHeaderProps): React.ReactElement {
  return (
    <div className="mb-3 mt-2 flex items-baseline justify-between">
      <div>
        <h2
          className={clsx(
            'm-0 font-mono text-[11px] font-semibold uppercase tracking-[0.1em]',
            accent === 'orange' ? 'text-panteon-orange' : 'text-panteon-muted',
          )}
        >
          {title}
        </h2>
        <span aria-hidden="true" className="mt-1 block h-[1.3px] w-3.5 bg-panteon-orange" />
      </div>
      <span className="font-mono text-[10px] tracking-[0.05em] text-panteon-muted-soft">
        {rangeLabel}
      </span>
    </div>
  )
}

interface FooterNoteProps {
  isoWeek: string
}

function FooterNote({ isoWeek }: FooterNoteProps): React.ReactElement {
  return (
    <div className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-panteon-border pt-6 font-mono text-[10px] uppercase tracking-[0.08em] text-panteon-muted-soft">
      <span>Week {isoWeek} · Updates every 5s · Stateless API</span>
      <span>© Panteon Games · Concept design</span>
    </div>
  )
}
