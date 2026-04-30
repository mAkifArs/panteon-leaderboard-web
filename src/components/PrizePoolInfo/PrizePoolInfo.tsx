import { useEffect, useId, useRef, useState } from 'react'

const TOOLTIP_TEXT = `Each earning contributes 2% to this week's prize pool. When the
week ends, the pool is split across the top 100: 1st gets 20%,
2nd 15%, 3rd 10%, and the remaining 55% is distributed across
ranks 4–100 by a linear weighting.`

export function PrizePoolInfo(): React.ReactElement {
  const [open, setOpen] = useState(false)
  const tooltipId = useId()
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (event: MouseEvent): void => {
      if (!containerRef.current) return
      if (containerRef.current.contains(event.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
    }
  }, [open])

  return (
    <span
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={() => {
        setOpen(true)
      }}
      onMouseLeave={() => {
        setOpen(false)
      }}
    >
      <button
        type="button"
        aria-label="Prize pool details"
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onFocus={() => {
          setOpen(true)
        }}
        onBlur={() => {
          setOpen(false)
        }}
        onClick={() => {
          setOpen((v) => !v)
        }}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-panteon-border bg-panteon-surface-2 text-[10px] font-semibold leading-none text-panteon-muted transition-colors hover:border-panteon-orange hover:text-panteon-orange focus-visible:border-panteon-orange focus-visible:text-panteon-orange focus-visible:outline-none"
      >
        i
      </button>
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-md border border-panteon-border-strong bg-panteon-surface-2 p-3 text-[11px] font-normal normal-case leading-relaxed tracking-normal text-panteon-fg shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        >
          {TOOLTIP_TEXT}
        </span>
      )}
    </span>
  )
}
