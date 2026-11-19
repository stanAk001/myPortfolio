import { useSyncExternalStore } from 'react'

let on = false
const listeners = new Set()

export const xray = {
  get: () => on,
  toggle() {
    on = !on
    document.documentElement.toggleAttribute('data-xray', on)
    listeners.forEach((fn) => fn())
  },
  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
}

export const useXRay = () => useSyncExternalStore(xray.subscribe, xray.get)
