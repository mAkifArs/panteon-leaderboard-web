import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LivePulse } from './LivePulse'

describe('LivePulse', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the week label', () => {
    render(<LivePulse weekLabel="Week 18 · Idle Empire" />)
    expect(screen.getByText('Week 18 · Idle Empire')).toBeInTheDocument()
  })

  it('exposes a polite status region with the Live label', () => {
    render(<LivePulse weekLabel="Week 1" />)
    expect(screen.getByRole('status')).toHaveTextContent(/Live/)
  })
})
