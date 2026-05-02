import { useEffect, useState } from 'react'
import { nextResetAt } from '@/features/leaderboard/lib/iso-week'

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function formatRemaining(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (d > 0) return `${d.toString()}d ${h.toString()}h ${m.toString()}m`
  if (h > 0) return `${h.toString()}h ${m.toString()}m ${s.toString()}s`
  return `${m.toString()}m ${s.toString()}s`
}

function formatRemainingCompact(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${d.toString()}d ${pad(h)}:${pad(m)}:${pad(s)}`
}

interface CountdownToResetProps {
  weekEnd?: string | undefined
  compact?: boolean
}

function resolveResetMs(weekEnd: string | undefined): number {
  if (weekEnd) {
    const t = Date.parse(weekEnd)
    if (!Number.isNaN(t)) return t - Date.now()
  }
  return nextResetAt().getTime() - Date.now()
}

export function CountdownToReset({
  weekEnd,
  compact = false,
}: CountdownToResetProps = {}): React.ReactElement {
  const [remaining, setRemaining] = useState(() => resolveResetMs(weekEnd))

  useEffect(() => {
    setRemaining(resolveResetMs(weekEnd))
    const id = setInterval(() => {
      setRemaining(resolveResetMs(weekEnd))
    }, 1000)
    return () => {
      clearInterval(id)
    }
  }, [weekEnd])

  return (
    <span
      className="font-mono text-[13px] tabular-nums text-panteon-fg"
      aria-label="Time until weekly reset"
    >
      {compact ? formatRemainingCompact(remaining) : formatRemaining(remaining)}
    </span>
  )
}
