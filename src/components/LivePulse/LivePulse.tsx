import { useEffect, useState } from 'react'

interface LivePulseProps {
  weekLabel: string
}

export function LivePulse({ weekLabel }: LivePulseProps): React.ReactElement {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1)
    }, 5000)
    return () => {
      clearInterval(id)
    }
  }, [])

  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2 rounded border border-panteon-orange/40 bg-panteon-orange/[0.08] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-panteon-orange"
    >
      <span
        key={tick}
        aria-hidden="true"
        className="live-dot inline-block h-1.5 w-1.5 animate-lb-pulse rounded-full bg-trend-up"
      />
      <span className="sr-only">Live · </span>
      Live
      <span aria-hidden="true" className="h-2.5 w-px bg-panteon-orange/30" />
      <span>{weekLabel}</span>
    </span>
  )
}
