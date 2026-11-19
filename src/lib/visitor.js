import { useSyncExternalStore } from 'react'

/*
  The name the visitor gave on the welcome wall. Only kept in their own browser, never sent
  anywhere. Anything that greets them by name reads it from here.
*/
const KEY = 'visitor:name'
const listeners = new Set()

const read = () => {
  try {
    return (localStorage.getItem(KEY) ?? '').trim()
  } catch {
    return ''
  }
}

let name = typeof window === 'undefined' ? '' : read()

export function setVisitorName(value) {
  name = String(value ?? '')
    .replace(/[^\p{L}\p{M}' -]/gu, '')
    .trim()
    .slice(0, 24)
  try {
    if (name) localStorage.setItem(KEY, name)
    else localStorage.removeItem(KEY)
  } catch {
    // Storage blocked: only remember it for this visit.
  }
  listeners.forEach((fn) => fn())
}

export function useVisitorName() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => name,
  )
}
