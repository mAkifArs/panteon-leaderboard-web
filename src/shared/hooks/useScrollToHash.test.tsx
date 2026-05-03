import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement, ReactNode } from 'react'
import { useScrollToHash } from './useScrollToHash'

function wrapperWith(initialEntries: string[]): (props: { children: ReactNode }) => ReactElement {
  return ({ children }) => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  )
}

describe('useScrollToHash', () => {
  beforeEach(() => {
    // Run rAF synchronously so the effect's callback fires before the
    // assertions instead of waiting on the real animation tick.
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 0
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('scrolls to the matching element when a hash is present', () => {
    const target = document.createElement('section')
    target.id = 'about'
    const scrollIntoView = vi.fn()
    target.scrollIntoView = scrollIntoView
    document.body.appendChild(target)

    renderHook(() => {
      useScrollToHash()
    }, { wrapper: wrapperWith(['/#about']) })

    expect(scrollIntoView).toHaveBeenCalledOnce()
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
  })

  it('does nothing when no hash is in the URL', () => {
    const target = document.createElement('section')
    target.id = 'about'
    const scrollIntoView = vi.fn()
    target.scrollIntoView = scrollIntoView
    document.body.appendChild(target)

    renderHook(() => {
      useScrollToHash()
    }, { wrapper: wrapperWith(['/leaderboard']) })

    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('silently no-ops when the hash points at a non-existent element', () => {
    // No element with id="ghost" in the DOM. The hook should not throw.
    expect(() => {
      renderHook(() => {
        useScrollToHash()
      }, { wrapper: wrapperWith(['/#ghost']) })
    }).not.toThrow()
  })

  it('cancels the queued frame on unmount', () => {
    const cancel = vi.spyOn(globalThis, 'cancelAnimationFrame')
    const { unmount } = renderHook(() => {
      useScrollToHash()
    }, { wrapper: wrapperWith(['/#about']) })

    unmount()
    expect(cancel).toHaveBeenCalled()
  })
})
