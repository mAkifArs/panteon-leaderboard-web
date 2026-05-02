import { describe, expect, it } from 'vitest'
import { flagFromCountry } from './country'

describe('flagFromCountry', () => {
  it('returns the flag glyph for a known ISO code', () => {
    expect(flagFromCountry('TR')).toBe('🇹🇷')
    expect(flagFromCountry('US')).toBe('🇺🇸')
  })

  it('is case-insensitive', () => {
    expect(flagFromCountry('tr')).toBe('🇹🇷')
  })

  it('falls back to the white flag for unknown codes', () => {
    expect(flagFromCountry('ZZ')).toBe('🏳️')
  })

  it('falls back to the white flag for missing input', () => {
    expect(flagFromCountry()).toBe('🏳️')
    expect(flagFromCountry(undefined)).toBe('🏳️')
  })
})
