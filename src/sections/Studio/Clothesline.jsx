import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { scrollToY } from '../../lib/smooth'
import { useMediaQuery, useReducedMotion } from '../../hooks/useMedia'
import { cx, pad } from '../../utils'
import './Clothesline.css'

/*
  The flyers hung up to dry. One long twine line runs across with every flyer pegged on it. Scrolling
  walks you along it (the section holds still while the line moves sideways), and each print swings on
  its peg as the line moves: the faster you go, the more they swing, and they settle when you stop.
  A slight breeze keeps them moving a little at rest.

  The print in front is fully lit; the rest sit a step back. Hover one and it lifts on its peg, click
  it to open it. Grab the line and throw it and it carries on with your momentum. Pegs are coloured by
  brand. At the end of the line there's an empty peg: yours.

  Everything runs from one frame loop that reads the scroll, so the line, pegs and swing can't get
  out of sync. Touch screens and reduced motion get a line you swipe along instead.
*/
const K = 0.022 // the peg's spring: how hard a print swings back to hanging straight
const DAMP = 0.075 // the air: how quickly a swing dies away
const KICK = 0.0021 // how much the line's acceleration throws the prints
const BRAND = { KeemStore: '#d9481e', Toolhaven: 'var(--ink-text)' }
const PACE = 0.5 // page scroll per pixel of line travel
const MAX_SWING = 0.42 // radians, about 24°

export default function Clothesline({ list, onOpen, onEnd, endLabel = 'Your flyer, next.' }) {
  const root = useRef(null)
  const stage = useRef(null)
  const rope = useRef(null)
  const hangs = useRef([])
  const swing = useRef([]) // per print: { a, v }
  const moved = useRef(false)
  const reduced = useReducedMotion()
  const coarse = useMediaQuery('(hover: none), (pointer: coarse), (max-width: 760px)')
  const live = !reduced && !coarse
  const [now, setNow] = useState(0) // the print in front
  const [geo, setGeo] = useState({ w: 240, gap: 56, start: 400, travel: 2000, vw: 1440, vh: 900 })
  const n = list.length + 1 // the prints, and the empty peg at the end

  // Sizes: a print is two thirds as wide as it is tall, and as tall as the screen allows.
  useLayoutEffect(() => {
    if (!live) return
    const measure = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const h = Math.max(240, Math.min(vh * 0.52, 470))
      const w = Math.round((h * 2) / 3)
      const gap = Math.round(w * 0.24)
      // The line starts with the first print in front and ends with the empty peg in front.
      const start = vw * 0.5
      const travel = (n - 1) * (w + gap)
      setGeo({ w, gap, start, travel, vw, vh })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [live, n])

  // The frame loop: scroll → line position → swing → the rope and every print.
  useEffect(() => {
    if (!live) return
    swing.current = Array.from({ length: n }, (_, i) => ({ a: (Math.random() - 0.5) * 0.5, v: 0, seed: i * 1.7 }))
    let raf = 0
    let x = 0 // where the line is, smoothed
    let vel = 0
    let lastVel = 0
    let front = -1
    const { w, gap, start, travel, vw, vh } = geo
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64
    const ropeTop = navH + Math.max(70, vh * 0.15)
    const sag = Math.min(34, vw * 0.02)
    const yAt = (xs, wave) => ropeTop + sag * (1 - ((xs - vw / 2) / (vw / 2)) ** 2) + wave * Math.sin((Math.PI * xs) / vw)

    const frame = (t) => {
      raf = requestAnimationFrame(frame)
      const r = root.current.getBoundingClientRect()
      const run = r.height - vh
      const p = run > 0 ? Math.max(0, Math.min(1, -r.top / run)) : 0
      const target = -p * travel
      const nx = x + (target - x) * 0.14
      vel = nx - x
      x = nx
      const accel = vel - lastVel
      lastVel = vel
      const wave = Math.max(-26, Math.min(26, vel * 1.1))
      const time = t / 1000

      // The rope goes through every peg on screen, sagging a little between each.
      const pts = []
      let best = 0
      let bestD = Infinity
      for (let i = 0; i < n; i++) {
        const xs = start + i * (w + gap) + x
        const s = swing.current[i]
        // The breeze, and the line's pull.
        s.v += -K * s.a - DAMP * s.v - accel * KICK * (0.8 + (i % 3) * 0.15) + Math.sin(time * 0.9 + s.seed) * 0.00035
        s.a = Math.max(-MAX_SWING, Math.min(MAX_SWING, s.a + s.v))
        const y = yAt(xs, wave)
        const el = hangs.current[i]
        const d = Math.min(1, Math.abs(xs - vw / 2) / (vw * 0.42))
        if (Math.abs(xs - vw / 2) < bestD) {
          bestD = Math.abs(xs - vw / 2)
          best = i
        }
        if (el) {
          const on = xs > -w * 1.5 && xs < vw + w * 1.5
          el.style.visibility = on ? 'visible' : 'hidden'
          if (on) {
            const scale = 1 + (1 - d) * 0.06
            el.style.transform = `translate3d(${(xs - w / 2).toFixed(1)}px, ${(y - 10).toFixed(1)}px, 0) rotate(${(s.a * 57.3).toFixed(2)}deg) scale(${scale.toFixed(3)})`
            el.style.setProperty('--d', d.toFixed(3))
          }
        }
        if (xs > -w && xs < vw + w) pts.push([xs, y])
      }
      if (best !== front) {
        front = best
        setNow(best)
      }
      // Rope from edge to edge, through the pegs.
      const line = [[-40, yAt(-40, wave)], ...pts, [vw + 40, yAt(vw + 40, wave)]]
      let d = `M ${line[0][0].toFixed(1)} ${line[0][1].toFixed(1)}`
      for (let k = 1; k < line.length; k++) {
        const [x0, y0] = line[k - 1]
        const [x1, y1] = line[k]
        const dip = Math.min(16, (x1 - x0) * 0.045)
        d += ` Q ${((x0 + x1) / 2).toFixed(1)} ${((y0 + y1) / 2 + dip).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`
      }
      rope.current?.querySelectorAll('path').forEach((pth) => pth.setAttribute('d', d))
      stage.current?.style.setProperty('--p', p.toFixed(4))
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [live, geo, n])

  // Grab the line and throw it: dragging moves the page, letting go keeps the momentum going.
  useEffect(() => {
    if (!live) return
    const el = stage.current
    let down = null
    let fling = 0
    const ratio = () => (root.current.offsetHeight - window.innerHeight) / Math.max(1, geo.travel)
    const pd = (e) => {
      if (e.button !== 0) return
      cancelAnimationFrame(fling)
      down = { x: e.clientX, y: window.scrollY, last: e.clientX, t: performance.now(), v: 0 }
      moved.current = false
    }
    const pm = (e) => {
      if (!down) return
      const dx = e.clientX - down.x
      if (Math.abs(dx) > 6) {
        moved.current = true
        el.classList.add('is-grabbing')
      }
      if (!moved.current) return
      const now2 = performance.now()
      down.v = (e.clientX - down.last) / Math.max(1, now2 - down.t)
      down.last = e.clientX
      down.t = now2
      scrollToY(down.y - dx * ratio(), { immediate: true })
    }
    const pu = () => {
      if (!down) return
      el.classList.remove('is-grabbing')
      let v = down.v * 16 * ratio()
      down = null
      const step = () => {
        v *= 0.94
        if (Math.abs(v) < 0.4) return
        scrollToY(window.scrollY - v, { immediate: true })
        fling = requestAnimationFrame(step)
      }
      if (moved.current) fling = requestAnimationFrame(step)
    }
    el.addEventListener('pointerdown', pd)
    window.addEventListener('pointermove', pm)
    window.addEventListener('pointerup', pu)
    return () => {
      el.removeEventListener('pointerdown', pd)
      window.removeEventListener('pointermove', pm)
      window.removeEventListener('pointerup', pu)
      cancelAnimationFrame(fling)
    }
  }, [live, geo])

  // On the swipe version, the print in front is the one closest to the middle.
  useEffect(() => {
    if (live) return
    const ul = stage.current?.querySelector('.cl__line')
    if (!ul) return
    let raf = 0
    const on = () => {
      raf ||= requestAnimationFrame(() => {
        raf = 0
        const mid = ul.getBoundingClientRect().left + ul.clientWidth / 2
        let best = 0
        let bestD = Infinity
        ;[...ul.children].forEach((li, i) => {
          const r = li.getBoundingClientRect()
          const d = Math.abs(r.left + r.width / 2 - mid)
          if (d < bestD) {
            bestD = d
            best = i
          }
        })
        setNow(best)
      })
    }
    ul.addEventListener('scroll', on, { passive: true })
    return () => {
      ul.removeEventListener('scroll', on)
      cancelAnimationFrame(raf)
    }
  }, [live])

  // Bring a print to the front (keyboard focus, or the counter's arrows).
  const bring = (i) => {
    if (!live) return
    const top = root.current.getBoundingClientRect().top + window.scrollY
    const run = root.current.offsetHeight - window.innerHeight
    const p = Math.max(0, Math.min(1, (geo.start + i * (geo.w + geo.gap) - geo.vw / 2) / geo.travel))
    scrollToY(top + p * run)
  }
  const nudge = (i) => {
    const s = swing.current[i]
    if (s) s.v += (Math.random() > 0.5 ? 1 : -1) * 0.035
  }
  const key = (i) => (e) => {
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1 }[e.key]
    if (to == null || to < 0 || to >= n) return
    e.preventDefault()
    hangs.current[to]?.querySelector('button')?.focus({ preventScroll: true })
    bring(to)
  }
  const skip = () => {
    const r = root.current.getBoundingClientRect()
    scrollToY(r.bottom + window.scrollY - window.innerHeight * 0.2)
  }

  const f = list[now]
  // Every pixel of scroll moves the line two: a brisk walk, not a march.
  const height = live ? `calc(100svh + ${Math.round(geo.travel * PACE)}px)` : undefined

  return (
    <div ref={root} className={cx('cl', live ? 'is-live' : 'is-swipe')} style={{ height, '--w': `${geo.w}px` }}>
      <div ref={stage} className="cl__stage">
        <svg ref={rope} className="cl__rope" aria-hidden="true">
          <path className="cl__twine" />
          <path className="cl__twist" />
        </svg>

        <ul className="cl__line" aria-label="Flyers on the line">
          {list.map((fl, i) => (
            <li key={fl.src} ref={(el) => (hangs.current[i] = el)} className="cl__hang" style={{ '--peg': BRAND[fl.brand] ?? '#e8e4dc', '--i': i }}>
              <span className="cl__peg" aria-hidden="true" />
              <button
                type="button"
                className="cl__print"
                onClick={(e) => {
                  if (moved.current) return
                  onOpen(i, e.currentTarget)
                }}
                onPointerEnter={() => nudge(i)}
                onFocus={() => bring(i)}
                onKeyDown={key(i)}
                aria-label={`${pad(i + 1)} of ${list.length}. ${fl.brand} flyer: ${fl.title}. Open it.`}
              >
                <img src={fl.src} alt="" width="900" height="1350" loading={i < 6 ? 'eager' : 'lazy'} decoding="async" draggable="false" />
                <span className="cl__shade" aria-hidden="true" />
              </button>
            </li>
          ))}
          {/* The last peg on the line is empty. */}
          <li ref={(el) => (hangs.current[list.length] = el)} className="cl__hang is-yours" style={{ '--peg': '#30d158', '--i': list.length }}>
            <span className="cl__peg" aria-hidden="true" />
            <button type="button" className="cl__print cl__blank" onClick={() => !moved.current && onEnd?.()} onFocus={() => bring(list.length)} onKeyDown={key(list.length)}>
              <span className="label">{pad(list.length + 1)}</span>
              <b>{endLabel}</b>
              <span className="cl__cta">
                Commission one <span aria-hidden="true">→</span>
              </span>
            </button>
          </li>
        </ul>

        <div className="cl__hud" aria-live="polite">
          <p className="cl__now">
            {f ? (
              <>
                <span className="label">
                  {pad(now + 1)} / {pad(list.length)} · {f.brand}
                </span>
                <b key={f.src}>{f.title}</b>
              </>
            ) : (
              <>
                <span className="label">The end of the line</span>
                <b>Room for one more.</b>
              </>
            )}
          </p>
          {live && (
            <button type="button" className="cl__skip" onClick={skip}>
              Skip the line <span aria-hidden="true">↓</span>
            </button>
          )}
          <span className="cl__bar" aria-hidden="true">
            <i />
          </span>
        </div>
      </div>
    </div>
  )
}
