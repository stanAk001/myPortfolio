import { useEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'
import { cx } from '../../utils'
import { NODES } from './scenarios'

/*
  The request's path drawn like a transit map: the stack as stations, with the same dot-on-a-line
  as the projects navigator carrying the request out on one track and back on the other. Each leg
  stays lit with its timing, and the caption explains what's happening in plain words.
*/
const STOPS = {
  browser: { name: 'You', tech: 'Your browser' },
  react: { name: 'React', tech: 'React · Vite' },
  api: { name: 'Express', tech: 'Node.js · Express' },
  db: { name: 'PostgreSQL', tech: 'via Prisma' },
  pay: { name: 'Payments', tech: 'Payment provider' },
  media: { name: 'Cloudinary', tech: 'Image CDN' },
}
const LANE = 6 // how far each track sits from the centre, in px

// Station positions: a straight run to the server, then a fork to whatever this click needs.
function layout(hops) {
  const ends = [...new Set(hops.flatMap((h) => [h.from, h.to]))].filter((id) => !['browser', 'react', 'api'].includes(id)).filter((id) => NODES[id])
  const at = { browser: { x: 5, y: 50 }, react: { x: 31, y: 50 }, api: { x: 60, y: 50 } }
  ends.forEach((id, i) => {
    at[id] = { x: 93, y: ends.length === 1 ? 50 : i === 0 ? 16 : 68 }
  })
  return at
}

export default function Relay({ scenario, step, hopTime, reduced }) {
  const dot = useRef(null)
  const map = useRef(null)
  const [size, setSize] = useState({ w: 1000, h: 196 })
  const hops = scenario.hops
  const at = layout(hops)
  const done = step >= hops.length
  const total = hops.reduce((s, h) => s + h.ms, 0)
  const elapsed = done ? total : step < 0 ? 0 : hops.slice(0, step + 1).reduce((s, h) => s + h.ms, 0)
  const isBack = (h) => at[h.from].x > at[h.to].x
  const lane = (h) => (isBack(h) ? LANE : -LANE)
  const now = step >= 0 && !done ? hops[step] : null

  // Lines are drawn in real pixels so every stroke stays crisp at any width.
  useEffect(() => {
    const el = map.current
    const fit = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const X = (id) => (at[id].x / 100) * size.w
  const Y = (id, off = 0) => (at[id].y / 100) * size.h + off

  // The dot rides the current leg and rests at home between clicks.
  useEffect(() => {
    const el = dot.current
    if (!el) return
    gsap.killTweensOf(el)
    if (!now || reduced) {
      gsap.set(el, { left: X('browser'), top: Y('browser') })
      return
    }
    const y = lane(now)
    gsap.fromTo(
      el,
      { left: X(now.from), top: Y(now.from, y) },
      { left: X(now.to), top: Y(now.to, y), duration: hopTime(now) * 0.9, ease: 'power2.inOut' },
    )
    // A step belongs to one scenario; `at` and `lane` come from that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, scenario.id, reduced, size])

  const rails = Object.keys(at)
    .filter((id) => id !== 'browser')
    .map((id) => [id === 'react' ? 'browser' : id === 'api' ? 'react' : 'api', id])

  return (
    <div className="ry" aria-hidden="true">
      <div ref={map} className="ry__map">
        <svg viewBox={`0 0 ${size.w} ${size.h}`} focusable="false">
          {rails.map(([a, b]) =>
            [-LANE, LANE].map((y) => <line key={`${a}${b}${y}`} className="ry__rail" x1={X(a)} x2={X(b)} y1={Y(a, y)} y2={Y(b, y)} />),
          )}
          {hops.map((h, i) => (
            <line
              key={`${scenario.id}-${i}`}
              pathLength="1"
              className={cx('ry__leg', isBack(h) && 'is-back', i <= step && 'is-lit')}
              style={{ transitionDuration: reduced ? '0s' : `${hopTime(h) * 0.9}s` }}
              x1={X(h.from)}
              x2={X(h.to)}
              y1={Y(h.from, lane(h))}
              y2={Y(h.to, lane(h))}
            />
          ))}
        </svg>

        {hops.map((h, i) => {
          const far = isBack(h) ? h.from : h.to
          const near = isBack(h) ? h.to : h.from
          const t = at[near].y === at[far].y ? 0.5 : 0.72
          return (
          <span
            key={`${scenario.id}-ms-${i}`}
            className={cx('ry__ms', isBack(h) ? 'is-back' : 'is-out', t !== 0.5 && 'is-fork', i < step + (done ? 1 : 0) && 'is-on')}
            style={{ left: `${at[near].x + (at[far].x - at[near].x) * t}%`, top: `${at[near].y + (at[far].y - at[near].y) * t}%` }}
          >
            {h.ms}ms
          </span>
          )
        })}

        {Object.entries(at).map(([id, p]) => {
          const here = now ? now.to === id : done && id === 'browser'
          return (
            <div key={id} className={cx('ry__stop', here && 'is-here', p.x > 90 && 'is-end', p.x < 10 && 'is-start')} style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              <i />
              <b>{STOPS[id].name}</b>
              <small>{STOPS[id].tech}</small>
            </div>
          )
        })}

        <span ref={dot} className={cx('ry__dot', !now && 'is-rest')} />
      </div>

      <div className="ry__say">
        <p key={`${scenario.id}-${step}`} className="ry__line">
          {done ? 'There and back.' : now ? now.say : 'Waiting for your click.'}
        </p>
        <p className="ry__clock">
          <span>
            <b>{elapsed}</b> ms
          </span>
          <small>Simulated with typical timings</small>
        </p>
      </div>
    </div>
  )
}
