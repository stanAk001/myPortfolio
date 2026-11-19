export const pad = (n) => String(n).padStart(2, '0')

export const cx = (...names) => names.filter(Boolean).join(' ')

export function hash(str) {
  let h = 2166136261
  for (const ch of str) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Seeded randomness so decorative charts and barcodes look the same on every visit.
export function seeded(seed) {
  let a = typeof seed === 'string' ? hash(seed) : seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const themeVars = (project) => ({
  '--p-accent': project.theme?.accent ?? 'var(--signal)',
  '--p-bg': project.theme?.bg ?? 'var(--ink)',
})

export const hostOf = (url) => {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return null
  }
}

export function storage(key, value) {
  try {
    if (value === undefined) return sessionStorage.getItem(key)
    sessionStorage.setItem(key, value)
  } catch {
    return null
  }
}
