import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { UserPicker } from './UserPicker'
import type { SampleUsersResponse } from '@/shared/api/schemas'

const mockUseSampleUsers = vi.fn()

vi.mock('@/features/leaderboard/hooks/useSampleUsers', () => ({
  useSampleUsers: (n: number) => mockUseSampleUsers(n) as unknown,
}))

function renderPicker(onSelect = vi.fn()) {
  const utils = render(
    <MemoryRouter>
      <UserPicker onSelect={onSelect} />
    </MemoryRouter>,
  )
  return { ...utils, onSelect }
}

function makeSample(): SampleUsersResponse {
  const users = [
    { rank: 1, userId: 'user_1', username: 'TopPlayer', score: '5000000', country: 'TR' },
    { rank: 50, userId: 'user_50', username: 'MidPlayer', score: '3000', country: 'DE' },
  ]
  return { isoWeek: '2026-W18', count: users.length, users }
}

describe('UserPicker', () => {
  it('renders skeletons while loading', () => {
    mockUseSampleUsers.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    })
    const { container } = renderPicker()
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
  })

  it('surfaces an error message when the fetch fails', () => {
    mockUseSampleUsers.mockReturnValue({
      data: undefined,
      error: new Error('boom'),
      isLoading: false,
    })
    renderPicker()
    expect(screen.getByText(/couldn't load sample players/i)).toBeInTheDocument()
    expect(screen.getByText(/boom/)).toBeInTheDocument()
  })

  it('renders a card per sample user with rank, name, and a continue button', () => {
    mockUseSampleUsers.mockReturnValue({
      data: makeSample(),
      error: undefined,
      isLoading: false,
    })
    renderPicker()
    expect(screen.getByText('TopPlayer')).toBeInTheDocument()
    expect(screen.getByText('MidPlayer')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue as topplayer/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue as midplayer/i })).toBeInTheDocument()
  })

  it('calls onSelect with the userId when a sample card is clicked', () => {
    mockUseSampleUsers.mockReturnValue({
      data: makeSample(),
      error: undefined,
      isLoading: false,
    })
    const { onSelect } = renderPicker()
    fireEvent.click(screen.getByRole('button', { name: /continue as topplayer/i }))
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('user_1')
  })

  it('renders an empty-state message when no sample users come back', () => {
    mockUseSampleUsers.mockReturnValue({
      data: { isoWeek: '2026-W18', count: 0, users: [] },
      error: undefined,
      isLoading: false,
    })
    renderPicker()
    expect(screen.getByText(/no players have earnings this week yet/i)).toBeInTheDocument()
  })

  it('ignores manual entry submissions when the input is blank', () => {
    mockUseSampleUsers.mockReturnValue({
      data: makeSample(),
      error: undefined,
      isLoading: false,
    })
    const { onSelect } = renderPicker()
    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('forwards the trimmed manual entry value to onSelect', async () => {
    mockUseSampleUsers.mockReturnValue({
      data: makeSample(),
      error: undefined,
      isLoading: false,
    })
    const { onSelect } = renderPicker()
    await userEvent.type(screen.getByLabelText(/or enter a player id/i), '   manual_42   ')
    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }))
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('manual_42')
  })
})
