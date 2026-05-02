import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { CountdownToReset } from './CountdownToReset'

const NOW = new Date('2026-04-30T12:00:00.000Z').getTime()

describe('CountdownToReset', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders "Xd Yh Zm" when more than a day remains', () => {
    // 1 day, 11 hours, 30 minutes ahead.
    const weekEnd = new Date(NOW + (1 * 86400 + 11 * 3600 + 30 * 60) * 1000).toISOString()
    render(<CountdownToReset weekEnd={weekEnd} />)
    expect(screen.getByLabelText(/time until weekly reset/i)).toHaveTextContent('1d 11h 30m')
  })

  it('drops the day segment and shows "Yh Zm Ws" when under a day remains', () => {
    const weekEnd = new Date(NOW + (5 * 3600 + 12 * 60 + 7) * 1000).toISOString()
    render(<CountdownToReset weekEnd={weekEnd} />)
    expect(screen.getByLabelText(/time until weekly reset/i)).toHaveTextContent('5h 12m 7s')
  })

  it('compact mode renders padded "Xd HH:MM:SS"', () => {
    const weekEnd = new Date(NOW + (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000).toISOString()
    render(<CountdownToReset weekEnd={weekEnd} compact />)
    expect(screen.getByLabelText(/time until weekly reset/i)).toHaveTextContent('2d 03:04:05')
  })

  it('clamps to 0 when the weekEnd is already in the past (no negative countdown)', () => {
    const weekEnd = new Date(NOW - 60_000).toISOString()
    render(<CountdownToReset weekEnd={weekEnd} />)
    // floor(remaining/1000) → 0, so neither d nor h branch fires; "0m 0s" path.
    expect(screen.getByLabelText(/time until weekly reset/i)).toHaveTextContent('0m 0s')
  })

  it('falls back to the next ISO-week reset when weekEnd is omitted', () => {
    // Just assert the component renders something label-wise without
    // throwing when the prop is absent — the iso-week math is covered
    // by iso-week.test.ts.
    render(<CountdownToReset />)
    expect(screen.getByLabelText(/time until weekly reset/i)).toBeInTheDocument()
  })

  it('updates the displayed remainder once the interval ticks', () => {
    const weekEnd = new Date(NOW + 65 * 1000).toISOString()
    render(<CountdownToReset weekEnd={weekEnd} />)
    expect(screen.getByLabelText(/time until weekly reset/i)).toHaveTextContent('1m 5s')

    // advanceTimersByTime moves Date.now AND drains the 1-second
    // interval, both in one go. Wrap in act so React flushes the
    // setRemaining update before we read text content.
    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    expect(screen.getByLabelText(/time until weekly reset/i)).toHaveTextContent('1m 0s')
  })
})
