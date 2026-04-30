import { clsx } from 'clsx'
import { LIST_GRID, LIST_ROW_GAP } from './grid'

const cellClass =
  'font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-panteon-muted-soft'

export function ColumnHeader(): React.ReactElement {
  return (
    <li
      role="row"
      aria-hidden="true"
      className={clsx(
        'hidden items-center border-b border-panteon-border px-4 py-2.5 md:grid',
        LIST_GRID,
        LIST_ROW_GAP,
      )}
    >
      <span className={cellClass}>Rank</span>
      <span />
      <span className={cellClass}>Player</span>
      <span className={cellClass}>Region</span>
      <span className={clsx(cellClass, 'text-right')}>Earned</span>
    </li>
  )
}
