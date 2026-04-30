/**
 * ISO-week boundary helpers. ISO 8601 weeks start on Monday and
 * reset at 00:00 UTC. Backend uses the same convention.
 */

export function nextResetAt(now: Date = new Date()): Date {
  const utcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const day = utcMidnight.getUTCDay()
  const daysUntilNextMonday = day === 1 ? 7 : day === 0 ? 1 : 8 - day
  utcMidnight.setUTCDate(utcMidnight.getUTCDate() + daysUntilNextMonday)
  return utcMidnight
}

const ISO_WEEK_PATTERN = /^\d{4}-W(\d{2})$/

export function weekNumberFromIsoWeek(iso: string): number {
  const match = ISO_WEEK_PATTERN.exec(iso)
  if (!match) {
    throw new Error(`Invalid ISO week: ${iso}`)
  }
  return Number(match[1])
}
