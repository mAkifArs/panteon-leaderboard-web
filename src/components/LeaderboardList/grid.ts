/**
 * Single source of truth for the Top-100 list grid columns.
 * Both LeaderboardRow and ColumnHeader consume the same string
 * so the column header always lines up with the row content.
 *
 * Mobile (default) collapses country and prize columns; the row
 * component folds the meta strip under the player name. Desktop
 * (md+) restores the full grid.
 *
 * Tailwind's purge inspects literal strings — keep these as
 * single literals (no concat) so the arbitrary classes survive.
 */

export const LIST_GRID = 'grid-cols-[32px_32px_1fr_auto] md:grid-cols-[48px_44px_1fr_auto_160px]'

export const LIST_ROW_PADDING = 'px-3 py-2.5 md:px-4 md:py-3'

export const LIST_ROW_GAP = 'gap-2.5 md:gap-3.5'
