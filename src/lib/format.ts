/**
 * Money/score formatting. Scores arrive from the API as numeric
 * strings (BigInt-safe per backend invariant 1). We never do
 * arithmetic; just locale-aware grouping.
 */

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US')

export function formatScore(score: string): string {
  return NUMBER_FORMATTER.format(BigInt(score))
}

export function formatRank(rank: number): string {
  return `#${NUMBER_FORMATTER.format(rank)}`
}
