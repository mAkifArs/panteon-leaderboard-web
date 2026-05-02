import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { SkeletonRow } from './Skeleton'

describe('SkeletonRow', () => {
  it('renders exactly `count` <li> placeholders', () => {
    const { container } = render(
      <ol>
        <SkeletonRow count={6} />
      </ol>,
    )
    expect(container.querySelectorAll('li')).toHaveLength(6)
  })

  it('applies the base animation + border classes by default', () => {
    const { container } = render(
      <ol>
        <SkeletonRow count={1} />
      </ol>,
    )
    const li = container.querySelector('li')
    expect(li?.className).toMatch(/animate-pulse-soft/)
    expect(li?.className).toMatch(/border-panteon-border/)
    expect(li?.className).toMatch(/h-12/)
  })

  it('appends a caller-supplied className without dropping the base classes', () => {
    const { container } = render(
      <ol>
        <SkeletonRow count={1} className="h-20" />
      </ol>,
    )
    const li = container.querySelector('li')
    expect(li?.className).toMatch(/animate-pulse-soft/)
    expect(li?.className).toMatch(/h-20/)
  })
})
