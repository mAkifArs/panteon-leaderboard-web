import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StickySelfBar } from './StickySelfBar'
import type { OwnRankPayload } from '@/shared/api/schemas'

function makeMe(): OwnRankPayload {
  return {
    rank: 12847,
    totalPlayers: 2_184_392,
    cluster: [
      {
        rank: 12847,
        userId: 'user_self',
        username: 'You',
        score: '48000',
        country: 'TR',
      },
    ],
  }
}

function makeTargetEl(rect: { top: number; bottom: number }): HTMLElement {
  const el = document.createElement('div')
  el.getBoundingClientRect = () => ({
    top: rect.top,
    bottom: rect.bottom,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })
  return el
}

describe('StickySelfBar', () => {
  it('renders the rank, username, and call to action', () => {
    const target = makeTargetEl({ top: 9999, bottom: 9999 })
    render(<StickySelfBar me={makeMe()} userId="user_self" targetEl={target} onJump={() => {}} />)
    expect(screen.getByTestId('sticky-self-bar')).toHaveAttribute('data-visible', 'true')
    expect(screen.getByRole('button', { name: /jump to your rank/i })).toBeInTheDocument()
  })

  it('returns null when the user is not present in the cluster', () => {
    const target = makeTargetEl({ top: 9999, bottom: 9999 })
    const { container } = render(
      <StickySelfBar me={makeMe()} userId="other_user" targetEl={target} onJump={() => {}} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('hides itself when the target intersects the viewport', () => {
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    // Target sits near the bottom of the viewport (top 700, bottom 760).
    // Any intersection counts: bar should hide.
    const target = makeTargetEl({ top: 700, bottom: 760 })
    render(<StickySelfBar me={makeMe()} userId="user_self" targetEl={target} onJump={() => {}} />)
    expect(screen.getByTestId('sticky-self-bar')).toHaveAttribute('data-visible', 'false')
  })

  it('points up when the target sits above the viewport', () => {
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    // Target has scrolled past the top — both edges are negative.
    const target = makeTargetEl({ top: -200, bottom: -100 })
    render(<StickySelfBar me={makeMe()} userId="user_self" targetEl={target} onJump={() => {}} />)
    const bar = screen.getByTestId('sticky-self-bar')
    expect(bar).toHaveAttribute('data-visible', 'true')
    expect(bar).toHaveAttribute('data-direction', 'up')
    expect(screen.getByRole('button', { name: /jump to your rank/i })).toHaveTextContent(/↑/)
  })

  it('points down when the target sits below the viewport', () => {
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    // Target hasn't scrolled into view yet — both edges past the bottom.
    const target = makeTargetEl({ top: 1200, bottom: 1300 })
    render(<StickySelfBar me={makeMe()} userId="user_self" targetEl={target} onJump={() => {}} />)
    const bar = screen.getByTestId('sticky-self-bar')
    expect(bar).toHaveAttribute('data-visible', 'true')
    expect(bar).toHaveAttribute('data-direction', 'down')
    expect(screen.getByRole('button', { name: /jump to your rank/i })).toHaveTextContent(/↓/)
  })

  it('shows itself when the target has no element yet', () => {
    render(<StickySelfBar me={makeMe()} userId="user_self" targetEl={null} onJump={() => {}} />)
    expect(screen.getByTestId('sticky-self-bar')).toHaveAttribute('data-visible', 'true')
  })

  it('calls onJump when the Jump button is clicked', async () => {
    const target = makeTargetEl({ top: 9999, bottom: 9999 })
    const onJump = vi.fn()
    render(<StickySelfBar me={makeMe()} userId="user_self" targetEl={target} onJump={onJump} />)
    await userEvent.click(screen.getByRole('button', { name: /jump to your rank/i }))
    expect(onJump).toHaveBeenCalledOnce()
  })
})
