import { Route, Routes } from 'react-router-dom'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { HomePage } from '@/pages/HomePage'
import { LeaderboardPage } from '@/pages/LeaderboardPage'

export function App(): React.ReactElement {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <SiteFooter />
    </div>
  )
}

function NotFound(): React.ReactElement {
  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col items-start gap-4 px-4 py-20 sm:px-6">
      <span className="text-xs uppercase tracking-nav text-panteon-muted">404</span>
      <h1 className="font-sans text-3xl font-bold text-panteon-fg">Page not found</h1>
    </main>
  )
}
