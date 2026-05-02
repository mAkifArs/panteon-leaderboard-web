import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { OwnRankPayload, ViewEntry } from '@/shared/api/schemas'
import { OwnRankCluster } from './OwnRankCluster'

function makeEntry(rank: number, overrides: Partial<ViewEntry> = {}): ViewEntry {
  return {
    rank,
    userId: `u${rank.toString()}`,
    username: `Player${rank.toString()}`,
    score: String(1_000_000 - rank),
    country: 'US',
    ...overrides,
  }
}

function makePayload(centerRank: number): OwnRankPayload {
  return {
    rank: centerRank,
    totalPlayers: 100_000,
    cluster: Array.from({ length: 6 }, (_, i) => makeEntry(centerRank - 3 + i)),
  }
}

describe('OwnRankCluster', () => {
  it('renders the loading skeleton when loading and no data is in yet', () => {
    const { container } = render(
      <OwnRankCluster me={null} userId="u100" loading error={undefined} />,
    )
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it('renders an error message (no skeleton) when the fetch failed and data is null', () => {
    render(
      <OwnRankCluster
        me={null}
        userId="u100"
        loading={false}
        error={new Error('network down')}
      />,
    )
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/failed to load: network down/i)
  })

  it('renders the empty state when me is null and there is no error/loading', () => {
    render(<OwnRankCluster me={null} userId="u100" loading={false} error={undefined} />)
    expect(screen.getByText(/no earnings yet this week/i)).toBeInTheDocument()
  })

  it('renders the 6-row cluster and marks the matching userId as the self row', () => {
    const me = makePayload(50)
    render(<OwnRankCluster me={me} userId="u50" loading={false} error={undefined} />)

    // All 6 rows are in the document, ranks 47..52.
    for (const rank of [47, 48, 49, 50, 51, 52]) {
      expect(
        screen.getByRole('row', { name: new RegExp(`^Rank ${rank.toString()}:`) }),
      ).toBeInTheDocument()
    }

    // Self row is labelled "(you)" — neighbours are not.
    expect(screen.getByRole('row', { name: /^Rank 50:.*\(you\)$/ })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /^Rank 49:/ }).getAttribute('aria-label')).not.toMatch(
      /\(you\)/,
    )
  })

  it('prefers data over error when both are present (polling tick after a successful one failed)', () => {
    const me = makePayload(50)
    render(
      <OwnRankCluster
        me={me}
        userId="u50"
        loading={false}
        error={new Error('transient')}
      />,
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('row', { name: /^Rank 50:.*\(you\)$/ })).toBeInTheDocument()
  })
})
