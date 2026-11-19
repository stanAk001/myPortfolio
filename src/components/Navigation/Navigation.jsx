import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useRouter } from '../../router'
import { site } from '../../data/site'
import { projects } from '../../data/projects'
import { lockScroll } from '../../lib/smooth'
import { openPalette } from '../CommandPalette/CommandPalette'
import { cx } from '../../utils'
import ThemeSwitch from '../ThemeSwitch/ThemeSwitch'
import './Navigation.css'

const ITEMS = [
  { id: 'projects', label: 'Projects' },
  { id: 'studio', label: 'Studio', to: '/studio' },
  { id: 'build', label: 'Solved' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
]

// Progress ring around the avatar: radius 20 inside a 44px box.
const RING = 2 * Math.PI * 20

/*
  Fixed top bar. Photo and name on the left, a ring around the photo that fills as you scroll, and
  a line under the name that switches to whichever project you're looking at. A marker under the
  links slides to the section in view. Scrolling down makes the bar tighter, but it never hides.
*/
export default function Navigation() {
  const { path } = useRouter()
  const [open, setOpen] = useState(false)
  const [tight, setTight] = useState(false)
  const [current, setCurrent] = useState(null)
  const [viewing, setViewing] = useState(null)
  const bar = useRef(null)
  const ring = useRef(null)
  const links = useRef(null)
  const menuButton = useRef(null)

  // Write scroll progress straight to the ring once per frame. No re-render.
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0
      ring.current?.style.setProperty('stroke-dashoffset', String(RING * (1 - progress)))
      setTight(window.scrollY > 24)
    }
    const onScroll = () => (frame ||= requestAnimationFrame(update))
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [path])

  // Which section is in the middle of the screen, and which project (if any) is on screen.
  useEffect(() => {
    setCurrent(path.startsWith('/studio') ? 'studio' : null)
    setViewing(null)
    if (path !== '/work') return
    let io
    const id = setTimeout(() => {
      const watched = [...ITEMS.map((item) => document.getElementById(item.id)), ...document.querySelectorAll('[data-nav-label]')].filter(Boolean)
      io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (!e.isIntersecting) return
            const label = e.target.dataset.navLabel
            if (label) {
              setViewing(label)
              setCurrent('projects')
            } else {
              setCurrent(e.target.id)
              setViewing(null)
            }
          }),
        { rootMargin: '-45% 0px -54% 0px' },
      )
      watched.forEach((s) => io.observe(s))
    }, 150)
    return () => {
      clearTimeout(id)
      io?.disconnect()
    }
  }, [path])

  // The marker under the links slides to the current one.
  useLayoutEffect(() => {
    const list = links.current
    if (!list) return
    const place = () => {
      const a = current && list.querySelector(`[data-id="${current}"]`)
      list.style.setProperty('--mark-x', `${a ? a.offsetLeft : 0}px`)
      list.style.setProperty('--mark-w', `${a ? a.offsetWidth : 0}px`)
      list.dataset.marked = a ? 'true' : 'false'
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [current, tight])

  useEffect(() => {
    if (!open) return
    lockScroll(true)
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      menuButton.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      lockScroll(false)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => setOpen(false)
  const sub = viewing ? `Viewing — ${viewing}` : site.role

  return (
    <>
      <header ref={bar} className={cx('nav', tight && 'is-tight', open && 'is-open')}>
        <Link to="/work" className="nav__brand" onClick={close} aria-label={`${site.name} — back to the top`}>
          <span className="nav__avatar" aria-hidden="true">
            <svg viewBox="0 0 44 44" className="nav__ring">
              <circle cx="22" cy="22" r="20" className="nav__ring-track" />
              <circle ref={ring} cx="22" cy="22" r="20" className="nav__ring-fill" style={{ strokeDasharray: RING, strokeDashoffset: RING }} />
            </svg>
            <span className="nav__face">
              <img src={site.photo.small} alt="" decoding="async" />
            </span>
          </span>
          <span className="nav__id">
            <span className="nav__name">{site.name}</span>
            <span className="nav__sub" aria-live="polite">
              <span key={sub} className="nav__sub-text">
                {sub}
              </span>
            </span>
          </span>
        </Link>

        <nav className="nav__links" aria-label="Primary">
          <ol ref={links}>
            {ITEMS.map((item) => (
              <li key={item.id}>
                <Link to={item.to ?? `/work#${item.id}`} data-id={item.id} aria-current={current === item.id ? 'true' : undefined}>
                  {item.label}
                  {item.id === 'projects' && (
                    <span className="nav__count">
                      {projects.length}
                      <span className="sr-only"> projects</span>
                    </span>
                  )}
                </Link>
              </li>
            ))}
            <li className="nav__mark" aria-hidden="true" />
          </ol>
        </nav>

        <div className="nav__tools">
          <ThemeSwitch />
          <button type="button" className="nav__cmd" onClick={openPalette} title="Search the site and jump anywhere (⌘K)">
            <kbd>⌘K</kbd>
          </button>
          <Link to="/work#contact" className="nav__cta">
            Let’s talk
          </Link>
          <button
            ref={menuButton}
            type="button"
            className="nav__menu-btn"
            aria-expanded={open}
            aria-controls="nav-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="nav__burger" aria-hidden="true">
              <i />
              <i />
            </span>
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          </button>
        </div>
      </header>

      <div id="nav-menu" className={cx('menu', open && 'is-open')} hidden={!open}>
        <nav aria-label="Menu">
          <ol>
            {ITEMS.map((item, i) => (
              <li key={item.id} style={{ '--i': i }}>
                <Link to={item.to ?? `/work#${item.id}`} onClick={close}>
                  {item.label}
                  <span className="menu__arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        <a className="menu__email" href={`mailto:${site.email}`}>
          {site.email}
        </a>
      </div>
    </>
  )
}
