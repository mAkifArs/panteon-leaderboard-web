import type { CSSProperties } from 'react'
import { clsx } from 'clsx'
import { hueFromSeed } from '@/lib/avatar'

export type AvatarRing = 'gold' | 'silver' | 'bronze' | 'self' | 'none'

interface AvatarProps {
  seed: string
  initials: string
  size: number
  ring?: AvatarRing
}

const ringClassName: Record<AvatarRing, string> = {
  gold: 'ring-2 ring-prize-gold ring-offset-2 ring-offset-panteon-bg',
  silver: 'ring-2 ring-prize-silver ring-offset-2 ring-offset-panteon-bg',
  bronze: 'ring-2 ring-prize-bronze ring-offset-2 ring-offset-panteon-bg',
  self: 'ring-2 ring-panteon-orange ring-offset-2 ring-offset-panteon-bg',
  none: '',
}

interface AvatarStyle extends CSSProperties {
  '--avatar-h': number
  width: number
  height: number
  fontSize: number
}

export function Avatar({ seed, initials, size, ring = 'none' }: AvatarProps): React.ReactElement {
  const hue = hueFromSeed(seed)
  const style: AvatarStyle = {
    '--avatar-h': hue,
    width: size,
    height: size,
    fontSize: Math.round(size * 0.34),
  }
  return (
    <span
      aria-hidden="true"
      data-avatar-seed={seed}
      className={clsx(
        'avatar-bg inline-flex shrink-0 items-center justify-center rounded-full font-mono font-semibold tracking-[0.02em] text-white/90',
        ringClassName[ring],
      )}
      style={style}
    >
      {initials}
    </span>
  )
}
