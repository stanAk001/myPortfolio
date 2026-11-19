import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { scrollToEl, scrollToY } from './lib/smooth'

// Two routes (home and /work/:id) aren't worth a router dependency. This one adds the two things
// a library wouldn't give for free here: view transitions between pages, and scroll restoration
// that works with the pinned reel.

const RouterContext = createContext(null)

const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function withTransition(update) {
  if (!document.startViewTransition || prefersReduced()) {
    update()
    return
  }
  document.startViewTransition(() => flushSync(update))
}

export function scrollToId(id, smooth = true) {
  const el = document.getElementById(id)
  if (!el) return false
  scrollToEl(el, { immediate: !smooth })
  return true
}

export function RouterProvider({ children }) {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    const onPop = () => withTransition(() => setPath(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // `transition: false` skips the view transition, for callers that animate the change themselves.
  const navigate = useCallback((to, { transition = true, replace = false } = {}) => {
    // Swap the URL without adding a history entry (e.g. the bare domain → /work).
    if (replace) {
      history.replaceState(null, '', to)
      setPath(to.split('#')[0] || '/')
      return
    }
    const [pathname, hash] = to.split('#')
    const target = pathname || '/'

    if (target === window.location.pathname) {
      // Pages that aren't a scrolling page (the old desktop) listen for this and open the matching window.
      window.dispatchEvent(new CustomEvent('route:hash', { detail: hash ?? '' }))
      if (hash) {
        scrollToId(hash)
        history.replaceState(null, '', `${target}#${hash}`)
      } else {
        scrollToY(0)
      }
      return
    }

    // Remember the scroll position so Back lands on the same project, not the top of the page.
    history.replaceState({ ...history.state, scrollY: window.scrollY }, '')
    history.pushState({ from: window.location.pathname }, '', to)
    if (transition) withTransition(() => setPath(target))
    else setPath(target)
  }, [])

  const value = useMemo(() => ({ path, navigate }), [path, navigate])
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export const useRouter = () => useContext(RouterContext)

export function Link({ to, onClick, children, ...rest }) {
  const { navigate } = useRouter()
  const handleClick = (e) => {
    onClick?.(e)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(to)
  }
  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
}
