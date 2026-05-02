import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorState } from './ErrorState'

describe('ErrorState', () => {
  it('renders the children inside a role="alert" container', () => {
    render(<ErrorState>Something failed: oops</ErrorState>)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Something failed: oops')
  })

  it('default variant carries the bordered error-panel classes', () => {
    render(<ErrorState>boom</ErrorState>)
    const alert = screen.getByRole('alert')
    expect(alert.className).toMatch(/rounded-xl/)
    expect(alert.className).toMatch(/border-error-border/)
    expect(alert.className).toMatch(/bg-error-bg/)
    expect(alert.className).toMatch(/text-error-text/)
  })

  it('compact variant strips the panel chrome and keeps just text', () => {
    render(<ErrorState variant="compact">boom</ErrorState>)
    const alert = screen.getByRole('alert')
    expect(alert.className).toMatch(/text-error-text/)
    expect(alert.className).not.toMatch(/rounded-xl/)
    expect(alert.className).not.toMatch(/border-error-border/)
    expect(alert.className).not.toMatch(/bg-error-bg/)
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
