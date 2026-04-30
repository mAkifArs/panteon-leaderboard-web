import { createRef } from 'react'
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LeaderboardList, type LeaderboardListHandle } from './LeaderboardList'
import type { ViewEntry } from '@/api/schemas'

function makeEntries(n: number): ViewEntry[] {
  return Array.from({ length: n }, (_, i) => ({
    rank: i + 4, // list section starts at rank 4 (podium owns 1..3)
    userId: `user_${(i + 4).toString()}`,
    username: `Player${(i + 4).toString()}`,
    score: String(1_000_000 - i * 1000),
    country: 'TR',
  }))
}

type IOCallback = (entries: IntersectionObserverEntry[]) => void

interface FakeIO {
  observe: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
  unobserve: ReturnType<typeof vi.fn>
  trigger: (isIntersecting: boolean) => void
}

const ioInstances: FakeIO[] = []

beforeEach(() => {
  ioInstances.length = 0
  class MockIO {
    observe: ReturnType<typeof vi.fn>
    disconnect: ReturnType<typeof vi.fn>
    unobserve: ReturnType<typeof vi.fn>
    private cb: IOCallback
    constructor(cb: IOCallback) {
      this.cb = cb
      this.observe = vi.fn()
      this.disconnect = vi.fn()
      this.unobserve = vi.fn()
      ioInstances.push({
        observe: this.observe,
        disconnect: this.disconnect,
        unobserve: this.unobserve,
        trigger: (isIntersecting: boolean) => {
          this.cb([{ isIntersecting } as unknown as IntersectionObserverEntry])
        },
      })
    }
  }
  // jsdom has no IntersectionObserver
  vi.stubGlobal('IntersectionObserver', MockIO)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function rowCount(): number {
  // Filter rows that look like data rows (have an aria-label starting with Rank)
  return screen
    .getAllByRole('row')
    .filter((el) => /^Rank \d+:/.test(el.getAttribute('aria-label') ?? '')).length
}

describe('LeaderboardList reveal', () => {
  it('renders the first PAGE_SIZE rows initially', () => {
    render(
      <LeaderboardList
        entries={makeEntries(50)}
        selfUserId="user_99"
        loading={false}
        error={undefined}
      />,
    )
    expect(rowCount()).toBe(20)
  })

  it('expands by PAGE_SIZE when the sentinel intersects', () => {
    vi.useFakeTimers()
    render(
      <LeaderboardList
        entries={makeEntries(50)}
        selfUserId="user_99"
        loading={false}
        error={undefined}
      />,
    )
    expect(rowCount()).toBe(20)

    act(() => {
      ioInstances.at(-1)?.trigger(true)
    })
    act(() => {
      vi.runAllTimers()
    })
    expect(rowCount()).toBe(40)

    act(() => {
      ioInstances.at(-1)?.trigger(true)
    })
    act(() => {
      vi.runAllTimers()
    })
    // After 40 → 60, but only 50 entries: clamp to 50
    expect(rowCount()).toBe(50)
    vi.useRealTimers()
  })

  it('hides the sentinel once everything is revealed', () => {
    render(
      <LeaderboardList
        entries={makeEntries(15)}
        selfUserId="user_99"
        loading={false}
        error={undefined}
      />,
    )
    // 15 < PAGE_SIZE → no sentinel from the start
    expect(screen.queryByTestId('reveal-sentinel')).toBeNull()
    expect(rowCount()).toBe(15)
  })

  it('ensureRankVisible(rank) reveals at least the target rank', () => {
    const ref = createRef<LeaderboardListHandle>()
    render(
      <LeaderboardList
        ref={ref}
        entries={makeEntries(97)}
        selfUserId="user_99"
        loading={false}
        error={undefined}
      />,
    )
    expect(rowCount()).toBe(20)

    // rank=45 → idx=41 (rank 45 - 4) → ceil(42/20)*20 = 60
    act(() => {
      ref.current?.ensureRankVisible(45)
    })
    expect(rowCount()).toBe(60)
  })

  it('ensureRankVisible clamps to entries.length on the last page', () => {
    const ref = createRef<LeaderboardListHandle>()
    render(
      <LeaderboardList
        ref={ref}
        entries={makeEntries(97)}
        selfUserId="user_99"
        loading={false}
        error={undefined}
      />,
    )
    // rank=100 → idx=96 → ceil(97/20)*20 = 100, clamp to 97
    act(() => {
      ref.current?.ensureRankVisible(100)
    })
    expect(rowCount()).toBe(97)
  })

  it('does not shrink revealed when ensureRankVisible target is already visible', () => {
    const ref = createRef<LeaderboardListHandle>()
    render(
      <LeaderboardList
        ref={ref}
        entries={makeEntries(97)}
        selfUserId="user_99"
        loading={false}
        error={undefined}
      />,
    )
    act(() => {
      ref.current?.ensureRankVisible(80) // expands to 80
    })
    expect(rowCount()).toBe(80)

    act(() => {
      ref.current?.ensureRankVisible(10) // already visible
    })
    expect(rowCount()).toBe(80)
  })

  it('resets revealed when entries identity changes', () => {
    vi.useFakeTimers()
    const first = makeEntries(50)
    const { rerender } = render(
      <LeaderboardList entries={first} selfUserId="user_99" loading={false} error={undefined} />,
    )
    act(() => {
      ioInstances.at(-1)?.trigger(true)
    })
    act(() => {
      vi.runAllTimers()
    })
    expect(rowCount()).toBe(40)

    // New array identity (week rollover / user switch)
    const second = makeEntries(50)
    rerender(
      <LeaderboardList entries={second} selfUserId="user_99" loading={false} error={undefined} />,
    )
    expect(rowCount()).toBe(20)
    vi.useRealTimers()
  })

  it('exposes a polite live region with the showing/total count', () => {
    render(
      <LeaderboardList
        entries={makeEntries(50)}
        selfUserId="user_99"
        loading={false}
        error={undefined}
      />,
    )
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Showing 20 of 50 players')
  })
})
