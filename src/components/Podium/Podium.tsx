import type { ViewEntry } from '@/api/schemas'
import { PodiumCard } from './PodiumCard'

interface PodiumProps {
  entries: ViewEntry[]
}

export function Podium({ entries }: PodiumProps): React.ReactElement | null {
  if (entries.length < 3) return null
  const [first, second, third] = entries

  return (
    <section aria-label="Top 3 podium" className="relative mb-6 mt-6 px-1 md:mb-8 md:mt-8 md:px-6">
      <div
        aria-hidden="true"
        className="podium-glow pointer-events-none absolute inset-x-0 -top-12 bottom-0 md:-top-16"
      />

      {/* Mobile: 1st on top spans 2 cols, 2nd + 3rd below */}
      <div className="relative grid grid-cols-2 gap-2.5 md:hidden">
        <div className="col-span-2">
          <PodiumCard entry={first} place={1} />
        </div>
        <PodiumCard entry={second} place={2} />
        <PodiumCard entry={third} place={3} />
      </div>

      {/* Desktop: classic 2-1-3 stage, gold center, taller */}
      <div className="relative hidden items-end gap-4 md:grid md:grid-cols-[1fr_1.1fr_1fr]">
        <PodiumCard entry={second} place={2} />
        <PodiumCard entry={first} place={1} />
        <PodiumCard entry={third} place={3} />
      </div>
    </section>
  )
}
