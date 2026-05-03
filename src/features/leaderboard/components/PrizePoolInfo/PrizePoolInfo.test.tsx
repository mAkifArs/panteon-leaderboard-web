import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PrizePoolInfo } from './PrizePoolInfo'

describe('PrizePoolInfo', () => {
  it('renders the trigger button collapsed by default', () => {
    render(<PrizePoolInfo />)
    const trigger = screen.getByRole('button', { name: /prize pool details/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('toggles open and closed on click', () => {
    render(<PrizePoolInfo />)
    const trigger = screen.getByRole('button', { name: /prize pool details/i })

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('tooltip')).toHaveTextContent(/2% to this week's prize pool/i)

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('opens on hover and closes on mouse leave', () => {
    render(<PrizePoolInfo />)
    const trigger = screen.getByRole('button', { name: /prize pool details/i })
    const container = trigger.parentElement
    if (!container) throw new Error('container missing')

    fireEvent.mouseEnter(container)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.mouseLeave(container)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('dismisses the tooltip on a document mousedown outside the container', () => {
    render(
      <>
        <button type="button">elsewhere</button>
        <PrizePoolInfo />
      </>,
    )
    const trigger = screen.getByRole('button', { name: /prize pool details/i })
    fireEvent.click(trigger)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByRole('button', { name: 'elsewhere' }))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('wires aria-describedby to the tooltip while open', () => {
    render(<PrizePoolInfo />)
    const trigger = screen.getByRole('button', { name: /prize pool details/i })

    expect(trigger).not.toHaveAttribute('aria-describedby')
    fireEvent.click(trigger)
    const tooltip = screen.getByRole('tooltip')
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id)
  })
})
