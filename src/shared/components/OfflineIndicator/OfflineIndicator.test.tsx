import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { OfflineIndicator } from './OfflineIndicator'

function setOnline(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    get: () => value,
  })
}

describe('OfflineIndicator', () => {
  beforeEach(() => {
    setOnline(true)
  })

  afterEach(() => {
    setOnline(true)
  })

  it('renders nothing while online', () => {
    const { container } = render(<OfflineIndicator />)
    expect(container.firstChild).toBeNull()
  })

  it('shows the icon button when offline', () => {
    setOnline(false)
    render(<OfflineIndicator />)
    expect(screen.getByRole('button', { name: /you are offline/i })).toBeInTheDocument()
    // Popover is collapsed by default — only the trigger is visible.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('reveals the popover on click and hides it on a second click', () => {
    setOnline(false)
    render(<OfflineIndicator />)
    const trigger = screen.getByRole('button', { name: /you are offline/i })

    fireEvent.click(trigger)
    expect(screen.getByRole('alert')).toHaveTextContent(/you are offline/i)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(trigger)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('reacts to online/offline events without remount', () => {
    render(<OfflineIndicator />)
    expect(screen.queryByRole('button', { name: /you are offline/i })).not.toBeInTheDocument()

    act(() => {
      setOnline(false)
      window.dispatchEvent(new Event('offline'))
    })
    expect(screen.getByRole('button', { name: /you are offline/i })).toBeInTheDocument()

    act(() => {
      setOnline(true)
      window.dispatchEvent(new Event('online'))
    })
    expect(screen.queryByRole('button', { name: /you are offline/i })).not.toBeInTheDocument()
  })

  it('closes the popover when the online event fires', () => {
    setOnline(false)
    render(<OfflineIndicator />)
    fireEvent.click(screen.getByRole('button', { name: /you are offline/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    act(() => {
      setOnline(true)
      window.dispatchEvent(new Event('online'))
    })
    // Indicator unmounts entirely; popover goes with it.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('dismisses the popover when clicking outside', () => {
    setOnline(false)
    render(
      <>
        <button type="button">elsewhere</button>
        <OfflineIndicator />
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: /you are offline/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByRole('button', { name: 'elsewhere' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
