import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LeaderboardList } from './LeaderboardList'
import type { ViewEntry } from '@/api/schemas'

function makeEntries(n: number, startRank = 4): ViewEntry[] {
  return Array.from({ length: n }, (_, i) => ({
    rank: startRank + i,
    userId: `user_${(startRank + i).toString()}`,
    username: `Player${(startRank + i).toString()}`,
    score: String(1_000_000 - i * 1000),
    country: 'TR',
  }))
}

function dataRowCount(): number {
  return screen
    .queryAllByRole('row')
    .filter((el) => /^Rank \d+:/.test(el.getAttribute('aria-label') ?? '')).length
}

describe('LeaderboardList', () => {
  it('renders every entry on first paint', () => {
    render(
      <LeaderboardList
        entries={makeEntries(97)}
        selfUserId="user_99"
        loading={false}
        error={undefined}
      />,
    )
    expect(dataRowCount()).toBe(97)
  })

  it('shows the skeleton while loading with no data', () => {
    const { container } = render(
      <LeaderboardList entries={[]} selfUserId="user_99" loading={true} error={undefined} />,
    )
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy()
    expect(dataRowCount()).toBe(0)
  })

  it('shows the empty state when there are no entries and no error', () => {
    render(
      <LeaderboardList entries={[]} selfUserId="user_99" loading={false} error={undefined} />,
    )
    expect(screen.getByText(/no earnings recorded/i)).toBeInTheDocument()
  })

  it('shows the error state when error and no data', () => {
    render(
      <LeaderboardList
        entries={[]}
        selfUserId="user_99"
        loading={false}
        error={new Error('boom')}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(/boom/i)
  })

  it('marks the self row with the self variant', () => {
    render(
      <LeaderboardList
        entries={makeEntries(10)}
        selfUserId="user_7"
        loading={false}
        error={undefined}
      />,
    )
    const selfRow = screen.getByRole('row', { name: /^Rank 7:.*\(you\)$/ })
    expect(selfRow).toBeInTheDocument()
  })

  it('exposes a polite live region with the total count', () => {
    render(
      <LeaderboardList
        entries={makeEntries(50)}
        selfUserId="user_99"
        loading={false}
        error={undefined}
      />,
    )
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Showing 50 players')
  })
})
