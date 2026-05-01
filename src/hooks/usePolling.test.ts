import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { __resetPollingRegistry, usePolling } from './usePolling'

afterEach(() => {
  __resetPollingRegistry()
})

describe('usePolling snapshot identity', () => {
  it('preserves snapshot reference across no-op ticks', async () => {
    const stableData = { value: 42 }
    const fetcher = vi.fn(() => Promise.resolve(stableData))

    const { result } = renderHook(() => usePolling('test:identity', fetcher, 30))

    await waitFor(() => {
      expect(result.current.data).toBe(stableData)
    })
    const firstSnapshot = result.current

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(2)
    })

    // Same data + error + isLoading → same wrapper reference.
    expect(result.current).toBe(firstSnapshot)
  })

  it('emits a fresh snapshot when data identity changes', async () => {
    let counter = 0
    const fetcher = vi.fn(() => Promise.resolve({ value: counter++ }))

    const { result } = renderHook(() => usePolling('test:churn', fetcher, 30))

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
