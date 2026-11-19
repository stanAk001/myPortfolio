import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from '../../router'
import { projects } from '../../data/projects'
import { site } from '../../data/site'
import { xray } from '../XRay/store'
import { lockScroll, scrollToY } from '../../lib/smooth'
import { cx, hostOf } from '../../utils'
import './CommandPalette.css'

// Anything can open it: ⌘K / Ctrl+K, or `openPalette()` from a button.
export const openPalette = () => window.dispatchEvent(new Event('palette:open'))

export default function CommandPalette() {
  const { navigate } = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const [toast, setToast] = useState('')
  const input = useRef(null)
  const returnFocus = useRef(null)

  const commands = useMemo(
    () => [
      ...[
        ['work', 'Top: the reel'],
        ['projects', 'All projects'],
        ['build', 'Solved: before and after'],
        ['about', 'About'],
        ['contact', 'Contact'],
      ].map(([id, label]) => ({ group: 'Go to', label, hint: `#${id}`, run: () => navigate(`/work#${id}`) })),
      { group: 'Go to', label: 'Studio: ads, flyers, edits & your launch kit', hint: '/studio', run: () => navigate('/studio') },
      { group: 'Case studies', label: 'TheBox Lounge', hint: 'One bill, three businesses', run: () => navigate('/studio/thebox-lounge') },
      ...projects.map((p) => ({ group: 'Case studies', label: p.title, hint: p.category, run: () => navigate(`/work/${p.id}`) })),
      ...projects
        .filter((p) => p.liveUrl)
        .map((p) => ({ group: 'Live sites', label: `Open ${hostOf(p.liveUrl)}`, hint: '↗ new tab', run: () => window.open(p.liveUrl, '_blank', 'noopener') })),
      {
        group: 'Actions',
        label: 'Copy email address',
        hint: site.email,
        run: async () => {
          await navigator.clipboard?.writeText(site.email).catch(() => {})
          setToast('Email copied')
        },
      },
      { group: 'Actions', label: 'Toggle X-ray mode', hint: 'X', run: () => xray.toggle() },
      { group: 'Actions', label: 'Back to top', hint: '↑', run: () => scrollToY(0) },
    ],
    [navigate],
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => `${c.label} ${c.hint} ${c.group}`.toLowerCase().includes(q))
  }, [commands, query])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('palette:open', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('palette:open', onOpen)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    returnFocus.current = document.activeElement
    lockScroll(true)
    setQuery('')
    setIndex(0)
    requestAnimationFrame(() => input.current?.focus())
    return () => {
      lockScroll(false)
      returnFocus.current?.focus?.()
    }
  }, [open])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(''), 1800)
    return () => clearTimeout(id)
  }, [toast])

  const run = (cmd) => {
    setOpen(false)
    // Let the dialog close (and focus return) before navigating.
    requestAnimationFrame(() => cmd.run())
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') setOpen(false)
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => (i + 1) % Math.max(results.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => (i - 1 + results.length) % Math.max(results.length, 1))
    } else if (e.key === 'Enter' && results[index]) {
      e.preventDefault()
      run(results[index])
    }
  }

  let lastGroup = null

  return (
    <>
      {open && (
        <div className="cmd" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="cmd__panel" role="dialog" aria-modal="true" aria-label="Command menu">
            <div className="cmd__search">
              <span className="cmd__prompt" aria-hidden="true">
                ~/akeem $
              </span>
              <input
                ref={input}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setIndex(0)
                }}
                onKeyDown={onKeyDown}
                placeholder="Type a command or search…"
                aria-label="Search commands"
                role="combobox"
                aria-expanded="true"
                aria-controls="cmd-list"
                aria-activedescendant={results[index] ? `cmd-${index}` : undefined}
              />
              <kbd>esc</kbd>
            </div>
            <ul id="cmd-list" className="cmd__list" role="listbox">
              {results.length === 0 && <li className="cmd__empty">No match. Try “work”, “toolhaven” or “email”.</li>}
              {results.map((c, i) => {
                const head = c.group !== lastGroup
                lastGroup = c.group
                return (
                  <li key={`${c.group}-${c.label}`} role="presentation">
                    {head && <p className="cmd__group label">{c.group}</p>}
                    <button
                      type="button"
                      id={`cmd-${i}`}
                      role="option"
                      aria-selected={i === index}
                      className={cx('cmd__item', i === index && 'is-active')}
                      onMouseMove={() => setIndex(i)}
                      onClick={() => run(c)}
                      tabIndex={-1}
                    >
                      <span>{c.label}</span>
                      <span className="cmd__hint">{c.hint}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="cmd__foot label">
              <span>↑↓ move</span>
              <span>↵ run</span>
              <span>⌘K toggle</span>
            </div>
          </div>
        </div>
      )}
      <p className={cx('cmd-toast', toast && 'is-on')} role="status" aria-live="polite">
        {toast}
      </p>
    </>
  )
}
