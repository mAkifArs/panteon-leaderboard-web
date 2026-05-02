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

const TOTAL_PLAYERS = 100_000
const LAST_RANK = TOTAL_PLAYERS

function makeEntry(rank: number, overrides: Partial<Entry> = {}): Entry {
  // Score must be a positive digit string per the API's BigInt contract;
  // monotonically decreasing with rank so the order is believable.
  const score = String(Math.max(1000, 10_000_000_000 - rank * 1_000))
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

// Slides the 6-row window when the player is near the very top
// (rank 1..3) or very bottom (rank totalPlayers-1..totalPlayers) of
// the ladder, so cluster.length is always 6 — matching CLAUDE.md
// invariant 2.
function clusterAround(rank: number): Entry[] {
  const idealStart = rank - 3
  const maxStart = TOTAL_PLAYERS - 5
  const start = Math.max(1, Math.min(idealStart, maxStart))
  return Array.from({ length: 6 }, (_, i) => makeEntry(start + i))
}

function currentBody(rank: number, opts: { poolOverride?: string } = {}) {
  return {
    meta: { ...META, pool: opts.poolOverride ?? META.pool },
    top: { count: 100, entries: topEntries() },
    me: {
      rank,
      totalPlayers: TOTAL_PLAYERS,
      cluster: clusterAround(rank),
    },
  }
}

const SAMPLE_USERS = {
  isoWeek: META.isoWeek,
  count: 5,
  // Edge tiers the player picker exposes for review: top of podium,
  // last podium slot, mid pack, last in top 100, and the very bottom
  // of the ladder. Each one drives a distinct render path.
  users: [
    makeEntry(1, { username: 'TopAce' }),
    makeEntry(3, { username: 'PodiumLast' }),
    makeEntry(50, { username: 'MidTier' }),
    makeEntry(100, { username: 'BorderLast' }),
    makeEntry(LAST_RANK, { username: 'TailEnd' }),
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
    cy.findAllByRole('button', { name: /continue as/i }).should('have.length', 5)

    cy.findByRole('button', { name: /continue as topace/i }).click()
    cy.wait('@current-user_001').its('response.body.me.rank').should('eq', 1)

    cy.findByRole('heading', { name: /weekly/i }).should('be.visible')
    cy.contains(/signed in as/i).should('contain.text', 'user_001')
  })

  it('top-3 player (rank 1): podium present, gold glow on self card, sticky bar absent', () => {
    stubSample()
    stubCurrent(1)
    visitAsSeeded('user_001')
    cy.wait('@current-user_001').its('response.body.me.rank').should('eq', 1)

    cy.findByRole('region', { name: /top 3 podium/i }).should('be.visible')
    cy.findAllByLabelText(/First place: Player_001 \(you\)/).each((card) => {
      cy.wrap(card).should('have.class', 'lb-medal-glow-gold')
    })
    cy.contains(/around you/i).should('not.exist')
    cy.findByTestId('sticky-self-bar').should('not.exist')
  })

  it('podium boundary (rank 3): in podium, bronze glow on self card, sticky bar still hidden', () => {
    stubSample()
    stubCurrent(3)
    visitAsSeeded('user_003')
    cy.wait('@current-user_003').its('response.body.me.rank').should('eq', 3)

    cy.findByRole('region', { name: /top 3 podium/i }).should('be.visible')
    cy.findAllByLabelText(/Third place: Player_003 \(you\)/).each((card) => {
      cy.wrap(card).should('have.class', 'lb-medal-glow-bronze')
    })
    cy.findByTestId('sticky-self-bar').should('not.exist')
    cy.contains(/around you/i).should('not.exist')
  })

  it('list start (rank 4): no podium card carries a medal glow, sticky bar visible, no cluster', () => {
    stubSample()
    stubCurrent(4)
    visitAsSeeded('user_004')
    cy.wait('@current-user_004').its('response.body.me.rank').should('eq', 4)

    cy.findByRole('row', { name: /^Rank 4:.*\(you\)$/ }).should('exist')
    cy.findByRole('region', { name: /top 3 podium/i })
      .find('article')
      .each((card) => {
        cy.wrap(card)
          .should('not.have.class', 'lb-medal-glow-gold')
          .and('not.have.class', 'lb-medal-glow-silver')
          .and('not.have.class', 'lb-medal-glow-bronze')
      })
    cy.findByTestId('sticky-self-bar').should('be.visible')
    cy.contains(/around you/i).should('not.exist')
  })

  it('top-100 boundary (rank 100): last in list, sticky bar visible, no cluster', () => {
    stubSample()
    stubCurrent(100)
    visitAsSeeded('user_100')
    cy.wait('@current-user_100').its('response.body.me.rank').should('eq', 100)

    cy.findByRole('row', { name: /^Rank 100:.*\(you\)$/ }).should('exist')
    cy.findByTestId('sticky-self-bar').should('be.visible')
    cy.contains(/around you/i).should('not.exist')
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

  it('outside top-100 player: cluster auto-mounts at the bottom with 6 rows centered on self', () => {
    stubSample()
    stubCurrent(250)
    visitAsSeeded('user_250')
    cy.wait('@current-user_250').its('response.body.me.rank').should('eq', 250)

    cy.findByRole('region', { name: /around your rank #250/i })
      .should('be.visible')
      .within(() => {
        cy.findAllByRole('row').should('have.length', 6)
        cy.findByRole('row', { name: /^Rank 247:/ }).should('exist')
        cy.findByRole('row', { name: /^Rank 250:.*\(you\)$/ }).should('exist')
        cy.findByRole('row', { name: /^Rank 252:/ }).should('exist')
      })

    cy.findByTestId('sticky-self-bar').should('be.visible')
  })

  it('last player (rank totalPlayers): cluster slides up, self is last row of 6', () => {
    stubSample()
    stubCurrent(LAST_RANK)
    const userId = `user_${LAST_RANK.toString()}`
    visitAsSeeded(userId)
    cy.wait(`@current-${userId}`).its('response.body.me.rank').should('eq', LAST_RANK)

    cy.findByRole('region', {
      name: new RegExp(`around your rank #${LAST_RANK.toString()}`, 'i'),
    })
      .should('be.visible')
      .within(() => {
        cy.findAllByRole('row').should('have.length', 6)
        // Window slides up: top is rank-5, no rows below self.
        cy.findByRole('row', { name: new RegExp(`^Rank ${(LAST_RANK - 5).toString()}:`) }).should(
          'exist',
        )
        cy.findByRole('row', {
          name: new RegExp(`^Rank ${LAST_RANK.toString()}:.*\\(you\\)$`),
        }).should('exist')
      })

    cy.findByTestId('sticky-self-bar').should('be.visible')
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

  it('renders the self row score via Intl.NumberFormat (invariant 1, no client math)', () => {
    stubSample()
    stubCurrent(50)
    visitAsSeeded('user_050')
    cy.wait('@current-user_050')

    // Score "9999950000" arrives as a string from the API and is
    // grouped by `formatScore` (Intl.NumberFormat 'en-US'). The
    // a11y-label embeds the same formatted output, so asserting on
    // the row's accessible name covers both render paths.
    cy.findByRole('row', {
      name: /^Rank 50: Player_050, score 9,999,950,000 \(you\)$/,
    }).should('exist')
  })

  it('pauses polling while the tab is hidden and refetches on return (ADR-003)', () => {
    let count = 0
    cy.intercept({ method: 'GET', url: /\/users\/sample(\?|$)/ }, { body: SAMPLE_USERS })
    cy.intercept({ method: 'GET', url: /\/leaderboard\/current\/user_050(\?|$)/ }, (req) => {
      count++
      req.reply({ body: currentBody(50) })
    }).as('current')

    cy.clock(Date.now(), ['setTimeout', 'clearTimeout', 'Date'])
    visitAsSeeded('user_050')

    cy.wait('@current')
    cy.then(() => {
      expect(count).to.eq(1)
    })

    // Hidden: scheduled ticks fire but `runTick` early-returns.
    cy.document().then((doc) => {
      Object.defineProperty(doc, 'visibilityState', { configurable: true, get: () => 'hidden' })
      doc.dispatchEvent(new Event('visibilitychange'))
    })
    cy.tick(15_000)
    cy.then(() => {
      expect(count, 'no fetches while hidden').to.eq(1)
    })

    // Visible: the visibilitychange listener fires an immediate refetch.
    cy.document().then((doc) => {
      Object.defineProperty(doc, 'visibilityState', { configurable: true, get: () => 'visible' })
      doc.dispatchEvent(new Event('visibilitychange'))
    })
    cy.wait('@current')
    cy.then(() => {
      expect(count, 'immediate refetch on visible').to.be.gte(2)
    })
  })

  it('a11y: picker cards are real <button> elements that take focus', () => {
    stubSample()
    stubCurrent(1)
    cy.visit('/leaderboard')
    cy.wait('@sample')

    // Invariant 5: every interactive element is a real button or link.
    // Tag + type guard catches any future `<div onClick>` regression.
    cy.findByRole('button', { name: /continue as topace/i })
      .should(($btn) => {
        expect($btn.prop('tagName')).to.eq('BUTTON')
        expect($btn.prop('type')).to.eq('button')
      })
      .focus()
      .should('have.focus')

    // The same handler Enter/Space invokes when the button is focused.
    // Pure keyboard activation needs cypress-real-events, which we
    // don't ship; clicking the focused element exercises the same path.
    cy.focused().click()

    cy.wait('@current-user_001').its('response.body.me.rank').should('eq', 1)
    cy.findByRole('heading', { name: /weekly/i }).should('be.visible')
  })

  it('home route renders without picker; unknown route shows the 404 page', () => {
    cy.visit('/')
    cy.findByRole('heading', { name: /^weekly leaderboard$/i }).should('be.visible')
    cy.findByRole('heading', { name: /pick a player/i }).should('not.exist')
    cy.findByRole('link', { name: /view live demo/i }).should(
      'have.attr',
      'href',
      '/leaderboard',
    )

    cy.visit('/some-route-that-does-not-exist', { failOnStatusCode: false })
    cy.findByRole('heading', { name: /page not found/i }).should('be.visible')
  })

  it('offline indicator: hidden while online, mounts on offline event, dismisses popover on reconnect', () => {
    stubSample()
    stubCurrent(50)
    visitAsSeeded('user_050')
    cy.wait('@current-user_050')

    // Online by default — no indicator in the DOM.
    cy.findByRole('button', { name: /you are offline/i }).should('not.exist')

    // Flip navigator.onLine + dispatch the event the indicator listens to.
    cy.window().then((win) => {
      Object.defineProperty(win.navigator, 'onLine', { configurable: true, get: () => false })
      win.dispatchEvent(new Event('offline'))
    })
    cy.findByRole('button', { name: /you are offline/i }).should('be.visible').click()
    cy.findByRole('alert').should('contain.text', 'You are offline')

    // Coming back online unmounts the indicator and the popover with it.
    cy.window().then((win) => {
      Object.defineProperty(win.navigator, 'onLine', { configurable: true, get: () => true })
      win.dispatchEvent(new Event('online'))
    })
    cy.findByRole('button', { name: /you are offline/i }).should('not.exist')
    cy.findByRole('alert').should('not.exist')
  })

  it('error boundary: ?force_error=throw triggers the App-level fallback (sentinel)', () => {
    cy.visit('/leaderboard?force_error=throw', { failOnStatusCode: false })
    // AppErrorFallback claims the route region; chrome (header/footer)
    // stays mounted because the boundary wraps only <Routes>.
    cy.findByRole('heading', { name: /something went wrong/i }).should('be.visible')
    cy.findByRole('button', { name: /try again/i }).should('be.visible')
  })
})
