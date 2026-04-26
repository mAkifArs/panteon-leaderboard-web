import { useEffect, useState } from 'react'
import { nextResetAt } from '@/lib/iso-week'

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

export function CountdownToReset(): React.ReactElement {
  const [remaining, setRemaining] = useState(() => nextResetAt().getTime() - Date.now())

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(nextResetAt().getTime() - Date.now())
    }, 1000)
    return () => {
      clearInterval(id)
    }
  }, [])

  return (
    <span
      className="font-mono text-sm tabular-nums text-panteon-fg"
      aria-label="Time until weekly reset"
    >
      {formatRemaining(remaining)}
    </span>
  )
}
