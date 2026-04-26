import type { z } from 'zod'
import { ApiErrorBodySchema } from './schemas'

const BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export async function apiGet<T>(
  path: string,
  schema: z.ZodSchema<T>,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    ...(signal ? { signal } : {}),
  })

  const json: unknown = await res.json().catch(() => ({}))

  if (!res.ok) {
    const parsed = ApiErrorBodySchema.safeParse(json)
    const code = parsed.success ? parsed.data.error.code : 'unknown_error'
    const message = parsed.success ? parsed.data.error.message : `HTTP ${res.status.toString()}`
    throw new ApiError(res.status, code, message)
  }

  return schema.parse(json)
}
