import { describe, expect, it } from 'vitest'
import {
  stabilizeCurrentResponse,
  stabilizeMeta,
  stabilizeOwnRankPayload,
  stabilizeViewEntry,
} from './structural-equal'
import type { CurrentResponse, Meta, OwnRankPayload, ViewEntry } from './schemas'

function makeEntry(overrides: Partial<ViewEntry> = {}): ViewEntry {
  return {
    rank: 1,
    userId: 'user_1',
    username: 'Alice',
    score: '1000',
    country: 'TR',
    ...overrides,
  }
}

function makeMeta(overrides: Partial<Meta> = {}): Meta {
  return {
    isoWeek: '2026-W18',
    weekStart: '2026-04-27T00:00:00.000Z',
    weekEnd: '2026-05-04T00:00:00.000Z',
    pool: '1000',
    ...overrides,
  }
}

function makeResponse(overrides: Partial<CurrentResponse> = {}): CurrentResponse {
  return {
    meta: makeMeta(),
    top: {
      count: 2,
      entries: [makeEntry(), makeEntry({ rank: 2, userId: 'user_2' })],
    },
    me: null,
    ...overrides,
  }
}

describe('stabilizeViewEntry', () => {
  it('returns the previous reference when content is identical', () => {
    const prev = makeEntry()
    const next = makeEntry()
    expect(stabilizeViewEntry(prev, next)).toBe(prev)
  })

  it('returns the new reference when score changes', () => {
    const prev = makeEntry({ score: '1000' })
    const next = makeEntry({ score: '2000' })
    expect(stabilizeViewEntry(prev, next)).toBe(next)
  })

  it('returns the new reference when country changes from undefined to set', () => {
    const prev = makeEntry({ country: undefined })
    const next = makeEntry({ country: 'TR' })
    expect(stabilizeViewEntry(prev, next)).toBe(next)
  })

  it('returns the new reference when previous is undefined', () => {
    const next = makeEntry()
    expect(stabilizeViewEntry(undefined, next)).toBe(next)
  })
})

describe('stabilizeMeta', () => {
  it('returns previous when all fields match', () => {
    const prev = makeMeta()
    const next = makeMeta()
    expect(stabilizeMeta(prev, next)).toBe(prev)
  })

  it('returns new when pool changes', () => {
    const prev = makeMeta({ pool: '1000' })
    const next = makeMeta({ pool: '2000' })
    expect(stabilizeMeta(prev, next)).toBe(next)
  })
})

describe('stabilizeOwnRankPayload', () => {
  const cluster = [makeEntry({ rank: 5, userId: 'user_5' })]

  it('returns previous when content is identical', () => {
    const prev: OwnRankPayload = { rank: 5, totalPlayers: 100, cluster }
    const next: OwnRankPayload = {
      rank: 5,
      totalPlayers: 100,
      cluster: [makeEntry({ rank: 5, userId: 'user_5' })],
    }
    expect(stabilizeOwnRankPayload(prev, next)).toBe(prev)
  })

  it('returns null when next is null', () => {
    const prev: OwnRankPayload = { rank: 5, totalPlayers: 100, cluster }
    expect(stabilizeOwnRankPayload(prev, null)).toBeNull()
  })

  it('returns next when totalPlayers changes', () => {
    const prev: OwnRankPayload = { rank: 5, totalPlayers: 100, cluster }
    const next: OwnRankPayload = {
      rank: 5,
      totalPlayers: 101,
      cluster: [makeEntry({ rank: 5, userId: 'user_5' })],
    }
    const result = stabilizeOwnRankPayload(prev, next)
    expect(result).not.toBe(prev)
    expect(result?.totalPlayers).toBe(101)
    // Cluster reference should still be reused since content matches.
    expect(result?.cluster).toBe(prev.cluster)
  })
})

describe('stabilizeCurrentResponse', () => {
  it('returns the same reference when nothing has changed', () => {
    const prev = makeResponse()
    const next = makeResponse()
    expect(stabilizeCurrentResponse(prev, next)).toBe(prev)
  })

  it('reuses entry references that did not change but yields a new array when one entry changed', () => {
    const prev = makeResponse()
    const next = makeResponse({
      top: {
        count: 2,
        entries: [makeEntry({ score: '9999' }), makeEntry({ rank: 2, userId: 'user_2' })],
      },
    })
    const result = stabilizeCurrentResponse(prev, next)
    expect(result).not.toBe(prev)
    // entry[0] changed → new ref. entry[1] unchanged → previous ref.
    expect(result.top.entries[0]).not.toBe(prev.top.entries[0])
    expect(result.top.entries[1]).toBe(prev.top.entries[1])
  })

  it('keeps meta reference when meta is unchanged but entries changed', () => {
    const prev = makeResponse()
    const next = makeResponse({
      top: {
        count: 2,
        entries: [makeEntry({ score: '9999' }), makeEntry({ rank: 2, userId: 'user_2' })],
      },
    })
    const result = stabilizeCurrentResponse(prev, next)
    expect(result.meta).toBe(prev.meta)
  })

  it('returns the new response when previous is undefined', () => {
    const next = makeResponse()
    expect(stabilizeCurrentResponse(undefined, next)).toBe(next)
  })

  it('handles me transitioning from null to populated', () => {
    const prev = makeResponse({ me: null })
    const me: OwnRankPayload = {
      rank: 42,
      totalPlayers: 100,
      cluster: [makeEntry({ rank: 42, userId: 'me' })],
    }
    const next = makeResponse({ me })
    const result = stabilizeCurrentResponse(prev, next)
    expect(result.me).toBe(me)
  })
})
