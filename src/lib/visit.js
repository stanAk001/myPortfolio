/*
  The only thing this browser remembers about visits: when it was last here. Stays in the visitor's
  own storage, never sent anywhere. Read once on page load and then updated, so `lastVisit` is the
  previous visit.
*/
const KEY = 'akeem:lastVisit'
const MONTH = 30 * 24 * 3600 * 1000

function read() {
  try {
    const v = Number(localStorage.getItem(KEY))
    localStorage.setItem(KEY, String(Date.now()))
    return Number.isFinite(v) && v > 0 ? v : null
  } catch {
    return null
  }
}

export const lastVisit = read()

// Back within a month counts as a returning visitor.
export const returning = lastVisit != null && Date.now() - lastVisit < MONTH

// Changed since their last visit (uses a project's `updated` date in content.json, e.g. "2026-11-14").
export const isNew = (p) => returning && p.updated && Date.parse(p.updated) > lastVisit
