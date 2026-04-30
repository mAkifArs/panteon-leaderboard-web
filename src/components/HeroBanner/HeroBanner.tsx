import { CountdownToReset } from '@/components/CountdownToReset/CountdownToReset'
import { LivePulse } from '@/components/LivePulse'
import { PrizePoolInfo } from '@/components/PrizePoolInfo/PrizePoolInfo'
import { StatCard } from '@/components/StatCard'
import type { Meta } from '@/api/schemas'
import { formatCompact } from '@/lib/format'
import { weekNumberFromIsoWeek } from '@/lib/iso-week'

interface HeroBannerProps {
  meta: Meta
  selfRank: number | null
  totalPlayers: number | null
  userId: string
  onSwitchPlayer: () => void
}

const NUMBER = new Intl.NumberFormat('en-US')

export function HeroBanner({
  meta,
  selfRank,
  totalPlayers,
  userId,
  onSwitchPlayer,
}: HeroBannerProps): React.ReactElement {
  const weekNumber = (() => {
    try {
      return weekNumberFromIsoWeek(meta.isoWeek)
    } catch {
      return null
    }
  })()
  const weekLabel =
    weekNumber !== null ? `Week ${weekNumber.toString()} · Idle Empire` : 'Idle Empire'

  return (
    <section className="relative overflow-hidden border-b border-panteon-border">
      <div aria-hidden="true" className="hero-stripes pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-[1140px] px-4 py-8 md:px-6 md:py-12">
        <div className="mb-3 flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.08em] text-panteon-muted-soft">
          <span>
            Signed in as <span className="text-panteon-fg">{userId}</span>
          </span>
          <button
            type="button"
            onClick={onSwitchPlayer}
            className="rounded border border-panteon-border-strong px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-panteon-muted transition-colors hover:border-panteon-orange hover:text-panteon-orange focus-visible:border-panteon-orange focus-visible:text-panteon-orange focus-visible:outline-none"
          >
            Switch player
          </button>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-5 md:gap-8">
          <div className="min-w-0 flex-[1_1_400px]">
            <div className="mb-4">
              <LivePulse weekLabel={weekLabel} />
            </div>
            <h1 className="m-0 mb-3 font-sans text-[36px] font-extrabold leading-[1] tracking-[-0.03em] text-panteon-fg md:text-[56px]">
              Weekly
              <br />
              <span className="text-panteon-orange">Leaderboard</span>
            </h1>
            <p className="m-0 max-w-[520px] text-[13px] leading-[1.5] text-panteon-muted md:text-[14px]">
              Top 100 earners climb the ranks. Prize pool grows with every coin earned — 2% of all
              weekly earnings goes to the players who came out on top.
            </p>
          </div>

          <div className="grid w-full min-w-0 grid-cols-2 gap-2 md:w-auto md:min-w-[320px] md:gap-4">
            <StatCard
              label="Resets in"
              accent="orange"
              value={<CountdownToReset weekEnd={meta.weekEnd} compact />}
            />
            <StatCard
              label="Players ranked"
              value={
                <span className="font-mono text-[18px] font-medium tabular-nums text-panteon-fg">
                  {NUMBER.format(totalPlayers ?? 0)}
                </span>
              }
            />
            <StatCard
              label="Prize pool"
              accent="gold"
              value={
                <span className="inline-flex items-baseline gap-1 font-mono text-[22px] font-semibold tabular-nums text-prize-gold">
                  {formatCompact(meta.pool)}
                  <span className="text-[11px] font-normal text-panteon-muted">coins</span>
                </span>
              }
              extra={<PrizePoolInfo />}
            />
            <StatCard
              label="Your rank"
              accent="orange"
              value={
                <span className="font-mono text-[22px] font-semibold tabular-nums text-panteon-fg">
                  {selfRank !== null ? `#${NUMBER.format(selfRank)}` : '—'}
                </span>
              }
            />
          </div>
        </div>
      </div>
    </section>
  )
}
