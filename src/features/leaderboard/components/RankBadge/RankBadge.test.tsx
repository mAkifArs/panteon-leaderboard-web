import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RankBadge } from './RankBadge'

describe('RankBadge', () => {
  it('renders ranks 1-3 as a circle with the medal tone class', () => {
    const { rerender } = render(<RankBadge rank={1} />)
    let badge = screen.getByText('1')
    expect(badge.className).toMatch(/bg-prize-gold/)

    rerender(<RankBadge rank={2} />)
    badge = screen.getByText('2')
    expect(badge.className).toMatch(/bg-prize-silver/)

    rerender(<RankBadge rank={3} />)
    badge = screen.getByText('3')
    expect(badge.className).toMatch(/bg-prize-bronze/)
  })

  it('renders rank > 3 with the neutral panteon-surface tone in circle mode', () => {
    render(<RankBadge rank={42} />)
    const badge = screen.getByText('42')
    expect(badge.className).toMatch(/bg-panteon-surface-2/)
    expect(badge.className).not.toMatch(/bg-prize-/)
  })

  it('compacts huge circle ranks (10k → "12K", 1m+ → "1.2M") so the badge does not blow out', () => {
    const { rerender } = render(<RankBadge rank={50_000} />)
    expect(screen.getByText('50K')).toBeInTheDocument()

    rerender(<RankBadge rank={1_500_000} />)
    expect(screen.getByText('1.5M')).toBeInTheDocument()
  })

  it('numeric variant uses Intl grouping for 10k+ so adjacent ranks stay distinguishable', () => {
    render(<RankBadge rank={499_998} numeric />)
    expect(screen.getByText('499,998')).toBeInTheDocument()
  })

  it('numeric variant zero-pads small ranks (4 → "04") for column alignment', () => {
    render(<RankBadge rank={4} numeric />)
    expect(screen.getByText('04')).toBeInTheDocument()
  })

  it('falls back to circle mode for ranks 1-3 even when numeric=true (medals always win)', () => {
    render(<RankBadge rank={1} numeric />)
    const badge = screen.getByText('1')
    expect(badge.className).toMatch(/bg-prize-gold/)
  })
})
