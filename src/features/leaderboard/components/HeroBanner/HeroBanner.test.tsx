import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HeroBanner } from './HeroBanner'
import type { Meta } from '@/shared/api/schemas'

const meta: Meta = {
  isoWeek: '2026-W18',
  weekStart: '2026-04-27T00:00:00.000Z',
  weekEnd: '2026-05-04T00:00:00.000Z',
  pool: '4820000000',
}

describe('HeroBanner', () => {
  it('renders all four stat cards', () => {
    render(
      <HeroBanner
        meta={meta}
        selfRank={42}
        totalPlayers={2184392}
        userId="user_self"
        onSwitchPlayer={() => {}}
      />,
    )
    expect(screen.getByText('Resets in')).toBeInTheDocument()
    expect(screen.getByText('Players ranked')).toBeInTheDocument()
    expect(screen.getByText('Prize pool')).toBeInTheDocument()
    expect(screen.getByText('Your rank')).toBeInTheDocument()
  })

  it('renders the countdown a11y label', () => {
    render(
      <HeroBanner
        meta={meta}
        selfRank={1}
        totalPlayers={100}
        userId="user_self"
        onSwitchPlayer={() => {}}
      />,
    )
    expect(screen.getByLabelText('Time until weekly reset')).toBeInTheDocument()
  })

  it('shows an em-dash when self rank is null', () => {
    render(
      <HeroBanner
        meta={meta}
        selfRank={null}
        totalPlayers={null}
        userId="user_self"
        onSwitchPlayer={() => {}}
      />,
    )
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('formats the player count with thousand separators', () => {
    render(
      <HeroBanner
        meta={meta}
        selfRank={1}
        totalPlayers={2184392}
        userId="user_self"
        onSwitchPlayer={() => {}}
      />,
    )
    expect(screen.getByText('2,184,392')).toBeInTheDocument()
  })

  it('calls onSwitchPlayer when the Switch player button is clicked', async () => {
    const onSwitch = vi.fn()
    render(
      <HeroBanner
        meta={meta}
        selfRank={1}
        totalPlayers={1}
        userId="user_self"
        onSwitchPlayer={onSwitch}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /switch player/i }))
    expect(onSwitch).toHaveBeenCalledOnce()
  })

  it('shows the week number derived from meta.isoWeek', () => {
    render(
      <HeroBanner
        meta={meta}
        selfRank={1}
        totalPlayers={1}
        userId="user_self"
        onSwitchPlayer={() => {}}
      />,
    )
    expect(screen.getByText(/Week 18 · Idle Empire/)).toBeInTheDocument()
  })
})
