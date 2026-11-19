import { useEffect, useRef, useState } from 'react'
import { site } from '../../data/site'
import { liveProjects } from '../../data/projects'
import { useReducedMotion } from '../../hooks/useMedia'
import { cx } from '../../utils'
import './Phone.css'

/*
  Akeem's phone as the way to reach him. His photo is the wallpaper and the dock has the four real
  contact options: Mail, LinkedIn, X and GitHub. Every icon is a real link that opens straight away
  (so pop-up blockers don't interfere), and meanwhile the phone plays it out: the icon expands into
  the app's colour and the island at the top says where you're going.

  A few seconds after the phone scrolls into view, a message from him drops in from the top;
  tapping it starts an email. Long-press Mail to copy the address. The clock shows the visitor's
  own time, since it's their screen.

  An original phone design, not copied from any brand: thin bezel, pill-shaped island.
*/
const SVG = {
  mail: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 7.5l8 5.6 8-5.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="9.5" width="3" height="9" rx="0.6" fill="currentColor" />
      <circle cx="6.5" cy="6.3" r="1.75" fill="currentColor" />
      <path d="M11 9.5h2.9v1.4c.6-1 1.7-1.65 3.1-1.65 2.3 0 3.5 1.45 3.5 4.1v5.15h-3v-4.6c0-1.25-.5-1.95-1.55-1.95-1.15 0-1.95.8-1.95 2.15v4.4h-3z" fill="currentColor" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" fill="currentColor" transform="translate(4.2 4.2) scale(0.65)" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        transform="translate(3.6 3.6) scale(0.7)"
        fill="currentColor"
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
      />
    </svg>
  ),
}

const url = (label) => site.socials.find((s) => s.label.toLowerCase() === label)?.url

// The products as home-screen apps, each with its real icon from its own site.
const PRODUCTS = liveProjects.map((p) => ({
  id: p.id,
  name: p.title,
  href: p.liveUrl,
  icon: `/projects/${p.id}/icon.svg`,
  bg: p.theme?.bg ?? '#111',
}))

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(id)
  }, [])
  return now
}

// lock and mail: only used when, on a phone, the whole section becomes the home screen.
export default function Phone({ composing = false, onCompose, compose, lock, mail }) {
  const box = useRef(null)
  const screen = useRef(null)
  const sheet = useRef(null)
  const reduced = useReducedMotion()
  const now = useClock()
  const [launch, setLaunch] = useState(null) // the app opening: { id, name, x, y }
  const [note, setNote] = useState(reduced) // the message from Akeem
  const [copied, setCopied] = useState(false)
  const hold = useRef(0)

  const apps = [
    { id: 'mail', name: 'Mail', href: `mailto:${site.email}?subject=${encodeURIComponent('Hello Akeem')}`, label: `Email Akeem at ${site.email}`, badge: 1 },
    { id: 'linkedin', name: 'LinkedIn', href: url('linkedin'), label: 'Akeem on LinkedIn (new tab)' },
    { id: 'x', name: 'X', href: url('x'), label: 'Akeem on X (new tab)' },
    { id: 'github', name: 'GitHub', href: url('github'), label: 'Akeem on GitHub (new tab)' },
  ].filter((a) => a.href)

  // The phone follows the pointer: it tilts toward it, the wallpaper shifts the other way for
  // depth, and the light slides across the glass. Eased and written straight to CSS.
  useEffect(() => {
    if (reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const el = box.current
    const area = el.closest('section') ?? el
    let tx = 0
    let ty = 0
    let x = 0
    let y = 0
    let raf = 0
    const tick = () => {
      x += (tx - x) * 0.09
      y += (ty - y) * 0.09
      el.style.setProperty('--px', x.toFixed(3))
      el.style.setProperty('--py', y.toFixed(3))
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.002 ? requestAnimationFrame(tick) : 0
    }
    const move = (e) => {
      const r = el.getBoundingClientRect()
      tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth * 0.4)))
      ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (innerHeight * 0.5)))
      raf ||= requestAnimationFrame(tick)
    }
    const leave = () => {
      tx = 0
      ty = 0
      raf ||= requestAnimationFrame(tick)
    }
    area.addEventListener('pointermove', move)
    area.addEventListener('pointerleave', leave)
    return () => {
      area.removeEventListener('pointermove', move)
      area.removeEventListener('pointerleave', leave)
      cancelAnimationFrame(raf)
    }
  }, [reduced])

  // On arrival: the island opens to say he's available, settles, then his message drops in.
  const [intro, setIntro] = useState(false)
  useEffect(() => {
    if (reduced) return
    const ts = []
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      ts.push(setTimeout(() => setIntro(true), 700))
      ts.push(setTimeout(() => setIntro(false), 3400))
      ts.push(setTimeout(() => setNote(true), 4200))
    }, { threshold: 0.2 })
    io.observe(box.current)
    return () => {
      io.disconnect()
      ts.forEach(clearTimeout)
    }
  }, [reduced])

  // It's a real link so it opens by itself; the phone just plays the launch animation alongside.
  const open = (a) => (e) => {
    if (copied) return
    const s = screen.current.getBoundingClientRect()
    const r = e.currentTarget.getBoundingClientRect()
    setNote(false)
    setLaunch({ id: a.id, name: a.name, icon: a.icon, bg: a.bg, x: r.left + r.width / 2 - s.left, y: r.top + r.height / 2 - s.top })
  }
  useEffect(() => {
    if (!launch) return
    const id = setTimeout(() => setLaunch(null), reduced ? 900 : 1900)
    return () => clearTimeout(id)
  }, [launch, reduced])

  // Long-press Mail to copy the address instead.
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked: the tap still opens the mail app.
    }
  }
  const held = useRef(false) // the hold fired: the tap that ends it must not also open Mail
  const press = (a) => () => {
    if (a.id !== 'mail') return
    held.current = false
    hold.current = setTimeout(() => {
      held.current = true
      copy()
    }, 550)
  }
  const release = () => clearTimeout(hold.current)
  const mailClick = (a) => (e) => {
    if (held.current || copied) {
      e.preventDefault()
      held.current = false
      return
    }
    // If there's a brief to write, Mail opens a new message on the phone instead of leaving the page.
    if (onCompose) {
      e.preventDefault()
      setNote(false)
      onCompose(true)
      return
    }
    open(a)(e)
  }

  // New message: focus goes to the first empty field. Escape closes it.
  useEffect(() => {
    if (!composing) return
    const id = setTimeout(() => {
      const f = [...(sheet.current?.querySelectorAll('input:not([type=radio]), textarea') ?? [])]
      ;(f.find((x) => !x.value) ?? f[0])?.focus({ preventScroll: true })
    }, 450)
    const esc = (e) => e.key === 'Escape' && onCompose?.(false)
    window.addEventListener('keydown', esc)
    return () => {
      clearTimeout(id)
      window.removeEventListener('keydown', esc)
    }
  }, [composing, onCompose])

  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, '')
  const busy = launch ?? (copied ? { id: 'copied', name: 'Copied' } : intro ? { id: 'avail' } : null)

  return (
    <div ref={box} className={cx('ph', composing && 'is-composing')}>
      <div className="ph__body">
        <span className="ph__btn is-action" aria-hidden="true" />
        <span className="ph__btn is-up" aria-hidden="true" />
        <span className="ph__btn is-down" aria-hidden="true" />
        <span className="ph__btn is-power" aria-hidden="true" />
        <div ref={screen} className="ph__screen">
          <img className="ph__wall" src={site.photo.small ?? site.photo.src} alt="" decoding="async" />
          <span className="ph__shade" aria-hidden="true" />
          {lock && (
            <div className="ph__lock">
              {lock}
              {mail && <div className="ph__mailbar">{mail}</div>}
            </div>
          )}

          <div className="ph__status" aria-hidden="true">
            <span className="ph__time">{time}</span>
            <span className="ph__icons">
              <svg viewBox="0 0 18 12">
                <rect x="0" y="8" width="3" height="4" rx="1" />
                <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
                <rect x="10" y="3" width="3" height="9" rx="1" />
                <rect x="15" y="0" width="3" height="12" rx="1" />
              </svg>
              <i className="ph__battery">
                <b />
              </i>
            </span>
          </div>

          {/* The island: status at rest, the destination while an app opens. */}
          <div className={cx('ph__island', busy && 'is-wide', busy && `is-${busy.id}`)} aria-live="polite">
            {busy?.id === 'avail' ? (
              <>
                <span className="ph__island-text">Available for work</span>
                <i className="ph__dot" aria-hidden="true" />
              </>
            ) : busy?.id === 'copied' ? (
              <span className="ph__island-text">✓ Address copied</span>
            ) : busy ? (
              <>
                <span className={cx('ph__mini', `is-${busy.id}`)}>{busy.icon ? <img src={busy.icon} alt="" /> : SVG[busy.id]}</span>
                <span className="ph__island-text">Opening {busy.name}…</span>
                <span className="ph__spin" aria-hidden="true" />
              </>
            ) : (
              <i className="ph__dot is-rest" aria-hidden="true" />
            )}
          </div>

          {/* Home screen: the products as apps. Each one opens the live site. */}
          <nav className="ph__apps" aria-label="Akeem’s live products">
            {PRODUCTS.map((a) => (
              <a key={a.id} href={a.href} target="_blank" rel="noreferrer" className={cx('ph__app', `is-${a.id}`)} aria-label={`${a.name}: the live site (new tab)`} onClick={open(a)} data-cursor="open">
                <span className="ph__icon is-product">
                  <img src={a.icon} alt="" decoding="async" />
                </span>
                <span className="ph__name">{a.name}</span>
              </a>
            ))}
          </nav>
          <span className="ph__glare" aria-hidden="true" />

          {/* A message from Akeem. */}
          <a className={cx('ph__note', note && !composing && 'is-in')} href={`mailto:${site.email}?subject=${encodeURIComponent('Let’s build something')}`} tabIndex={note ? 0 : -1} aria-hidden={note ? undefined : 'true'} onClick={mailClick({ id: 'mail', name: 'Mail' })}>
            <span className="ph__note-icon">{SVG.mail}</span>
            <span className="ph__note-body">
              <b>
                Akeem <small>now</small>
              </b>
              <span>Got an idea? Tap to message me.</span>
            </span>
          </a>

          <nav className="ph__dock" aria-label="Ways to reach Akeem">
            {apps.map((a) => (
              <a
                key={a.id}
                href={a.href}
                target={a.id === 'mail' ? undefined : '_blank'}
                rel="noreferrer"
                className={cx('ph__app', `is-${a.id}`)}
                aria-label={a.label}
                onClick={a.id === 'mail' ? mailClick(a) : open(a)}
                onPointerDown={press(a)}
                onPointerUp={release}
                onPointerLeave={release}
                onContextMenu={(e) => a.id === 'mail' && e.preventDefault()}
                data-cursor={a.id === 'mail' ? undefined : 'open'}
              >
                <span className="ph__icon">
                  {SVG[a.id]}
                  {a.badge && <em>{a.badge}</em>}
                </span>
                <span className="ph__name">{a.name}</span>
              </a>
            ))}
          </nav>
          <span className="ph__home" aria-hidden="true" />

          {/* Mail: a new message to Akeem, sliding up over the home screen. */}
          {compose && (
            <div ref={sheet} className={cx('ph__compose', composing && 'is-open')} inert={!composing} aria-hidden={!composing}>
              {compose}
            </div>
          )}

          {/* App launch: the colour grows out of the icon. */}
          {launch && (
            <span className={cx('ph__launch', `is-${launch.id}`)} style={{ '--ox': `${launch.x}px`, '--oy': `${launch.y}px`, ...(launch.bg && { background: launch.bg, color: '#fff' }) }} aria-hidden="true">
              <span className={cx('ph__launch-icon', launch.icon && 'is-product')}>{launch.icon ? <img src={launch.icon} alt="" /> : SVG[launch.id]}</span>
              <span className="ph__launch-name">{launch.name}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
