/** Canonical Mauritanian phone regex — used by all Edge Functions */
export const MAURITANIAN_PHONE = /^222[234678]\d{7}$/

/**
 * Normalize raw phone input to 11-digit format (222XXXXXXXX).
 * User enters: 49141433
 * System stores and uses: 22249141433
 */
export function normalizePhone(raw: string): string {
  const s = (raw ?? '').trim().replace('+', '')
  
  // If it's already 11 digits starting with 222, return it
  if (/^222\d{8}$/.test(s)) return s
  
  // If it's 8 digits, prepend 222
  if (/^\d{8}$/.test(s)) return `222${s}`
  
  // Fallback: return as is (regex will catch it later)
  return s
}
