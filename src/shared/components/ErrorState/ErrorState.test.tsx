import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorState } from './ErrorState'

describe('ErrorState', () => {
  it('renders the children inside a role="alert" container', () => {
    render(<ErrorState>Something failed: oops</ErrorState>)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Something failed: oops')
  })

  it('default variant carries the bordered red-panel classes', () => {
    render(<ErrorState>boom</ErrorState>)
    const alert = screen.getByRole('alert')
    expect(alert.className).toMatch(/rounded-xl/)
    expect(alert.className).toMatch(/border-red-900/)
    expect(alert.className).toMatch(/bg-red-950/)
    expect(alert.className).toMatch(/text-red-300/)
  })

  it('compact variant strips the panel chrome and keeps just text', () => {
    render(<ErrorState variant="compact">boom</ErrorState>)
    const alert = screen.getByRole('alert')
    expect(alert.className).toMatch(/text-red-300/)
    expect(alert.className).not.toMatch(/rounded-xl/)
    expect(alert.className).not.toMatch(/border-red-900/)
    expect(alert.className).not.toMatch(/bg-red-950/)
  })

  it('passes JSX children through (not just strings)', () => {
    render(
      <ErrorState>
        Failed: <strong>network</strong> error
      </ErrorState>,
    )
    expect(screen.getByText('network').tagName).toBe('STRONG')
  })
})
