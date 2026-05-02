import type { z } from 'zod'
import { ApiErrorBodySchema, type ApiErrorCode } from './schemas'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  /**
   * Seconds the server suggested we wait before retrying. Populated
   * for 429 responses from the `Retry-After` header (delta-seconds
   * form per RFC 9110). `usePolling` reads this to space the next
   * tick out instead of hammering the rate limiter again.
   */
  readonly retryAfterSec: number | undefined

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    retryAfterSec?: number,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.retryAfterSec = retryAfterSec
  }
}

function parseRetryAfter(header: string | null): number | undefined {
  if (header === null) return undefined
  // RFC 9110 allows either delta-seconds or HTTP-date. Backend
  // (@fastify/rate-limit) emits delta-seconds. Tolerate the date
  // form as a fallback so we don't break if the proxy rewrites it.
  const asInt = Number.parseInt(header, 10)
  if (Number.isFinite(asInt) && asInt >= 0) return asInt
  const asDate = Date.parse(header)
  if (Number.isFinite(asDate)) {
    return Math.max(0, Math.ceil((asDate - Date.now()) / 1000))
  }
  return undefined
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
    const code: ApiErrorCode = parsed.success ? parsed.data.error.code : 'unknown_error'
    const message = parsed.success ? parsed.data.error.message : `HTTP ${res.status.toString()}`
    const retryAfterSec =
      res.status === 429 ? parseRetryAfter(res.headers.get('Retry-After')) : undefined
    throw new ApiError(res.status, code, message, retryAfterSec)
  }

  return schema.parse(json)
}
