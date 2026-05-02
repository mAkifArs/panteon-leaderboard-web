/**
 * ISO 3166-1 alpha-2 → flag emoji mapping. Backend returns the
 * country code; the UI renders the flag glyph beside it.
 */

const COUNTRY_FLAGS: Record<string, string> = {
  TR: '🇹🇷',
  US: '🇺🇸',
  DE: '🇩🇪',
  BR: '🇧🇷',
  JP: '🇯🇵',
  GB: '🇬🇧',
  FR: '🇫🇷',
  KR: '🇰🇷',
  ES: '🇪🇸',
  MX: '🇲🇽',
  IN: '🇮🇳',
  PL: '🇵🇱',
  IT: '🇮🇹',
  NL: '🇳🇱',
}

const FALLBACK_FLAG = '🏳️'

export function flagFromCountry(code?: string): string {
  if (!code) return FALLBACK_FLAG
  return COUNTRY_FLAGS[code.toUpperCase()] ?? FALLBACK_FLAG
}
