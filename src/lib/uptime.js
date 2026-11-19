import { useEffect, useSyncExternalStore } from 'react'
import { liveProjects } from '../data/projects'

/*
  One shared uptime checker for the whole page. While anything that needs it is on screen, it pings
  each deployed project from the visitor's browser every few seconds and keeps a short history.
  `no-cors` gives an opaque response, which is enough to know the site answered and how fast,
  without the sites needing CORS headers.
*/
const HISTORY = 30
const INTERVAL = 5000

let state = { checks: 0, last: null, byId: {} }
const listeners = new Set()
let timer = 0
let users = 0
let busy = false

export async function ping(url, timeout = 8000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeout)
  const t0 = performance.now()
  try {
    await fetch(`${url}/?ping=${Date.now()}`, { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal })
    return { ok: true, ms: Math.round(performance.now() - t0) }
  } catch {
    return { ok: false, ms: null }
  } finally {
    clearTimeout(t)
  }
}

async function round() {
  if (busy || document.hidden) return
  busy = true
  const results = await Promise.all(liveProjects.map((p) => ping(p.liveUrl)))
  const byId = { ...state.byId }
  liveProjects.forEach((p, i) => {
    byId[p.id] = [...(byId[p.id] ?? []), { ...results[i], t: Date.now() }].slice(-HISTORY)
  })
  state = { checks: state.checks + 1, last: Date.now(), byId }
  busy = false
  listeners.forEach((fn) => fn())
}

const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useUptime(active = true) {
  const snapshot = useSyncExternalStore(subscribe, () => state)
  useEffect(() => {
    if (!active) return
    users += 1
    if (users === 1) {
      round()
      timer = setInterval(round, INTERVAL)
    }
    return () => {
      users -= 1
      if (users === 0) clearInterval(timer)
    }
  }, [active])
  return snapshot
}

export const HISTORY_LENGTH = HISTORY
