import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatCard } from './StatCard'

describe('StatCard', () => {
  it('renders the label and value', () => {
    render(<StatCard label="Resets in" value="3d 12:00:00" />)
    expect(screen.getByText('Resets in')).toBeInTheDocument()
    expect(screen.getByText('3d 12:00:00')).toBeInTheDocument()
  })

  it('applies the gold accent class', () => {
    const { container } = render(<StatCard label="Pool" value="4.82B" accent="gold" />)
    const article = container.querySelector('article') as HTMLElement
    expect(article.className).toMatch(/border-l-prize-gold/)
  })

  it('applies the orange accent class', () => {
    const { container } = render(<StatCard label="Rank" value="#42" accent="orange" />)
    const article = container.querySelector('article') as HTMLElement
    expect(article.className).toMatch(/border-l-panteon-orange/)
  })

  it('renders the extra slot in the header', () => {
    render(<StatCard label="Pool" value="4.82B" extra={<span data-testid="extra">i</span>} />)
    expect(screen.getByTestId('extra')).toBeInTheDocument()
  })
})
