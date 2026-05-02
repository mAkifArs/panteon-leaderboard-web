import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar } from './Avatar'
import { hueFromSeed } from '@/shared/lib/avatar'

describe('Avatar', () => {
  it('sets the --avatar-h CSS variable from the seed deterministically', () => {
    const { container } = render(<Avatar seed="user_42" initials="SE" size={36} />)
    const span = container.querySelector('[data-avatar-seed="user_42"]') as HTMLElement
    expect(span).not.toBeNull()
    expect(span.style.getPropertyValue('--avatar-h')).toBe(String(hueFromSeed('user_42')))
  })

  it('applies the medal ring class when ring="gold"', () => {
    render(<Avatar seed="x" initials="AA" size={36} ring="gold" />)
    const span = screen.getByText('AA')
    expect(span.className).toMatch(/ring-prize-gold/)
  })

  it('renders no ring when ring="none"', () => {
    render(<Avatar seed="x" initials="AA" size={36} />)
    const span = screen.getByText('AA')
    expect(span.className).not.toMatch(/ring-/)
  })
})
