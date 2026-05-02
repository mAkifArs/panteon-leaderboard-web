import { describe, expect, it } from 'vitest'
import { formatCompact, formatRank, formatScore } from './format'

describe('formatScore', () => {
  it('groups thousands with US locale separators', () => {
    expect(formatScore('1234567')).toBe('1,234,567')
  })

  it('handles BigInt-sized values', () => {
    expect(formatScore('18420000000000')).toBe('18,420,000,000,000')
  })

  it('handles zero', () => {
    expect(formatScore('0')).toBe('0')
  })
})

describe('formatRank', () => {
  it('prefixes a hash and groups thousands', () => {
    expect(formatRank(12847)).toBe('#12,847')
    expect(formatRank(1)).toBe('#1')
  })
})

describe('formatCompact', () => {
  it('formats billions with two decimals and B suffix', () => {
    expect(formatCompact('4823000000')).toBe('4.82B')
  })

  it('formats millions with two decimals and M suffix', () => {
    expect(formatCompact('12800000')).toBe('12.80M')
  })

  it('formats thousands with one decimal and K suffix', () => {
    expect(formatCompact('1200')).toBe('1.2K')
  })

  it('returns the raw integer below 1K', () => {
    expect(formatCompact('500')).toBe('500')
    expect(formatCompact('0')).toBe('0')
  })
})
