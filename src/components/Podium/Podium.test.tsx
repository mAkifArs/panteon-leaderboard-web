import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Podium } from './Podium'
import type { ViewEntry } from '@/api/schemas'

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

  it('renders three cards with the medal labels (mobile + desktop wrappers)', () => {
    render(<Podium entries={entries} />)
    // Two layouts coexist in the DOM, hidden via Tailwind responsive
    // classes that jsdom does not evaluate. Each medal therefore
    // renders twice; we just assert both wrappers contain it.
    expect(screen.getAllByLabelText(/First place: Champ/)).toHaveLength(2)
    expect(screen.getAllByLabelText(/Second place: Runner/)).toHaveLength(2)
    expect(screen.getAllByLabelText(/Third place: Bronze/)).toHaveLength(2)
  })

  it('does not render a Prize row (per ADR-011)', () => {
    render(<Podium entries={entries} />)
    expect(screen.queryAllByText(/^Prize$/i)).toHaveLength(0)
  })

  it('returns null when fewer than three entries are provided', () => {
    const { container } = render(<Podium entries={entries.slice(0, 2)} />)
    expect(container.firstChild).toBeNull()
  })
})
