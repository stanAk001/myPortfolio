import { useEffect, useRef, useState } from 'react'
import { confetti } from '../../lib/confetti'

// Changes the site's accent colour live and remembers it for next visit.
const ACCENTS = [
  { name: 'Ember', value: '#c56a3d' },
  { name: 'Electric', value: '#4c7dff' },
  { name: 'Mint', value: '#3fd49a' },
  { name: 'Gold', value: '#f2b632' },
  { name: 'Rose', value: '#ff4f8b' },
  { name: 'Violet', value: '#9b6bff' },
]
const KEY = 'accent'

const apply = (v) => document.documentElement.style.setProperty('--signal', v)

export default function AccentPicker() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(ACCENTS[0].value)
  const root = useRef(null)

  useEffect(() => {
    let saved = null
    try {
      saved = localStorage.getItem(KEY)
    } catch {
      /* storage blocked, keep the default accent */
    }
    if (saved) {
      setCurrent(saved)
      apply(saved)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const close = (e) => !root.current?.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    window.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', esc)
    }
  }, [open])

  const choose = (a, e) => {
    setCurrent(a.value)
    apply(a.value)
    try {
      localStorage.setItem(KEY, a.value)
    } catch {
      /* fine */
    }
    const b = e.currentTarget.getBoundingClientRect()
    confetti(b.left + b.width / 2, b.top + b.height / 2, 24)
  }

  return (
    <div ref={root} className="accent">
      <button
        type="button"
        className="accent__btn"
        aria-expanded={open}
        aria-label="Change the site’s colour"
        title="Change the site’s colour"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="accent__dot" style={{ background: current }} />
      </button>
      {open && (
        <div className="accent__pop" role="menu">
          <p className="label">Pick a colour</p>
          <div className="accent__row">
            {ACCENTS.map((a) => (
              <button
                key={a.value}
                type="button"
                role="menuitemradio"
                aria-checked={a.value === current}
                className="accent__swatch"
                style={{ '--c': a.value }}
                onClick={(e) => choose(a, e)}
                title={a.name}
              >
                <span className="sr-only">{a.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
