import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

function Throwing({ msg }: { msg: string }): React.ReactElement {
  throw new Error(msg)
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // The boundary calls console.error in componentDidCatch, and
    // React itself logs the caught error in dev. Suppress both so
    // the test output stays clean.
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary fallback={() => <p>fallback</p>}>
        <span>safe</span>
      </ErrorBoundary>,
    )
    expect(screen.getByText('safe')).toBeInTheDocument()
    expect(screen.queryByText('fallback')).not.toBeInTheDocument()
  })

  it('renders the fallback with the thrown error when a child throws', () => {
    render(
      <ErrorBoundary fallback={(err) => <p>caught: {err.message}</p>}>
        <Throwing msg="boom" />
      </ErrorBoundary>,
    )
    expect(screen.getByText('caught: boom')).toBeInTheDocument()
  })

  it('reset() restores rendering when the throwing child is replaced', () => {
    function Harness(): React.ReactElement {
      const [shouldThrow, setShouldThrow] = useState(true)
      return (
        <ErrorBoundary
          fallback={(err, reset) => (
            <button
              type="button"
              onClick={() => {
                setShouldThrow(false)
                reset()
              }}
            >
              retry: {err.message}
            </button>
          )}
        >
          {shouldThrow ? <Throwing msg="x" /> : <p>recovered</p>}
        </ErrorBoundary>
      )
    }

    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /retry: x/ }))
    expect(screen.getByText('recovered')).toBeInTheDocument()
  })
})
