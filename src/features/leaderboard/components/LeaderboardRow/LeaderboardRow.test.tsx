import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LeaderboardRow } from './LeaderboardRow'
import type { ViewEntry } from '@/shared/api/schemas'

function makeEntry(overrides: Partial<ViewEntry> = {}): ViewEntry {
  return {
    rank: 5,
    userId: 'user_5',
    username: 'Mert',
    score: '1234567',
    country: 'TR',
    ...overrides,
  }
}

describe('LeaderboardRow', () => {
  it('renders rank, username, and score for a normal row', () => {
    render(<LeaderboardRow entry={makeEntry()} variant="normal" />)
    expect(screen.getByRole('row')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Rank 5: Mert, score 1,234,567'),
    )
  })

  it('appends "(you)" to the a11y label for self variant', () => {
    render(<LeaderboardRow entry={makeEntry()} variant="self" />)
    expect(screen.getByRole('row').getAttribute('aria-label')).toMatch(/\(you\)$/)
  })

  it('shows the You pill for self variant', () => {
    render(<LeaderboardRow entry={makeEntry()} variant="self" />)
    expect(screen.getByText('You')).toBeInTheDocument()
  })

  it('applies the gold left-border class for top3 rank 1', () => {
    render(<LeaderboardRow entry={makeEntry({ rank: 1 })} variant="top3" />)
    expect(screen.getByRole('row').className).toMatch(/border-l-prize-gold/)
  })

  it('applies the silver left-border class for top3 rank 2', () => {
    render(<LeaderboardRow entry={makeEntry({ rank: 2 })} variant="top3" />)
    expect(screen.getByRole('row').className).toMatch(/border-l-prize-silver/)
  })

  it('applies the orange gradient and left-border for self variant', () => {
    render(<LeaderboardRow entry={makeEntry()} variant="self" />)
    const row = screen.getByRole('row').className
    expect(row).toMatch(/border-l-panteon-orange/)
    expect(row).toMatch(/from-panteon-orange/)
  })

  it('applies the neighbour bg class', () => {
    render(<LeaderboardRow entry={makeEntry()} variant="neighbour" />)
    expect(screen.getByRole('row').className).toMatch(/bg-rank-neighbour-bg/)
  })

  it('renders a country flag and code on desktop columns', () => {
    render(<LeaderboardRow entry={makeEntry({ country: 'TR' })} variant="normal" />)
    // Country code appears at least once (mobile meta + desktop column)
    const trElements = screen.getAllByText('TR')
    expect(trElements.length).toBeGreaterThanOrEqual(1)
  })

  it('does not render a Prize cell (per ADR-011)', () => {
    render(<LeaderboardRow entry={makeEntry()} variant="normal" />)
    // No element with text "Prize" should appear (header label, not a value)
    expect(screen.queryByText(/^Prize$/)).toBeNull()
  })
})
