import { useSyncExternalStore } from 'react'

export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')

// Checks for a fine pointer with hover, not screen width, so big touchscreens still get the touch version.
export const useFinePointer = () => useMediaQuery('(hover: hover) and (pointer: fine)')

export const saveData = () => navigator.connection?.saveData === true
