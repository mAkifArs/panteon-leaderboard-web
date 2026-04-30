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

const BILLION = 1_000_000_000n
const MILLION = 1_000_000n
const THOUSAND = 1_000n

export function formatCompact(score: string): string {
  const big = BigInt(score)
  if (big >= BILLION) return `${(Number(big) / 1e9).toFixed(2)}B`
  if (big >= MILLION) return `${(Number(big) / 1e6).toFixed(2)}M`
  if (big >= THOUSAND) return `${(Number(big) / 1e3).toFixed(1)}K`
  return big.toString()
}
