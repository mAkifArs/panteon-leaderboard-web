import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'

export interface NavItem {
  readonly kind: 'hash' | 'route'
  readonly label: string
  readonly to: string
}

interface MobileNavDrawerProps {
  items: readonly NavItem[]
  onClose: () => void
  /**
   * Invoked on unmount so the parent can return keyboard focus to
   * whatever opened the drawer (typically the hamburger button).
   * The drawer doesn't hold a ref to the trigger directly — the
   * parent owns that knowledge.
   */
  returnFocus: () => void
}

export function MobileNavDrawer({
  items,
  onClose,
  returnFocus,
}: MobileNavDrawerProps): React.ReactElement {
  const closeRef = useRef<HTMLButtonElement>(null)

  // Stash callbacks in refs so the lifecycle effect can stay
  // mount-only (`[]` deps) while still invoking the latest impls.
  // Without this, an inline `onClose` from the parent would change
  // identity each render and re-trigger setup/cleanup, which would
  // steal focus back to the trigger mid-interaction.
  const onCloseRef = useRef(onClose)
  const returnFocusRef = useRef(returnFocus)
  onCloseRef.current = onClose
  returnFocusRef.current = returnFocus

  useEffect(() => {
    closeRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
      returnFocusRef.current()
    }
  }, [])

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-label="Navigation"
        aria-modal="true"
        className="fixed right-0 top-0 z-50 flex h-full w-[280px] flex-col bg-panteon-surface lg:hidden"
      >
        <div className="flex items-center justify-end p-4">
          <button
            ref={closeRef}
            type="button"
            aria-label="Close navigation menu"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center text-panteon-fg transition-colors hover:text-panteon-orange focus-visible:outline focus-visible:outline-2 focus-visible:outline-panteon-orange"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="2" y1="2" x2="14" y2="14" />
              <line x1="14" y1="2" x2="2" y2="14" />
            </svg>
          </button>
        </div>
        <nav aria-label="Mobile primary">
          <ul className="flex flex-col gap-4 px-6">
            {items.map((item) =>
              item.kind === 'route' ? (
                <li key={item.label}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `block py-1 text-[15px] font-medium uppercase tracking-[0.5px] transition-colors hover:text-panteon-orange ${
                        isActive ? 'text-panteon-orange' : 'text-panteon-fg'
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
                    className="block py-1 text-[15px] font-medium uppercase tracking-[0.5px] text-panteon-fg transition-colors hover:text-panteon-orange"
                  >
                    {item.label}
                  </a>
                </li>
              ),
            )}
          </ul>
        </nav>
      </aside>
    </>
  )
}
