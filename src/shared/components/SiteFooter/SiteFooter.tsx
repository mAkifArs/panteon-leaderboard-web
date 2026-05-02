/**
 * Footer mirrors the panteon.games style: dark band, muted legal
 * link strip, wordmark and copyright. No external links — this is
 * a case study, not the live company site.
 */

const LEGAL_LINKS = ['Privacy Policy', 'Cookie Policy', 'Terms of Use', 'Data Protection'] as const

export function SiteFooter(): React.ReactElement {
  return (
    <footer className="mt-16 border-t border-panteon-border bg-panteon-bg">
      <div className="mx-auto flex max-w-[1140px] flex-col gap-6 px-[15px] py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <img
            src="/panteon/brand/logo.png"
            alt="Panteon"
            width={164}
            height={28}
            className="h-7 w-auto object-contain"
          />
          <span className="text-xs text-panteon-muted">
            Leaderboard case study · not affiliated with Panteon Games
          </span>
        </div>

        <nav aria-label="Legal">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((label) => (
              <li key={label}>
                <a
                  href="#"
                  className="text-xs uppercase tracking-nav text-panteon-muted transition-colors hover:text-panteon-fg"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
