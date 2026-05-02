import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback: (error: Error, reset: () => void) => ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * App-level render-time exception trap (ADR-017).
 *
 * Catches anything that throws during render of the subtree —
 * a polling reducer kink, a Compiler invariant slip, an
 * unmodeled prop shape — and surfaces it as a fallback instead
 * of a white screen. API-layer errors (4xx/5xx) flow through
 * the `error` prop in `useLeaderboardView` and are not the
 * concern here.
 *
 * `componentDidCatch` is the single hook point for telemetry;
 * route it to Sentry/equivalent when one lands. Keep the
 * component thin — class API exists only because React's
 * boundary hooks-equivalent does not.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  reset = (): void => {
    this.setState({ error: null })
  }

  override render(): ReactNode {
    if (this.state.error !== null) {
      return this.props.fallback(this.state.error, this.reset)
    }
    return this.props.children
  }
}
