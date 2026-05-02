import { useEffect, useState } from 'react'

/**
 * Passive offline indicator (ADR-018).
 *
 * Renders nothing while online — online is the normal state and
 * the chrome should not advertise it. When `navigator.onLine`
 * flips to false, mounts a small icon button at the bottom-right
 * that reveals an explanatory popover on click.
 *
 * The leaderboard itself keeps showing the last successful
 * polling response while offline (the polling registry preserves
 * `data` across failed ticks). This component is signal only —
 * the recovery is the polling tick that fires immediately on the
 * `online` event (see `attachOnlineListener` in `usePolling`).
 */
export function OfflineIndicator(): React.ReactElement | null {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleOnline = (): void => {
      setOnline(true)
      setOpen(false)
    }
    const handleOffline = (): void => {
      setOnline(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Dismiss the popover when the user clicks anywhere outside it.
  useEffect(() => {
    if (!open) return
    const handle = (event: MouseEvent): void => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('[data-offline-indicator]')) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => {
      document.removeEventListener('mousedown', handle)
    }
  }, [open])

  if (online) return null

  return (
    <div
      data-offline-indicator
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2"
    >
      {open && (
        <div
          role="alert"
          className="max-w-xs rounded-lg border border-panteon-border bg-panteon-surface p-4 shadow-lg"
        >
          <p className="text-sm font-semibold text-panteon-fg">You are offline</p>
          <p className="mt-1 text-xs text-panteon-muted">
            Showing the last known data. We&apos;ll refresh as soon as you&apos;re back online.
          </p>
        </div>
      )}
      <button
        type="button"
        aria-label="You are offline. Click for details."
        aria-expanded={open}
        onClick={() => {
          setOpen((prev) => !prev)
        }}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-panteon-orange bg-panteon-surface text-panteon-orange shadow-lg transition-colors hover:bg-panteon-orange hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-panteon-orange"
      >
        <WifiOffIcon />
      </button>
    </div>
  )
}

function WifiOffIcon(): React.ReactElement {
  // Inline SVG (Lucide-style line icon, 18px). No icon-library
  // dependency — minimal-dep policy.
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 2l20 20" />
      <path d="M8.5 16.5a5 5 0 0 1 7 0" />
      <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
      <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
      <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
      <path d="M5 13a10 10 0 0 1 5.24-2.76" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  )
}
