import { useState } from 'react'

interface UserPickerProps {
  userId: string | null
  onChange: (id: string | null) => void
}

export function UserPicker({ userId, onChange }: UserPickerProps): React.ReactElement {
  const [draft, setDraft] = useState(userId ?? '')

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const trimmed = draft.trim()
        onChange(trimmed === '' ? null : trimmed)
      }}
      className="flex items-end gap-2"
      aria-label="Pick a player"
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor="userId-input"
          className="text-[10px] font-semibold uppercase tracking-nav text-panteon-muted"
        >
          Player
        </label>
        <input
          id="userId-input"
          type="text"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
          }}
          placeholder="external user id"
          className="w-44 rounded-md border border-panteon-border bg-panteon-surface px-3 py-1.5 text-sm text-panteon-fg placeholder:text-panteon-muted/50"
        />
      </div>
      <button
        type="submit"
        className="rounded-md border border-panteon-border bg-panteon-surface-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-nav text-panteon-fg transition-colors hover:bg-panteon-surface"
      >
        Apply
      </button>
    </form>
  )
}
