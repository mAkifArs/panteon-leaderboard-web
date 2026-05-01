/// <reference types="cypress" />

interface Entry {
  rank: number
  userId: string
  username: string
  score: string
  country?: string
}

const META = {
  isoWeek: '2026-W18',
  weekStart: '2026-04-27T00:00:00.000Z',
  weekEnd: '2026-05-04T00:00:00.000Z',
  pool: '12345678900',
}

const COUNTRIES = ['US', 'TR', 'DE', 'BR', 'JP', 'GB', 'FR', 'KR', 'ES', 'NL']

function makeEntry(rank: number, overrides: Partial<Entry> = {}): Entry {
  const score = String(1_000_000_000 - rank * 1_000_000)
  return {
    rank,
    userId: `user_${rank.toString().padStart(3, '0')}`,
    username: `Player_${rank.toString().padStart(3, '0')}`,
    score,
    country: COUNTRIES[rank % COUNTRIES.length],
    ...overrides,
  }
}

function topEntries(count = 100): Entry[] {
  return Array.from({ length: count }, (_, i) => makeEntry(i + 1))
}

function clusterAround(rank: number): Entry[] {
  const start = Math.max(1, rank - 3)
  return Array.from({ length: 6 }, (_, i) => makeEntry(start + i))
}

function currentBody(rank: number, opts: { poolOverride?: string } = {}) {
  return {
    meta: { ...META, pool: opts.poolOverride ?? META.pool },
    top: { count: 100, entries: topEntries() },
    me: {
      rank,
      totalPlayers: 100_000,
      cluster: clusterAround(rank),
    },
  }
}

const SAMPLE_USERS = {
  isoWeek: META.isoWeek,
  count: 3,
  users: [
    makeEntry(1, { username: 'TopAce' }),
    makeEntry(50, { username: 'MidTier' }),
    makeEntry(250, { username: 'TailEnd' }),
  ],
}

function stubSample() {
  cy.intercept({ method: 'GET', url: /\/users\/sample(\?|$)/ }, { body: SAMPLE_USERS }).as('sample')
}

function stubCurrent(rank: number, body = currentBody(rank)) {
  const userId = `user_${rank.toString().padStart(3, '0')}`
  cy.intercept(
    { method: 'GET', url: new RegExp(`/leaderboard/current/${userId}(\\?|$)`) },
    { body },
  ).as(`current-${userId}`)
}

function visitAsSeeded(userId: string, route = '/leaderboard') {
  return cy.visit(route, {
    onBeforeLoad(win) {
      win.localStorage.clear()
      win.localStorage.setItem('panteon.userId', userId)
    },
  })
}

describe('Leaderboard E2E', () => {
  beforeEach(() => {
    cy.clearAllLocalStorage()
    cy.clearAllCookies()
    cy.clearAllSessionStorage()
  })

  it('picker → sample selection lands on the leaderboard', () => {
    stubSample()
    stubCurrent(1)
    cy.visit('/leaderboard')
    cy.wait('@sample')

    cy.findByRole('heading', { name: /pick a player/i }).should('be.visible')
    cy.findAllByRole('button', { name: /continue as/i }).should('have.length', 3)

    cy.findByRole('button', { name: /continue as topace/i }).click()
    cy.wait('@current-user_001').its('response.body.me.rank').should('eq', 1)

    cy.findByRole('heading', { name: /weekly/i }).should('be.visible')
    cy.contains(/signed in as/i).should('contain.text', 'user_001')
  })

  it('top-3 player: podium present, sticky bar absent', () => {
    stubSample()
    stubCurrent(1)
    visitAsSeeded('user_001')
    cy.wait('@current-user_001').its('response.body.me.rank').should('eq', 1)

    cy.findByRole('region', { name: /top 3 podium/i }).should('be.visible')
    cy.contains(/around you/i).should('not.exist')
    cy.findByTestId('sticky-self-bar').should('not.exist')
  })

  it('mid-tier player: sticky bar tracks self, jump scrolls and fades', () => {
    stubSample()
    stubCurrent(50)
    visitAsSeeded('user_050')
    cy.wait('@current-user_050').its('response.body.me.rank').should('eq', 50)

    cy.findByTestId('sticky-self-bar')
      .should('be.visible')
      .and('have.attr', 'data-visible', 'true')

    // Self row is mounted from the start (full top-100 rendered per ADR-015).
    cy.findByRole('row', { name: /^Rank 50:.*\(you\)$/ }).should('exist')

    cy.findByRole('button', { name: /jump to your rank/i }).click()

    // After click, the row scrolls into view; the bar's scroll
    // listener sees the intersection and fades the bar out.
    cy.findByTestId('sticky-self-bar').should('have.attr', 'data-visible', 'false')
  })

  it('outside top-100 player: cluster mounts on Jump click and shows 6 rows centered on self', () => {
    stubSample()
    stubCurrent(250)
    visitAsSeeded('user_250')
    cy.wait('@current-user_250').its('response.body.me.rank').should('eq', 250)

    // Cluster is gated behind the Jump button to avoid a confusing
    // "data dropped here" effect under a still-paginated top 100.
    cy.findByRole('region', { name: /around your rank #250/i }).should('not.exist')
    cy.findByTestId('sticky-self-bar').should('be.visible')

    cy.findByRole('button', { name: /jump to your rank/i }).click()

    cy.findByRole('region', { name: /around your rank #250/i })
      .should('be.visible')
      .within(() => {
        cy.findAllByRole('row').should('have.length', 6)
        cy.findByRole('row', { name: /^Rank 247:/ }).should('exist')
        cy.findByRole('row', { name: /^Rank 250:.*\(you\)$/ }).should('exist')
        cy.findByRole('row', { name: /^Rank 252:/ }).should('exist')
      })
  })

  it('polls every 5 seconds and reflects refreshed prize pool', () => {
    let tick = 0
    cy.intercept({ method: 'GET', url: /\/users\/sample(\?|$)/ }, { body: SAMPLE_USERS })
    cy.intercept({ method: 'GET', url: /\/leaderboard\/current\/user_050(\?|$)/ }, (req) => {
      tick++
      req.reply({
        body: currentBody(50, { poolOverride: tick === 1 ? '10000000000' : '20000000000' }),
      })
    }).as('current')

    cy.clock(Date.now(), ['setTimeout', 'clearTimeout', 'Date'])
    visitAsSeeded('user_050')

    cy.wait('@current')
    cy.contains('10.00B').should('exist')

    cy.tick(5_500)
    cy.wait('@current')
    cy.contains('20.00B').should('exist')

    cy.then(() => {
      expect(tick).to.be.gte(2)
    })
  })

  it('deep link via ?userId bypasses the picker; switch player returns to it', () => {
    stubSample()
    stubCurrent(50)
    cy.visit('/leaderboard?userId=user_050', {
      onBeforeLoad(win) {
        win.localStorage.clear()
      },
    })
    cy.wait('@current-user_050').its('response.body.me.rank').should('eq', 50)

    cy.findByRole('heading', { name: /pick a player/i }).should('not.exist')
    cy.findByRole('heading', { name: /weekly/i }).should('be.visible')

    cy.findByRole('button', { name: /switch player/i }).click()
    cy.findByRole('heading', { name: /pick a player/i }).should('be.visible')
    cy.location('search').should('not.contain', 'userId')
  })
})
