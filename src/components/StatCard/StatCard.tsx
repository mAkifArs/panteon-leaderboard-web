import { clsx } from 'clsx'

export type StatCardAccent = 'orange' | 'gold' | 'none'

interface StatCardProps {
  label: string
  value: React.ReactNode
  accent?: StatCardAccent
  extra?: React.ReactNode
}

const accentClassName: Record<StatCardAccent, string> = {
  orange: 'border-l-panteon-orange',
  gold: 'border-l-prize-gold',
  none: 'border-l-panteon-border',
}

export function StatCard({
  label,
  value,
  accent = 'none',
  extra,
}: StatCardProps): React.ReactElement {
  return (
    <article
      className={clsx(
        'flex min-h-[64px] flex-col gap-1.5 rounded-lg border border-panteon-border bg-panteon-surface p-3 pl-3.5',
        'border-l-2',
        accentClassName[accent],
      )}
    >
      <header className="flex items-center justify-between gap-1.5">
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-panteon-muted-soft">
          {label}
        </span>
        {extra}
      </header>
      <div>{value}</div>
    </article>
  )
}
