import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'About', to: '/#about' },
  { label: "What's Going On", to: '/#news' },
  { label: 'Games', to: '/#games' },
] as const

// Hysteresis prevents the height animation from oscillating when
// the user lands near a single threshold (trackpad inertia or the
// header's own collapse-induced layout shift can re-cross a single
// trigger). The 50px gap between SHRINK and GROW absorbs that.
const SHRINK_AT = 80
const GROW_AT = 30

export function SiteHeader(): React.ReactElement {
  const [scrolled, setScrolled] = useState(false)

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

  return (
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

        <div className="hidden items-center gap-6 lg:flex">
          <nav aria-label="Primary">
            <ul className="flex items-center">
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.to}
                    className="block px-3 py-2 text-[15px] font-medium uppercase tracking-[0.5px] text-panteon-muted transition-colors hover:text-panteon-orange"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <NavLink
                  to="/leaderboard"
                  className={({ isActive }) =>
                    `block px-3 py-2 text-[15px] font-medium uppercase tracking-[0.5px] transition-colors hover:text-panteon-orange ${
                      isActive ? 'text-panteon-orange' : 'text-panteon-muted'
                    }`
                  }
                >
                  Leaderboard
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#store"
              className="inline-flex h-7 items-center rounded-lg bg-panteon-orange px-4 text-[15px] font-medium uppercase text-panteon-fg transition-colors hover:bg-panteon-orange-deep"
            >
              Store
            </a>
            <button
              type="button"
              aria-label="Switch language"
              className="inline-flex h-7 items-center gap-1 rounded-[10px] border border-[#979797] px-4 text-[15px] font-medium uppercase text-panteon-fg transition-colors hover:border-panteon-orange hover:text-panteon-orange"
            >
              EN
              <span aria-hidden="true" className="text-[10px]">
                ▾
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
