import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { site } from '../../data/site'
import { liveProjects } from '../../data/projects'
import { scrollToY } from '../../lib/smooth'
import { Link, useRouter } from '../../router'
import { useReducedMotion } from '../../hooks/useMedia'
import { cx } from '../../utils'
import Egg from '../Egg/Egg'
import { useVisitorName } from '../../lib/visitor'
import './Footer.css'

/*
  Footer. "Akeem" across the full width, each letter filled with one of the five products and
  lighting up in turn when you get here. Hover a letter to see which product, click to open it.

  Below that: what's being built now, links to the live sites, and back-to-top as a tape rewind
  (the timecode runs to zero while the page scrolls up). The bug behind the rule still steals the k.
*/
// Toolhaven's pages are mostly white text, which looks like an empty letter, so its letter uses
// one of its Pinterest flyers instead.
const LETTER_IMG = { toolhaven: '/studio/flyers/02.webp' }

const tc = (s) => {
  const f = Math.max(0, Math.round(s * 24))
  const sec = Math.floor(f / 24)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(Math.floor(sec / 3600))}:${p(Math.floor(sec / 60) % 60)}:${p(sec % 60)}:${p(f % 24)}`
}

/* The five live sites by name, each linking to the real thing. */
function OutThere() {
  return (
    <ul className="footer__air" aria-label="The sites, live">
      {liveProjects.map((p) => (
        <li key={p.id}>
          <a href={p.liveUrl} target="_blank" rel="noreferrer">
            {p.title}
          </a>
        </li>
      ))}
    </ul>
  )
}

export default function Footer() {
  const root = useRef(null)
  const reduced = useReducedMotion()
  const [lit, setLit] = useState(false)
  const [point, setPoint] = useState(null)
  const [rewind, setRewind] = useState(null) // the timecode while rewinding
  const visitor = useVisitorName()

  // Size the name to fill the width exactly, but cap it at about half the screen height so the
  // footer still fits on short windows.
  const name = useRef(null)
  useLayoutEffect(() => {
    const el = name.current
    const fit = () => {
      el.style.fontSize = '100px'
      const w = el.scrollWidth
      const cs = getComputedStyle(el.parentElement)
      const avail = el.parentElement.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      const size = Math.min((100 * avail) / w, window.innerHeight * 0.72)
      el.style.fontSize = `${Math.floor(size)}px`
    }
    fit()
    document.fonts?.ready.then(fit)
    const ro = new ResizeObserver(fit)
    ro.observe(el.parentElement)
    return () => ro.disconnect()
  }, [])

  // The marker under the name: under the letter being pointed at, or under the whole word.
  const [mark, setMark] = useState({ x: 0, w: 0 })
  useLayoutEffect(() => {
    const el = name.current
    const place = () => {
      const base = el.getBoundingClientRect()
      const l = point != null ? el.children[point]?.getBoundingClientRect() : null
      setMark(l ? { x: l.left - base.left, w: l.width } : { x: 0, w: base.width })
    }
    place()
    // The name gets resized (fonts loading, window resize), so keep the marker in step.
    const ro = new ResizeObserver(place)
    ro.observe(el)
    return () => ro.disconnect()
  }, [point])

  // "Start a brief" opens a new message on the Contact phone (from another page, go there first).
  const { navigate } = useRouter()
  const brief = () => {
    const c = document.getElementById('contact')
    if (!c) return navigate('/work#contact')
    window.dispatchEvent(new CustomEvent('brief:prefill', { detail: {} }))
    scrollToY(c.getBoundingClientRect().top + window.scrollY)
  }

  // The letters light up the first time the footer comes into view.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setLit(true), { threshold: 0.25 })
    io.observe(root.current)
    return () => io.disconnect()
  }, [])

  // Back to top: scroll up while the timecode counts down alongside.
  const toTop = () => {
    scrollToY(0)
    if (reduced) return
    const total = Math.max(1, document.documentElement.scrollHeight - innerHeight)
    const runtime = total / 40 // seconds of "tape" for the whole page
    let raf = 0
    const tick = () => {
      const left = window.scrollY / total
      setRewind(tc(left * runtime))
      if (window.scrollY > 2) raf = requestAnimationFrame(tick)
      else setTimeout(() => setRewind(null), 700)
    }
    raf = requestAnimationFrame(tick)
    setTimeout(() => cancelAnimationFrame(raf), 6000)
  }

  const letters = [...site.name]
  return (
    <footer ref={root} className={cx('footer theme-dark', lit && 'is-lit')} data-component="Footer">
      <p className="footer__kicker label">
        <span>Fin.</span>
        <span>{visitor ? `Thanks for watching, ${visitor}.` : 'Thanks for watching.'}</span>
      </p>

      <p ref={name} className="footer__name display" aria-hidden="true" onPointerLeave={() => setPoint(null)}>
        {letters.map((c, i) => {
          const p = liveProjects[i % liveProjects.length]
          return (
            <Link
              key={i}
              to={`/work/${p.id}`}
              tabIndex={-1}
              className={cx('footer__l', c.toLowerCase() === 'k' && 'footer__k', point === i && 'is-on', point != null && point !== i && 'is-off')}
              style={{ '--img': `url(${LETTER_IMG[p.id] ?? p.video?.adPoster ?? p.image?.src})`, '--i': i }}
              onPointerEnter={() => setPoint(i)}
              draggable="false"
            >
              {c}
            </Link>
          )
        })}
      </p>
      {/* Rule under the name. The marker slides under whichever letter you hover, caption and all. */}
      <div className="footer__which" aria-hidden="true" style={{ '--mx': `${mark.x}px`, '--mw': `${mark.w}px` }}>
        <span className={cx('footer__mark', point != null && 'is-on')} />
        <p className="label">
          {point != null ? (
            <span key={point}>
              {letters[point]} is for {liveProjects[point % liveProjects.length].title} → open the story
            </span>
          ) : (
            <span>Every letter is something I built. Point at one.</span>
          )}
        </p>
      </div>

      {/* Credits: one slim strip with three short items. */}
      <div className="footer__credits">
        {site.now && (
          <p className="footer__cr">
            <span className="footer__cr-k label">Now</span>
            <span className="footer__cr-v">
              {site.now.text}
              <span className="footer__caret" aria-hidden="true" />
            </span>
          </p>
        )}
        <div className="footer__cr">
          <span className="footer__cr-k label">Out there</span>
          <OutThere />
        </div>
        <p className="footer__cr">
          <span className="footer__cr-k label">Next</span>
          <button type="button" className="footer__brief" onClick={brief} data-cursor="build">
            Yours. Start a brief <span aria-hidden="true">→</span>
          </button>
        </p>
      </div>

      <Egg />
      <div className="footer__row label">
        <p>
          © {new Date().getFullYear()} {site.name}
        </p>
        <p className="footer__hint">Press X to see the skeleton</p>
        <button type="button" onClick={toTop} className="footer__top">
          <span aria-hidden="true">◀◀</span> Back to top
        </button>
      </div>

      {rewind && (
        <p className="footer__rewind" aria-hidden="true">
          <b>◀◀ Rewind</b>
          <span>{rewind}</span>
        </p>
      )}
    </footer>
  )
}
