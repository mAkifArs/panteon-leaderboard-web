import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scrolls to `#hash` targets on SPA navigation. The browser handles
 * this for full page loads, but `react-router-dom` only updates
 * history without scrolling, so a link from `/leaderboard` to
 * `/#about` would land at the top of the home page instead of the
 * About section.
 *
 * The hook waits one animation frame so the destination route has
 * had a chance to mount its sections before we look them up.
 * Sticky-header offset is solved at the section level via Tailwind's
 * `scroll-mt-*` utility — keeping it in CSS means the math doesn't
 * have to know about the header's collapsed/expanded heights.
 */
export function useScrollToHash(): void {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const id = hash.slice(1)
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => {
      cancelAnimationFrame(raf)
    }
  }, [pathname, hash])
}
