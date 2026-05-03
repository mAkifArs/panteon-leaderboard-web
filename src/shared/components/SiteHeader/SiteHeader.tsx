import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { MobileNavDrawer, type NavItem } from '@/shared/components/MobileNavDrawer'

const NAV_ITEMS: readonly NavItem[] = [
  { kind: 'hash', label: 'About', to: '/#about' },
  { kind: 'hash', label: "What's Going On", to: '/#news' },
  { kind: 'hash', label: 'Games', to: '/#games' },
  { kind: 'route', label: 'Leaderboard', to: '/leaderboard' },
]

// Hysteresis prevents the height animation from oscillating when
// the user lands near a single threshold (trackpad inertia or the
// header's own collapse-induced layout shift can re-cross a single
// trigger). The 50px gap between SHRINK and GROW absorbs that.
const SHRINK_AT = 80
const GROW_AT = 30

export function SiteHeader(): React.ReactElement {
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()

  useEffect(() => {
    const onScroll = (): void => {
      setScrolled((prev) => {
        const y = window.scrollY
        if (!prev && y > SHRINK_AT) return true
        if (prev && y < GROW_AT) return false
        return prev
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  // Auto-close the drawer when the user navigates. Picking a link
  // is the user's "I'm done with this menu" signal, so the panel
  // dismisses without a second action.
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname, location.hash])

  return (
    <>
      <header
        className={`sticky top-0 z-40 bg-panteon-bg transition-[height] duration-300 ease-in-out ${
          scrolled ? 'h-[66px]' : 'h-24'
        }`}
      >
        <div className="mx-auto flex h-full max-w-[1140px] items-center justify-between px-[15px]">
          <Link to="/" aria-label="Panteon home" className="block">
            <img
              src="/panteon/brand/logo.png"
              alt="Panteon"
              width={180}
              height={30}
              className="h-[30px] w-[180px]"
            />
          </Link>

          <nav aria-label="Primary" className="hidden items-center lg:flex">
            <ul className="flex items-center">
              {NAV_ITEMS.map((item) =>
                item.kind === 'route' ? (
                  <li key={item.label}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `block px-3 py-2 text-[15px] font-medium uppercase tracking-[0.5px] transition-colors hover:text-panteon-orange ${
                          isActive ? 'text-panteon-orange' : 'text-panteon-muted'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ) : (
                  <li key={item.label}>
                    <a
                      href={item.to}
                      className="block px-3 py-2 text-[15px] font-medium uppercase tracking-[0.5px] text-panteon-muted transition-colors hover:text-panteon-orange"
                    >
                      {item.label}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <button
            ref={hamburgerRef}
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            aria-controls="mobile-nav-drawer"
            onClick={() => {
              setDrawerOpen(true)
            }}
            className="grid h-10 w-10 place-items-center rounded-md border border-panteon-border-strong text-panteon-fg transition-colors hover:border-panteon-orange hover:text-panteon-orange focus-visible:outline focus-visible:outline-2 focus-visible:outline-panteon-orange lg:hidden"
          >
            <svg
              width="20"
              height="14"
              viewBox="0 0 20 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="1" y1="1" x2="19" y2="1" />
              <line x1="1" y1="7" x2="19" y2="7" />
              <line x1="1" y1="13" x2="19" y2="13" />
            </svg>
          </button>
        </div>
      </header>

      {drawerOpen ? (
        <MobileNavDrawer
          items={NAV_ITEMS}
          onClose={() => {
            setDrawerOpen(false)
          }}
          returnFocus={() => hamburgerRef.current?.focus()}
        />
      ) : null}
    </>
  )
}
