import { useState } from 'react'
import type { ViewEntry } from '@/shared/api/schemas'
import { ErrorState } from '@/shared/components/ErrorState'
import { RankBadge } from '@/features/leaderboard/components/RankBadge'
import { useSampleUsers } from '@/features/leaderboard/hooks/useSampleUsers'
import { formatCompact } from '@/shared/lib/format'

interface UserPickerProps {
  onSelect: (userId: string) => void
}

export function UserPicker({ onSelect }: UserPickerProps): React.ReactElement {
  const { data, error, isLoading } = useSampleUsers(5)

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-[1140px] px-[15px] py-16">
        <header className="mb-10 flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-[2px] text-panteon-eyebrow">
            Demo login
          </span>
          <h1 className="font-sans text-4xl font-extrabold tracking-tight text-panteon-fg sm:text-5xl">
            Pick a player to enter the leaderboard
          </h1>
          <p className="max-w-2xl text-sm text-panteon-muted">
            In production this screen is the player&apos;s logged-in identity. For review, choose
            one of the sampled players below — each spans a different rank tier so you can see the
            top, middle, and tail of the leaderboard. You can also enter a player ID manually.
          </p>
        </header>

        {isLoading && <SampleSkeletons />}
        {error && (
          <ErrorState>
            Couldn&apos;t load sample players: {error.message}. You can still enter a player ID
            below.
          </ErrorState>
        )}
        {data && data.users.length > 0 && <SampleGrid users={data.users} onSelect={onSelect} />}
        {data && data.users.length === 0 && (
          <p className="rounded-xl border border-panteon-border bg-panteon-surface p-6 text-sm text-panteon-muted">
            No players have earnings this week yet. Enter a player ID below to continue.
          </p>
        )}

        <ManualEntry onSelect={onSelect} />
      </section>
    </main>
  )
}

interface SampleGridProps {
  users: ViewEntry[]
  onSelect: (userId: string) => void
}

function SampleGrid({ users, onSelect }: SampleGridProps): React.ReactElement {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {users.map((user) => (
        <li key={user.userId}>
          <button
            type="button"
            onClick={() => {
              onSelect(user.userId)
            }}
            className="group flex w-full flex-col gap-4 rounded-2xl border border-panteon-border bg-panteon-surface p-5 text-left transition-colors hover:border-panteon-orange focus-visible:border-panteon-orange focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-panteon-orange"
          >
            <div className="flex items-center gap-3">
              <RankBadge rank={user.rank} size="lg" />
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-sans text-base font-bold text-panteon-fg">
                  {user.username}
                </span>
                <span className="font-mono text-xs uppercase tracking-nav text-panteon-muted">
                  {tierLabel(user.rank)}
                </span>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 border-t border-panteon-border pt-4 text-sm">
              <div className="flex flex-col">
                <dt className="text-[10px] uppercase tracking-nav text-panteon-muted">Rank</dt>
                <dd className="font-mono tabular-nums text-panteon-fg">
                  #{user.rank.toLocaleString('en-US')}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-[10px] uppercase tracking-nav text-panteon-muted">Earned</dt>
                <dd className="font-mono tabular-nums text-panteon-fg">
                  {formatCompact(user.score)}
                </dd>
              </div>
            </dl>
            <span className="inline-flex items-center justify-center rounded-md bg-panteon-orange px-3 py-2 text-xs font-semibold uppercase tracking-nav text-white transition-colors group-hover:bg-panteon-orange-deep">
              Continue as {user.username}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function SampleSkeletons(): React.ReactElement {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <li
          key={`sample-skel-${i.toString()}`}
          className="h-56 animate-pulse-soft rounded-2xl border border-panteon-border bg-panteon-surface"
        />
      ))}
    </ul>
  )
}

interface ManualEntryProps {
  onSelect: (userId: string) => void
}

function ManualEntry({ onSelect }: ManualEntryProps): React.ReactElement {
  const [draft, setDraft] = useState('')

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const trimmed = draft.trim()
        if (trimmed === '') return
        onSelect(trimmed)
      }}
      aria-label="Manual player id entry"
      autoComplete="off"
      className="mt-10 flex flex-col gap-2 border-t border-panteon-border pt-8"
    >
      <label
        htmlFor="manual-userId"
        className="text-[10px] font-semibold uppercase tracking-nav text-panteon-muted"
      >
        Or enter a player ID
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="manual-userId"
          name="manual-userId"
          type="text"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
          }}
          placeholder="e.g. user_42"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-1p-ignore="true"
          data-lpignore="true"
          data-form-type="other"
          className="h-10 w-full flex-1 rounded-md border border-panteon-border bg-panteon-surface px-3 text-sm text-panteon-fg placeholder:text-panteon-muted/50 focus-visible:border-panteon-orange focus-visible:outline-none"
        />
        <button
          type="submit"
          className="h-10 rounded-md border border-panteon-border bg-panteon-surface-2 px-4 text-xs font-semibold uppercase tracking-nav text-panteon-fg transition-colors hover:border-panteon-orange hover:text-panteon-orange focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-panteon-orange"
        >
          Continue
        </button>
      </div>
    </form>
  )
}

function tierLabel(rank: number): string {
  if (rank <= 3) return 'Top tier'
  if (rank <= 100) return 'Top 100'
  return 'Mid pack'
}
