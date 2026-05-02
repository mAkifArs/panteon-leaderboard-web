import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useUserId } from './useUserId'

const STORAGE_KEY = 'panteon.userId'

function setHref(href: string): void {
  // jsdom honors history.replaceState relative to the current origin,
  // so push the URL through the same API the hook uses.
  window.history.replaceState({}, '', href)
}

function installMockLocalStorage(): void {
  // jsdom 25 + vitest cleanup leaves localStorage in a state where
  // `setItem` works but `removeItem` is missing from the prototype.
  // Replace it with a fresh in-memory Storage so each test starts
  // empty and has the full Storage API.
  const mem = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v)
      },
      removeItem: (k: string) => {
        mem.delete(k)
      },
      clear: () => {
        mem.clear()
      },
      get length() {
        return mem.size
      },
      key: (i: number) => Array.from(mem.keys())[i] ?? null,
    },
  })
}

describe('useUserId', () => {
  beforeEach(() => {
    installMockLocalStorage()
    setHref('/')
  })

  it('reads the URL param on first render and prefers it over localStorage', () => {
    window.localStorage.setItem(STORAGE_KEY, 'from-storage')
    setHref('/leaderboard?userId=from-url')

    const { result } = renderHook(() => useUserId())
    expect(result.current.userId).toBe('from-url')
  })

  it('falls back to localStorage when no URL param is present', () => {
    window.localStorage.setItem(STORAGE_KEY, 'from-storage')
    setHref('/leaderboard')

    const { result } = renderHook(() => useUserId())
    expect(result.current.userId).toBe('from-storage')
  })

  it('returns null when neither source has a value', () => {
    setHref('/leaderboard')
    const { result } = renderHook(() => useUserId())
    expect(result.current.userId).toBeNull()
  })

  it('setUserId(id) writes to URL, localStorage, and state in one shot', () => {
    setHref('/leaderboard')
    const { result } = renderHook(() => useUserId())

    act(() => {
      result.current.setUserId('alice')
    })

    expect(result.current.userId).toBe('alice')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('alice')
    expect(new URL(window.location.href).searchParams.get('userId')).toBe('alice')
  })

  it('setUserId(null) clears URL, localStorage, and state', () => {
    window.localStorage.setItem(STORAGE_KEY, 'alice')
    setHref('/leaderboard?userId=alice')
    const { result } = renderHook(() => useUserId())
    expect(result.current.userId).toBe('alice')

    act(() => {
      result.current.setUserId(null)
    })

    expect(result.current.userId).toBeNull()
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(new URL(window.location.href).searchParams.get('userId')).toBeNull()
  })

  it('reacts to popstate so back/forward navigation re-syncs from URL', () => {
    setHref('/leaderboard?userId=first')
    const { result } = renderHook(() => useUserId())
    expect(result.current.userId).toBe('first')

    act(() => {
      setHref('/leaderboard?userId=second')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    expect(result.current.userId).toBe('second')
  })
})
