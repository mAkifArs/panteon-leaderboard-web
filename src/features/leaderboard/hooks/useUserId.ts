import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'panteon.userId'
const URL_PARAM = 'userId'

function readInitial(): string | null {
  if (typeof window === 'undefined') return null
  const fromUrl = new URL(window.location.href).searchParams.get(URL_PARAM)
  if (fromUrl) return fromUrl
  return window.localStorage.getItem(STORAGE_KEY)
}

export interface UseUserIdResult {
  userId: string | null
  setUserId: (id: string | null) => void
}

export function useUserId(): UseUserIdResult {
  const [userId, setUserIdState] = useState<string | null>(readInitial)

  const setUserId = useCallback((id: string | null) => {
    setUserIdState(id)
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (id) {
      url.searchParams.set(URL_PARAM, id)
      window.localStorage.setItem(STORAGE_KEY, id)
    } else {
      url.searchParams.delete(URL_PARAM)
      window.localStorage.removeItem(STORAGE_KEY)
    }
    window.history.replaceState({}, '', url.toString())
  }, [])

  useEffect(() => {
    const onPopState = (): void => {
      const fromUrl = new URL(window.location.href).searchParams.get(URL_PARAM)
      setUserIdState(fromUrl)
    }
    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('popstate', onPopState)
    }
  }, [])

  return { userId, setUserId }
}
