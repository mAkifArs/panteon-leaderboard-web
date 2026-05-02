import { clsx } from 'clsx'

interface ErrorStateProps {
  children: React.ReactNode
  /**
   * `default` — bordered red panel for top-level data load failures
   * (`LeaderboardList`, `UserPicker` empty states).
   * `compact` — inline red text for in-context failures where a
   * panel would shift layout (`OwnRankCluster` inside the
   * leaderboard column).
   */
  variant?: 'default' | 'compact'
}

const VARIANT_CLASS: Record<NonNullable<ErrorStateProps['variant']>, string> = {
  default: 'rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300',
  compact: 'text-sm text-red-300',
}

export function ErrorState({
  children,
  variant = 'default',
}: ErrorStateProps): React.ReactElement {
  return (
    <div role="alert" className={clsx(VARIANT_CLASS[variant])}>
      {children}
    </div>
  )
}
