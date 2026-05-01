import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { __resetPollingRegistry, usePolling } from './usePolling'

afterEach(() => {
  __resetPollingRegistry()
})

describe('usePolling snapshot identity', () => {
  it('preserves snapshot reference across no-op ticks when stabilize keeps data ref', async () => {
    const stableData = { value: 42 }
    // Each fetch returns a *new* object with the same content, mimicking
    // zod's fresh-parse behaviour. The stabiliser collapses them to one ref.
    const fetcher = vi.fn(() => Promise.resolve({ value: 42 }))
    const stabilize = (prev: { value: number } | undefined, next: { value: number }) =>
      prev && prev.value === next.value ? prev : next

    const { result } = renderHook(() =>
      usePolling('test:identity', fetcher, { intervalMs: 30, stabilize }),
    )

    await waitFor(() => {
      expect(result.current.data).toBeDefined()
    })
    const firstSnapshot = result.current
    expect(result.current.data).toEqual(stableData)

    await waitFor(
      () => {
        expect(fetcher.mock.calls.length).toBeGreaterThanOrEqual(3)
      },
      { timeout: 2000, interval: 20 },
    )

    // Same stable data + error + isLoading → same wrapper reference.
    expect(result.current).toBe(firstSnapshot)
    expect(result.current.data).toBe(firstSnapshot.data)
  })

  it('emits a fresh snapshot when stabilised data changes', async () => {
    let counter = 0
    const fetcher = vi.fn(() => Promise.resolve({ value: counter++ }))
    const stabilize = (prev: { value: number } | undefined, next: { value: number }) =>
      prev && prev.value === next.value ? prev : next

    const { result } = renderHook(() =>
      usePolling('test:churn', fetcher, { intervalMs: 30, stabilize }),
    )

    await waitFor(() => {
      expect(result.current.data).toBeDefined()
    })
    const firstSnapshot = result.current

    await waitFor(() => {
      expect(result.current.data).not.toBe(firstSnapshot.data)
    })

    expect(result.current).not.toBe(firstSnapshot)
  })
})
