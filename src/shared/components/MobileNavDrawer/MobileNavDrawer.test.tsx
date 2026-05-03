import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MobileNavDrawer, type NavItem } from './MobileNavDrawer'

const ITEMS: readonly NavItem[] = [
  { kind: 'hash', label: 'About', to: '/#about' },
  { kind: 'route', label: 'Leaderboard', to: '/leaderboard' },
]

function renderDrawer(overrides: Partial<{ onClose: () => void; returnFocus: () => void }> = {}) {
  const onClose = overrides.onClose ?? vi.fn()
  const returnFocus = overrides.returnFocus ?? vi.fn()
  const utils = render(
    <MemoryRouter>
      <MobileNavDrawer items={ITEMS} onClose={onClose} returnFocus={returnFocus} />
    </MemoryRouter>,
  )
  return { ...utils, onClose, returnFocus }
}

describe('MobileNavDrawer', () => {
  it('renders the dialog with close button and provided nav items', () => {
    renderDrawer()
    expect(screen.getByRole('dialog', { name: /navigation/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /close navigation menu/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/#about')
    expect(screen.getByRole('link', { name: 'Leaderboard' })).toHaveAttribute('href', '/leaderboard')
  })

  it('focuses the close button on mount', () => {
    renderDrawer()
    expect(screen.getByRole('button', { name: /close navigation menu/i })).toHaveFocus()
  })

  it('locks body scroll while mounted and restores it on unmount', () => {
    document.body.style.overflow = 'auto'
    const { unmount } = renderDrawer()
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('auto')
  })

  it('invokes onClose when the close button is clicked', () => {
    const { onClose } = renderDrawer()
    fireEvent.click(screen.getByRole('button', { name: /close navigation menu/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('invokes onClose when the backdrop is clicked', () => {
    const { container, onClose } = renderDrawer()
    const backdrop = container.querySelector('[aria-hidden="true"]')
    if (!backdrop) throw new Error('backdrop missing')
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('invokes onClose when Escape is pressed anywhere', () => {
    const { onClose } = renderDrawer()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('returns focus via the returnFocus callback on unmount', () => {
    const { unmount, returnFocus } = renderDrawer()
    unmount()
    expect(returnFocus).toHaveBeenCalledOnce()
  })
})
