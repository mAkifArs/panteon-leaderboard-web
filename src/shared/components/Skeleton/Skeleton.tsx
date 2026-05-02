import { clsx } from 'clsx'

interface SkeletonRowProps {
  count: number
  /**
   * Override the default `h-12` row height when a list uses a
   * different row size. Other layout/colour classes are part of
   * the primitive's contract — caller-overrideable per-row would
   * defeat the point of the unification.
   */
  className?: string
}

const BASE =
  'h-12 animate-pulse-soft border-t border-panteon-border bg-panteon-surface-2/30'

/**
 * Repeating row-shaped skeleton placeholder. Designed to be dropped
 * inside an `<ol>` (or any list-like container) that the caller
 * decorates with `aria-busy` / `aria-live` as appropriate — the
 * primitive intentionally renders only `<li>` elements so a11y
 * semantics travel with the container.
 *
 * Used by `LeaderboardList` (count=8) and `OwnRankCluster` (count=6).
 */
export function SkeletonRow({ count, className }: SkeletonRowProps): React.ReactElement {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <li key={`skel-${i.toString()}`} className={clsx(BASE, className)} />
      ))}
    </>
  )
}
