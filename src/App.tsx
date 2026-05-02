import { Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { OfflineIndicator } from '@/shared/components/OfflineIndicator'
import { SiteFooter } from '@/shared/components/SiteFooter'
import { SiteHeader } from '@/shared/components/SiteHeader'
import { HomePage } from '@/pages/HomePage'
import { LeaderboardPage } from '@/pages/LeaderboardPage'

export function App(): React.ReactElement {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <ErrorBoundary
        fallback={(error, reset) => <AppErrorFallback error={error} reset={reset} />}
      >
        <ForceErrorGate>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ForceErrorGate>
      </ErrorBoundary>
      <SiteFooter />
      <OfflineIndicator />
    </div>
  )
}

/**
 * Test-only sentinel: visiting any route with `?force_error=throw`
 * raises a render exception so the app-level ErrorBoundary integration
 * (ADR-017) can be smoke-tested end-to-end in Cypress. The cost is one
 * `URLSearchParams.get` per render on a string compare; the only way a
 * real user trips this is by typing the query into the URL bar
 * themselves, in which case they get the boundary fallback that the
 * gate is designed to surface.
 */
function ForceErrorGate({ children }: { children: React.ReactNode }): React.ReactNode {
  if (typeof window !== 'undefined') {
    const force = new URLSearchParams(window.location.search).get('force_error')
    if (force === 'throw') {
      throw new Error('Forced error for boundary smoke test')
    }
  }
  return children
}

function NotFound(): React.ReactElement {
  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col items-start gap-4 px-4 py-20 sm:px-6">
      <span className="text-xs uppercase tracking-nav text-panteon-muted">404</span>
      <h1 className="font-sans text-3xl font-bold text-panteon-fg">Page not found</h1>
    </main>
  )
}

interface AppErrorFallbackProps {
  error: Error
  reset: () => void
}

function AppErrorFallback({ error, reset }: AppErrorFallbackProps): React.ReactElement {
  return (
    <main
      role="alert"
      className="mx-auto flex max-w-6xl flex-1 flex-col items-start gap-4 px-4 py-20 sm:px-6"
    >
      <span className="text-xs uppercase tracking-nav text-panteon-muted">Error</span>
      <h1 className="font-sans text-3xl font-bold text-panteon-fg">Something went wrong</h1>
      <p className="max-w-2xl font-mono text-sm text-panteon-muted">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="h-10 rounded-md bg-panteon-orange px-4 text-xs font-semibold uppercase tracking-nav text-white transition-colors hover:bg-panteon-orange-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-panteon-orange"
      >
        Try again
      </button>
    </main>
  )
}
