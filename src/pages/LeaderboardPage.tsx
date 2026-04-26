import { CountdownToReset } from '@/components/CountdownToReset'
import { LeaderboardList } from '@/components/LeaderboardList'
import { OwnRankCluster } from '@/components/OwnRankCluster'
import { UserPicker } from '@/components/UserPicker'
import { useUserId } from '@/hooks/useUserId'

export function LeaderboardPage(): React.ReactElement {
  const { userId, setUserId } = useUserId()

  return (
    <main id="leaderboard" className="flex-1">
      <section className="mx-auto max-w-[1140px] px-[15px] pb-16 pt-12">
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-nav text-panteon-muted">
              Weekly competition
            </span>
            <h1 className="font-sans text-4xl font-bold tracking-tight text-panteon-fg sm:text-5xl">
              Leaderboard
            </h1>
            <p className="max-w-2xl text-sm text-panteon-muted">
              Top 100 players this week, with a live cluster around your rank. Updates every 5 seconds.
            </p>
            <div className="mt-2 flex items-center gap-3 text-xs uppercase tracking-nav text-panteon-muted">
              <span>Resets in</span>
              <CountdownToReset />
            </div>
          </div>
          <UserPicker userId={userId} onChange={setUserId} />
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <aside className="order-1 lg:order-2 lg:sticky lg:top-20 lg:self-start">
            <OwnRankCluster userId={userId} />
          </aside>
          <div className="order-2 lg:order-1">
            <h2 className="mb-3 text-xs uppercase tracking-nav text-panteon-muted">Top 100</h2>
            <LeaderboardList selfUserId={userId} />
          </div>
        </div>
      </section>
    </main>
  )
}
