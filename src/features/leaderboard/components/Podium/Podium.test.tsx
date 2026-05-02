import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Podium } from './Podium'
import type { ViewEntry } from '@/shared/api/schemas'

function makeEntry(rank: number, score: string, username: string): ViewEntry {
  return {
    rank,
    userId: `user_${rank.toString()}`,
    username,
    score,
    country: 'TR',
  }
}

describe('Podium', () => {
  const entries: ViewEntry[] = [
    makeEntry(1, '18420000000', 'Champ'),
    makeEntry(2, '12200000000', 'Runner'),
    makeEntry(3, '9800000000', 'Bronze'),
  ]

  // Both layouts (mobile + desktop wrappers) coexist in the DOM and
  // jsdom doesn't evaluate the responsive `hidden`/`md:` classes,
  // so each card is asserted at length 2.

  it('renders three cards with the medal labels', () => {
    render(<Podium entries={entries} selfUserId="user_999" />)
    expect(screen.getAllByLabelText(/First place: Champ/)).toHaveLength(2)
    expect(screen.getAllByLabelText(/Second place: Runner/)).toHaveLength(2)
    expect(screen.getAllByLabelText(/Third place: Bronze/)).toHaveLength(2)
  })

  it('does not render a Prize row (per ADR-011)', () => {
    render(<Podium entries={entries} selfUserId="user_999" />)
    expect(screen.queryAllByText(/^Prize$/i)).toHaveLength(0)
  })

  it('returns null when fewer than three entries are provided', () => {
    const { container } = render(
      <Podium entries={entries.slice(0, 2)} selfUserId="user_999" />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('does not apply the medal glow when the viewer is not in top 3', () => {
    render(<Podium entries={entries} selfUserId="user_999" />)
    for (const article of screen.getAllByRole('article')) {
      expect(article.className).not.toMatch(/lb-medal-glow-/)
    }
  })

  it('applies gold glow + (you) aria suffix when the viewer is rank 1', () => {
    render(<Podium entries={entries} selfUserId="user_1" />)
    const cards = screen.getAllByLabelText(/First place: Champ \(you\)/)
    expect(cards).toHaveLength(2)
    for (const card of cards) {
      expect(card.className).toMatch(/lb-medal-glow-gold/)
      expect(card.className).toMatch(/border-prize-gold/)
    }
  })

  it('applies silver glow when the viewer is rank 2', () => {
    render(<Podium entries={entries} selfUserId="user_2" />)
    const cards = screen.getAllByLabelText(/Second place: Runner \(you\)/)
    expect(cards).toHaveLength(2)
    for (const card of cards) {
      expect(card.className).toMatch(/lb-medal-glow-silver/)
    }
  })

  it('applies bronze glow when the viewer is rank 3', () => {
    render(<Podium entries={entries} selfUserId="user_3" />)
    const cards = screen.getAllByLabelText(/Third place: Bronze \(you\)/)
    expect(cards).toHaveLength(2)
    for (const card of cards) {
      expect(card.className).toMatch(/lb-medal-glow-bronze/)
    }
  })
})
