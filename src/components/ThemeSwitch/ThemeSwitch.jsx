import { useState } from 'react'
import './ThemeSwitch.css'

/*
  The new theme spreads out from the button as a growing circle, like the light was switched on (or
  off) right where you clicked. Snapshot the page, swap the theme, reveal the new page through the
  circle. No View Transitions support or reduced motion: it just switches. The choice is saved.
*/
const KEY = 'theme'
const current = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

function apply(theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // Private mode: the theme still switches, it just isn't remembered.
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#111417' : '#ece6db')
}

export default function ThemeSwitch() {
  const [theme, setTheme] = useState(current)
  const dark = theme === 'dark'

  const flip = (e) => {
    const next = dark ? 'light' : 'dark'
    const swap = () => {
      apply(next)
      setTheme(next)
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduced) return swap()

    const r = e.currentTarget.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + r.height / 2
    const far = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    const root = document.documentElement
    root.classList.add('is-theming')
    const t = document.startViewTransition(swap)
    t.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${far}px at ${x}px ${y}px)`] },
        { duration: 850, easing: 'cubic-bezier(0.7, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
      )
    })
    t.finished.finally(() => root.classList.remove('is-theming'))
  }

  return (
    <button type="button" className={`tsw${dark ? ' is-dark' : ''}`} onClick={flip} aria-pressed={dark} aria-label={dark ? 'Switch to the light theme' : 'Switch to the dark theme'} title={dark ? 'Lights on' : 'Lights off'}>
      <span className="tsw__disc" aria-hidden="true" />
    </button>
  )
}
