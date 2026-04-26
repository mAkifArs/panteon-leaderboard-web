import { useCallback, useRef, useSyncExternalStore } from 'react'

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
  lastUpdatedAt: number | undefined
  inFlight: AbortController | undefined
  timer: ReturnType<typeof setTimeout> | undefined
  intervalMs: number
  fetcher: (signal: AbortSignal) => Promise<unknown>
  subscribers: Set<() => void>
  mounts: number
  cachedSnapshot: PollingState<unknown>
}

const registry = new Map<string, Entry>()
let visibilityListenerAttached = false

const EMPTY_SNAPSHOT: PollingState<never> = Object.freeze({
  data: undefined,
  error: undefined,
  isLoading: false,
  lastUpdatedAt: undefined,
})

function rebuildSnapshot(entry: Entry): void {
  entry.cachedSnapshot = {
    data: entry.data,
    error: entry.error,
    isLoading: entry.status === 'loading',
    lastUpdatedAt: entry.lastUpdatedAt,
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
      entry.data = data
      entry.error = undefined
      entry.status = 'success'
      entry.lastUpdatedAt = Date.now()
      entry.inFlight = undefined
      notify(entry)
    },
    (err: unknown) => {
      if (ac.signal.aborted) return
      if (err instanceof DOMException && err.name === 'AbortError') return
      entry.error = err instanceof Error ? err : new Error(String(err))
      entry.status = 'error'
      entry.inFlight = undefined
      notify(entry)
    },
  )
}

function schedule(key: string): void {
  const entry = registry.get(key)
  if (!entry) return
  if (entry.timer) clearTimeout(entry.timer)
  entry.timer = setTimeout(() => {
    runTick(key)
    schedule(key)
  }, entry.intervalMs)
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

export interface PollingState<T> {
  data: T | undefined
  error: Error | undefined
  isLoading: boolean
  lastUpdatedAt: number | undefined
}

export function usePolling<T>(
  key: string | null,
  fetcher: (signal: AbortSignal) => Promise<T>,
  intervalMs = 5000,
): PollingState<T> {
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const subscribe = useCallback(
    (cb: () => void) => {
      if (!key) return () => undefined
      attachVisibilityListener()

      let entry = registry.get(key)
      if (!entry) {
        entry = {
          status: 'idle',
          data: undefined,
          error: undefined,
          lastUpdatedAt: undefined,
          inFlight: undefined,
          timer: undefined,
          intervalMs,
          fetcher: (signal) => fetcherRef.current(signal),
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
