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
  default: 'rounded-xl border border-error-border bg-error-bg p-4 text-sm text-error-text',
  compact: 'text-sm text-error-text',
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
