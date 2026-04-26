describe('app shell', () => {
  it('renders the leaderboard heading', () => {
    cy.visit('/')
    cy.findByRole('heading', { name: /panteon leaderboard/i }).should('be.visible')
  })
})
