import { useEffect, useState } from 'react'
import { apiGet } from '@/shared/api/client'
import { SampleUsersResponseSchema, type SampleUsersResponse } from '@/shared/api/schemas'

interface SampleUsersState {
  data: SampleUsersResponse | undefined
  error: Error | undefined
  isLoading: boolean
}

export function useSampleUsers(n = 3): SampleUsersState {
  const [state, setState] = useState<SampleUsersState>({
    data: undefined,
    error: undefined,
    isLoading: true,
  })

  useEffect(() => {
    const ac = new AbortController()
    apiGet(`/users/sample?n=${n.toString()}`, SampleUsersResponseSchema, ac.signal).then(
      (data) => {
        if (ac.signal.aborted) return
        setState({ data, error: undefined, isLoading: false })
      },
      (err: unknown) => {
        if (ac.signal.aborted) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        setState({
          data: undefined,
          error: err instanceof Error ? err : new Error(String(err)),
          isLoading: false,
        })
      },
    )
    return () => {
      ac.abort()
    }
  }, [n])

  return state
}
