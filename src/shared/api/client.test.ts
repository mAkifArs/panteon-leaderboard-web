import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { ApiError, apiGet } from './client'

const SimpleSchema = z.object({ ok: z.literal(true), value: z.number() })

function mockFetchOnce(init: {
  status?: number
  body: unknown
  headers?: Record<string, string>
}): void {
  const { status = 200, body, headers = {} } = init
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', ...headers },
    }),
  )
}

describe('apiGet', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the schema-parsed body on 200', async () => {
    mockFetchOnce({ body: { ok: true, value: 42 } })
    const result = await apiGet('/x', SimpleSchema)
    expect(result).toEqual({ ok: true, value: 42 })
  })

  it('throws ApiError with the structured body on a 4xx', async () => {
    mockFetchOnce({
      status: 404,
      body: { error: { code: 'not_found', message: 'No such user' } },
    })
    await expect(apiGet('/x', SimpleSchema)).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      code: 'not_found',
      message: 'No such user',
      retryAfterSec: undefined,
    })
  })

  it('falls back to "unknown_error" + "HTTP {status}" when the error body is not parseable', async () => {
    mockFetchOnce({ status: 500, body: 'not-an-object' })
    const err = await apiGet('/x', SimpleSchema).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({
      status: 500,
      code: 'unknown_error',
      message: 'HTTP 500',
    })
  })

  it('parses a delta-seconds Retry-After header on 429', async () => {
    mockFetchOnce({
      status: 429,
      body: { error: { code: 'rate_limited', message: 'Too many requests' } },
      headers: { 'Retry-After': '30' },
    })
    const err = await apiGet('/x', SimpleSchema).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({
      status: 429,
      code: 'rate_limited',
      retryAfterSec: 30,
    })
  })

  it('treats 0-second Retry-After as 0, not undefined', async () => {
    mockFetchOnce({
      status: 429,
      body: { error: { code: 'rate_limited', message: 'slow down' } },
      headers: { 'Retry-After': '0' },
    })
    const err = await apiGet('/x', SimpleSchema).catch((e: unknown) => e)
    expect(err).toMatchObject({ retryAfterSec: 0 })
  })

  it('leaves retryAfterSec undefined when 429 ships no Retry-After header', async () => {
    mockFetchOnce({
      status: 429,
      body: { error: { code: 'rate_limited', message: 'Too many' } },
    })
    const err = await apiGet('/x', SimpleSchema).catch((e: unknown) => e)
    expect(err).toMatchObject({ status: 429, retryAfterSec: undefined })
  })

  it('does not parse Retry-After on non-429 statuses (e.g. 503)', async () => {
    // The header exists in the spec for 503 too, but rate-limit
    // back-off semantics are ours and tied to 429 specifically.
    mockFetchOnce({
      status: 503,
      body: { error: { code: 'internal_error', message: 'down' } },
      headers: { 'Retry-After': '60' },
    })
    const err = await apiGet('/x', SimpleSchema).catch((e: unknown) => e)
    expect(err).toMatchObject({ status: 503, retryAfterSec: undefined })
  })
})
