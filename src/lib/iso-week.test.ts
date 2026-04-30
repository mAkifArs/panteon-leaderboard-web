import { describe, expect, it } from 'vitest'
import { nextResetAt, weekNumberFromIsoWeek } from './iso-week'

describe('nextResetAt', () => {
  it('returns the next Monday at 00:00 UTC for a midweek date', () => {
    const wednesday = new Date('2026-04-29T12:00:00Z')
    const next = nextResetAt(wednesday)
    expect(next.toISOString()).toBe('2026-05-04T00:00:00.000Z')
  })

  it('returns the following Monday when called on a Monday', () => {
    const monday = new Date('2026-04-27T00:00:00Z')
    const next = nextResetAt(monday)
    expect(next.toISOString()).toBe('2026-05-04T00:00:00.000Z')
  })

  it('returns the next Monday when called on a Sunday', () => {
    const sunday = new Date('2026-05-03T18:00:00Z')
    const next = nextResetAt(sunday)
    expect(next.toISOString()).toBe('2026-05-04T00:00:00.000Z')
  })
})

describe('weekNumberFromIsoWeek', () => {
  it('parses two-digit week numbers', () => {
    expect(weekNumberFromIsoWeek('2026-W18')).toBe(18)
    expect(weekNumberFromIsoWeek('2024-W01')).toBe(1)
    expect(weekNumberFromIsoWeek('2024-W53')).toBe(53)
  })

  it('throws on malformed input', () => {
    expect(() => weekNumberFromIsoWeek('2026-W1')).toThrow()
    expect(() => weekNumberFromIsoWeek('2026/W18')).toThrow()
    expect(() => weekNumberFromIsoWeek('foo')).toThrow()
  })
})
