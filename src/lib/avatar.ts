/**
 * Procedural avatar helpers. We don't have a real avatar pipeline,
 * so each user gets a deterministic gradient derived from their
 * userId plus the first two characters of their username as
 * initials. See ADR-009.
 */

export function hueFromSeed(seed: string): number {
  let hash = 5381
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33 + seed.charCodeAt(i)) >>> 0
  }
  return hash % 360
}

export function getInitials(username: string): string {
  if (!username) return '?'
  const stripped = username.replace(/[_\d]/g, '')
  const source = stripped.length > 0 ? stripped : username
  return source.slice(0, 2).toUpperCase()
}
