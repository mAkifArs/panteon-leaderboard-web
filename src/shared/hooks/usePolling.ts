import { useCallback, useRef, useSyncExternalStore } from 'react'
import { ApiError } from '@/shared/api/client'

/**
 * Module-scoped polling registry (ADR-004).
 *
 * One timer + one in-flight fetch per `key`. Mounting the same
 * key from multiple components shares state; the timer goes away
 * only when the last subscriber unmounts. Visibility-aware: the
 * tick is a no-op while `document.visibilityState === 'hidden'`,
 * and an immediate refetch fires on `visible` again.
 */

type Status = 'idle' | 'loading' | 'success' | 'error'

interface Entry {
  status: Status
  data: unknown
  error: Error | undefined
  inFlight: AbortController | undefined
  timer: ReturnType<typeof setTimeout> | undefined
  intervalMs: number
  /**
   * One-shot override for the next scheduled tick — used when a
   * fetch fails with 429 and the server supplied `Retry-After`.
   * Consumed by `schedule` and reset back to undefined immediately,
   * so subsequent ticks fall back to `intervalMs`.
   */
  nextDelayMs: number | undefined
  fetcher: (signal: AbortSignal) => Promise<unknown>
  stabilize: ((prev: unknown, next: unknown) => unknown) | undefined
  subscribers: Set<() => void>
  mounts: number
  cachedSnapshot: PollingState<unknown>
}

const registry = new Map<string, Entry>()
let visibilityListenerAttached = false
let onlineListenerAttached = false

const EMPTY_SNAPSHOT: PollingState<never> = Object.freeze({
  data: undefined,
  error: undefined,
  isLoading: false,
})

// Identity-stable: the snapshot wrapper's reference is preserved
// across no-op ticks (same data ref, same error, same isLoading).
// Without this guard `useSyncExternalStore` re-renders consumers
// every tick even when the response was structurally identical —
// breaking the React Compiler memoisation chain that ADR-012
// relies on.
function rebuildSnapshot(entry: Entry): void {
  const isLoading = entry.status === 'loading'
  const prev = entry.cachedSnapshot
  if (prev.data === entry.data && prev.error === entry.error && prev.isLoading === isLoading) {
    return
  }
  entry.cachedSnapshot = {
    data: entry.data,
    error: entry.error,
    isLoading,
  }
}

function notify(entry: Entry): void {
  rebuildSnapshot(entry)
  entry.subscribers.forEach((cb) => {
    cb()
  })
}

function runTick(key: string): void {
  const entry = registry.get(key)
  if (!entry) return
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
  // Skip while offline (ADR-018). The browser would reject the fetch
  // anyway; suppressing the request avoids 5s-cadence error noise in
  // devtools and stops error state from flapping. The `online` event
  // listener (`attachOnlineListener`) re-runs the tick on reconnect.
  if (typeof navigator !== 'undefined' && !navigator.onLine) return

  entry.inFlight?.abort()
  const ac = new AbortController()
  entry.inFlight = ac
  if (entry.data === undefined) {
    entry.status = 'loading'
    notify(entry)
  }

  entry.fetcher(ac.signal).then(
    (data) => {
      if (ac.signal.aborted) return
      entry.data = entry.stabilize ? entry.stabilize(entry.data, data) : data
      entry.error = undefined
      entry.status = 'success'
      entry.inFlight = undefined
      notify(entry)
    },
    (err: unknown) => {
      if (ac.signal.aborted) return
      if (err instanceof DOMException && err.name === 'AbortError') return
      entry.error = err instanceof Error ? err : new Error(String(err))
      entry.status = 'error'
      entry.inFlight = undefined
      // 429 + Retry-After: the server told us when to come back.
      // Push the next scheduled tick out by that amount, but never
      // shorter than our normal interval — Retry-After can be sub-
      // second and we shouldn't poll faster than intended.
      // Reschedule so the override actually replaces the timer that
      // the outer `schedule` call (synchronous after `runTick`)
      // already set with the default interval.
      if (
        err instanceof ApiError &&
        err.status === 429 &&
        err.retryAfterSec !== undefined
      ) {
        entry.nextDelayMs = Math.max(err.retryAfterSec * 1000, entry.intervalMs)
        schedule(key)
      }
      notify(entry)
    },
  )
}

function schedule(key: string): void {
  const entry = registry.get(key)
  if (!entry) return
  if (entry.timer) clearTimeout(entry.timer)
  const delay = entry.nextDelayMs ?? entry.intervalMs
  entry.nextDelayMs = undefined
  entry.timer = setTimeout(() => {
    runTick(key)
    schedule(key)
  }, delay)
}

function attachVisibilityListener(): void {
  if (visibilityListenerAttached) return
  if (typeof document === 'undefined') return
  visibilityListenerAttached = true
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return
    registry.forEach((_, key) => {
      runTick(key)
    })
  })
}

function attachOnlineListener(): void {
  if (onlineListenerAttached) return
  if (typeof window === 'undefined') return
  onlineListenerAttached = true
  // Symmetric to the visibility handler (ADR-003 / ADR-018):
  // when the browser regains connectivity, refetch every active
  // key immediately so the user does not wait up to `intervalMs`
  // for stale data to clear.
  window.addEventListener('online', () => {
    registry.forEach((_, key) => {
      runTick(key)
    })
  })
}

export interface PollingState<T> {
  data: T | undefined
  error: Error | undefined
  isLoading: boolean
}

export interface UsePollingOptions<T> {
  intervalMs?: number
  /**
   * Optional structural-equal stabiliser. Without it, every fetch
   * resolves to a fresh object reference and `rebuildSnapshot`'s
   * identity guard always fails — so every tick wakes every consumer
   * even when the wire payload is unchanged. Pass a stabiliser
   * (typically built on `lib/structural-equal.ts`) to keep the
   * `data` reference stable across no-op ticks.
   */
  stabilize?: (prev: T | undefined, next: T) => T
}

export function usePolling<T>(
  key: string | null,
  fetcher: (signal: AbortSignal) => Promise<T>,
  options: UsePollingOptions<T> = {},
): PollingState<T> {
  const { intervalMs = 5000, stabilize } = options
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const stabilizeRef = useRef(stabilize)
  stabilizeRef.current = stabilize

  const subscribe = useCallback(
    (cb: () => void) => {
      if (!key) return () => undefined
      attachVisibilityListener()
      attachOnlineListener()

      let entry = registry.get(key)
      if (!entry) {
        entry = {
          status: 'idle',
          data: undefined,
          error: undefined,
          inFlight: undefined,
          timer: undefined,
          intervalMs,
          nextDelayMs: undefined,
          fetcher: (signal) => fetcherRef.current(signal),
          stabilize: stabilizeRef.current
            ? (prev, next) =>
                (stabilizeRef.current as (p: T | undefined, n: T) => T)(prev as T | undefined, next as T)
            : undefined,
          subscribers: new Set(),
          mounts: 0,
          cachedSnapshot: EMPTY_SNAPSHOT,
        }
        registry.set(key, entry)
        rebuildSnapshot(entry)
      }
      entry.subscribers.add(cb)
      entry.mounts += 1

      if (entry.mounts === 1) {
        runTick(key)
        schedule(key)
      }

      return () => {
        const e = registry.get(key)
        if (!e) return
        e.subscribers.delete(cb)
        e.mounts -= 1
        if (e.mounts === 0) {
          if (e.timer) clearTimeout(e.timer)
          e.inFlight?.abort()
          registry.delete(key)
        }
      }
    },
    [key, intervalMs],
  )

  const getSnapshot = useCallback((): PollingState<T> => {
    if (!key) return EMPTY_SNAPSHOT
    const entry = registry.get(key)
    if (!entry) return EMPTY_SNAPSHOT
    return entry.cachedSnapshot as PollingState<T>
  }, [key])

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function __resetPollingRegistry(): void {
  registry.forEach((e) => {
    if (e.timer) clearTimeout(e.timer)
    e.inFlight?.abort()
  })
  registry.clear()
}
