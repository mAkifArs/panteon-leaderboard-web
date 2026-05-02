import { describe, expect, it } from 'vitest'
import { getInitials, hueFromSeed } from './avatar'

describe('hueFromSeed', () => {
  it('is deterministic for the same seed', () => {
    expect(hueFromSeed('user_42')).toBe(hueFromSeed('user_42'))
  })

  it('produces different hues for different seeds', () => {
    expect(hueFromSeed('user_1')).not.toBe(hueFromSeed('user_2'))
  })

  it('always returns a value in [0, 360)', () => {
    for (const seed of ['', 'a', 'user_self', 'a-very-long-user-id-12345']) {
      const h = hueFromSeed(seed)
      expect(h).toBeGreaterThanOrEqual(0)
      expect(h).toBeLessThan(360)
    }
  })
})

describe('getInitials', () => {
  it('uppercases the first two letters of the username', () => {
    expect(getInitials('Selin')).toBe('SE')
  })

  it('strips digits and underscores before slicing', () => {
    expect(getInitials('Selin_99')).toBe('SE')
    expect(getInitials('Mert_pro')).toBe('ME')
  })

  it('falls back to the raw value when stripping leaves nothing', () => {
    expect(getInitials('99_42')).toBe('99')
  })

  it('returns ? for empty input', () => {
    expect(getInitials('')).toBe('?')
  })
})
