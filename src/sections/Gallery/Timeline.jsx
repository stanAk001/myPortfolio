import { useEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'
import { useFinePointer, useMediaQuery, useReducedMotion } from '../../hooks/useMedia'
import { cx, pad } from '../../utils'
import { isNew } from '../../lib/visit'
import './Timeline.css'

/*
  The work as an edit. The five products sit on one track like clips, each tagged with its brand
  colour. The one on screen is opened up and shows the same footage the big screen is playing
  (mirrored from that <video>, so nothing extra downloads). A playhead runs across it with the
  timecode counting, and at the end of a clip the reel cuts to the next.

  Hover a clip that isn't playing to scrub it: moving across flips through that product's real
  screens. Pick it and its thumbnail lifts off the track and lands on the big screen. Arrow keys move
  along the track; the play/pause button holds or rolls the edit.
*/
const FPS = 24

function timecode(ms) {
  const f = Math.floor((ms / 1000) * FPS)
  const s = Math.floor(f / FPS)
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f % FPS)}`
}

// A product's frames for scrubbing: its landscape screens, poster first.
const framesOf = (p) => [p.image?.src, ...p.gallery.filter((g) => g.width >= g.height).map((g) => g.src)].filter((s, i, a) => s && a.indexOf(s) === i).slice(0, 8)

/* The open clip: the big screen's footage, copied into a small canvas about a dozen times a second. */
function Mirror({ on }) {
  const cv = useRef(null)
  useEffect(() => {
    if (!on) return
    const el = cv.current
    const ctx = el.getContext('2d')
    let raf = 0
    let last = 0
    const fit = () => {
      const r = el.getBoundingClientRect()
      el.width = Math.round(r.width * 1.5)
      el.height = Math.round(r.height * 1.5)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    const draw = (now) => {
      raf = requestAnimationFrame(draw)
      if (now - last < 80) return
      last = now
      const v = document.querySelector('.rl__view .rl__clip.is-on video')
      if (!v || v.readyState < 2 || !v.videoWidth) return
      // Cover the canvas from the top of the frame, same as the thumbnails.
      const s = Math.max(el.width / v.videoWidth, el.height / v.videoHeight)
      const w = el.width / s
      ctx.drawImage(v, (v.videoWidth - w) / 2, 0, w, el.height / s, 0, 0, el.width, el.height)
      el.classList.add('is-live')
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [on])
  return <canvas ref={cv} className="tl__mirror" aria-hidden="true" />
}

function Clip({ p, i, on, onPick, fine, at, headRef }) {
  const frames = framesOf(p)
  const [frame, setFrame] = useState(-1)
  const [x, setX] = useState(0)
  const scrub = (e) => {
    if (!fine || on || frames.length < 2) return
    const b = e.currentTarget.getBoundingClientRect()
    const t = Math.min(0.999, Math.max(0, (e.clientX - b.left) / b.width))
    setX(t)
    setFrame(Math.floor(t * frames.length))
  }
  return (
    <li className={cx('tl__clip', on && 'is-on')} style={{ '--p-accent': p.theme?.accent ?? 'var(--ink-text)' }}>
      <button
        type="button"
        data-i={i}
        aria-current={on ? 'true' : undefined}
        aria-label={`${pad(i + 1)} ${p.title}: ${p.category}`}
        onClick={(e) => onPick(i, e.currentTarget.querySelector('.tl__thumb'))}
        onPointerMove={scrub}
        onPointerLeave={() => setFrame(-1)}
        tabIndex={on ? 0 : -1}
      >
        <span className="tl__thumb">
          <img src={p.image?.src} alt="" loading="eager" decoding="async" />
          {frame > 0 && <img key={frame} className="tl__frame" src={frames[frame]} alt="" decoding="async" />}
          {frame >= 0 && <i className="tl__scrub" style={{ left: `${x * 100}%` }} aria-hidden="true" />}
          {on && <Mirror on={on} />}
          {on && <i ref={headRef} className="tl__head" aria-hidden="true" />}
          <em className="tl__in" aria-hidden="true">{timecode(at).slice(3, 8)}</em>
          {isNew(p) && <em className="tl__new">New</em>}
        </span>
        <span className="tl__label">
          <span className="tl__no">{pad(i + 1)}</span>
          <span className="tl__name">{p.title}</span>
        </span>
      </button>
    </li>
  )
}

export default function Timeline({ projects, index, onPick, onAdvance, running, onRoll, slide }) {
  const track = useRef(null)
  const tc = useRef(null)
  const head = useRef(null)
  const fine = useFinePointer()
  const reduced = useReducedMotion()
  const small = useMediaQuery('(max-width: 760px)')
  const elapsed = useRef(0)

  // The playhead only moves while the reel is rolling; at the end of a clip, cut.
  useEffect(() => {
    elapsed.current = 0
  }, [index])
  useEffect(() => {
    const paint = () => {
      const t = Math.min(1, elapsed.current / slide)
      head.current?.parentElement.style.setProperty('--t', t)
      if (tc.current) tc.current.textContent = timecode(index * slide + elapsed.current)
    }
    paint()
    if (!running) return
    let prev = performance.now()
    let raf = 0
    const tick = (now) => {
      elapsed.current += now - prev
      prev = now
      paint()
      if (elapsed.current >= slide) onAdvance()
      else raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running, index, slide, onAdvance])

  // On a phone the track scrolls sideways. Keep the playing clip in view without moving the page.
  useEffect(() => {
    if (!small) return
    const ol = track.current
    const li = ol?.children[index]
    if (!li) return
    ol.scrollTo({ left: li.offsetLeft - (ol.clientWidth - li.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' })
  }, [index, small, reduced])

  // Picking a clip: its thumbnail lifts off the track and lands on the big screen.
  const pick = (i, thumb) => {
    if (i === index) return
    const view = document.querySelector('.rl__view')
    if (!reduced && thumb && view) {
      const a = thumb.getBoundingClientRect()
      const b = view.getBoundingClientRect()
      if (b.top < innerHeight && b.bottom > 0) {
        const ghost = document.createElement('img')
        ghost.src = projects[i].image?.src
        ghost.className = 'tl__ghost'
        Object.assign(ghost.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` })
        document.body.appendChild(ghost)
        gsap
          .timeline({ onComplete: () => ghost.remove() })
          .to(ghost, { left: b.left, top: b.top, width: b.width, height: b.height, borderRadius: 2, duration: 0.75, ease: 'power3.inOut' })
          .to(ghost, { opacity: 0, duration: 0.35, ease: 'power1.out' })
      }
    }
    onPick(i)
  }

  // Arrow keys move along the track (one tab stop for the whole track, on the playing clip).
  const keys = (e) => {
    const n = projects.length
    const to = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: n - 1 }[e.key]
    if (to == null) return
    e.preventDefault()
    const i = (to + n) % n
    pick(i, track.current.querySelector(`[data-i="${i}"] .tl__thumb`))
    requestAnimationFrame(() => track.current.querySelector(`[data-i="${i}"]`)?.focus())
  }

  const p = projects[index]
  return (
    <div className="tl" style={{ '--p-accent': p.theme?.accent ?? 'var(--ink-text)' }}>
      <div className="tl__bar label">
        <button type="button" className={cx('tl__roll', running && 'is-on')} onClick={onRoll} aria-label={running ? 'Hold the reel' : 'Roll the reel'} disabled={reduced}>
          <span aria-hidden="true">{running ? '❚❚' : '▶'}</span>
        </button>
        <span ref={tc} className="tl__tc" aria-hidden="true">
          {timecode(index * slide)}
        </span>
        <span className="tl__now" aria-live="polite">
          <b>{pad(index + 1)}</b> / {pad(projects.length)} · {p.title}
        </span>
        <span className="tl__state" aria-hidden="true">{running ? 'Rolling' : reduced ? 'Still' : 'Held'}</span>
      </div>

      <ol ref={track} className="tl__track" aria-label="Choose a product" onKeyDown={keys}>
        {projects.map((q, i) => (
          <Clip key={q.id} p={q} i={i} on={i === index} onPick={pick} fine={fine} at={i * slide} headRef={head} />
        ))}
      </ol>
    </div>
  )
}
