import { useEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'
import { useReducedMotion } from '../../hooks/useMedia'
import { cx, hostOf } from '../../utils'
import './XRay.css'

/*
  Under the hood. A handle sits on the right edge of the screen; drag it across and, behind the line,
  the screen turns into a blueprint of itself with its stack written over it: pages, frontend, API
  calls, database, hosting. Every line comes from the project's anatomy, which is read from the live
  site's own navigation and requests, so none of it is made up. The layers appear one by one as the
  line moves.

  The handle is a slider: drag it, or focus it and use the arrow keys (Home closes, End opens).
*/
const LABEL = { interface: 'Pages', frontend: 'Frontend', api: 'API', data: 'Data', hosting: 'Hosting' }
let hinted = false // the grip shows itself once per visit, not on every project

export default function XRay({ project: p, poster }) {
  const box = useRef(null)
  const grip = useRef(null)
  const reduced = useReducedMotion()
  const [x, setX] = useState(1) // 1 = closed (grip at the right edge), 0 = fully open
  const drag = useRef(null)
  const hint = useRef(null)
  const layers = (p.anatomy ?? []).filter((l) => LABEL[l.id])
  const open = 1 - x

  // Reset to closed for every new project.
  useEffect(() => setX(1), [p.id])

  // Once per visit the handle nudges in and back so it's obvious you can drag it.
  useEffect(() => {
    if (reduced || hinted) return
    const el = box.current
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || hinted) return
      hinted = true
      io.disconnect()
      const s = { v: 1 }
      hint.current = gsap
        .timeline({ delay: 1.4 })
        .to(s, { v: 0.86, duration: 0.55, ease: 'power2.out', onUpdate: () => setX(s.v) })
        .to(s, { v: 1, duration: 0.7, ease: 'power3.inOut', onUpdate: () => setX(s.v) }, '+=0.35')
    }, { threshold: 0.6 })
    io.observe(el)
    return () => {
      io.disconnect()
      hint.current?.kill()
    }
  }, [reduced])

  // As soon as someone grabs the handle (mouse or keyboard), stop the hint.
  const take = () => {
    hint.current?.kill()
    hint.current = null
  }

  const at = (clientX) => {
    const b = box.current.getBoundingClientRect()
    return Math.min(1, Math.max(0, (clientX - b.left) / b.width))
  }
  const down = (e) => {
    e.preventDefault()
    e.stopPropagation()
    take()
    drag.current = { id: e.pointerId }
    try {
      grip.current.setPointerCapture(e.pointerId)
    } catch {
      // No pointer capture (rare), but moves over the handle still work.
    }
    setX(at(e.clientX))
  }
  const move = (e) => drag.current?.id === e.pointerId && setX(at(e.clientX))
  const up = (e) => {
    if (drag.current?.id !== e.pointerId) return
    drag.current = null
    // Let go near an end and it snaps there.
    setX((v) => (v > 0.94 ? 1 : v < 0.06 ? 0 : v))
  }
  const key = (e) => {
    const step = { ArrowLeft: -0.1, ArrowDown: -0.1, ArrowRight: 0.1, ArrowUp: 0.1 }[e.key]
    if (e.key === 'Home') setX(1)
    else if (e.key === 'End') setX(0)
    else if (step) setX((v) => Math.min(1, Math.max(0, v + step)))
    else return
    take()
    e.preventDefault()
    e.stopPropagation()
  }

  if (!layers.length) return null
  return (
    <div ref={box} className={cx('xr', open > 0.02 && 'is-open', drag.current && 'is-dragging')} style={{ '--x': x, '--o': open }}>
      <div className="xr__under" aria-hidden={open < 0.05 ? 'true' : undefined}>
        {poster && <img className="xr__print" src={poster} alt="" decoding="async" />}
        <div className="xr__sheet">
          <p className="xr__head">
            <span>Under the hood</span>
            <span>{p.url ?? hostOf(p.liveUrl)}</span>
          </p>
          <ol className="xr__stack">
            {layers.map((l, k) => (
              <li key={l.id} style={{ '--k': k, '--n': layers.length }}>
                <span className="xr__name">{LABEL[l.id]}</span>
                <span className="xr__vals">
                  {l.evidence.slice(0, l.id === 'api' ? 4 : 5).map((e) => (
                    <code key={e}>{e}</code>
                  ))}
                </span>
              </li>
            ))}
          </ol>
          <p className="xr__src">Read from the live site’s own navigation and requests.</p>
        </div>
      </div>
      <span className="xr__line" aria-hidden="true" />
      <button
        ref={grip}
        type="button"
        className="xr__grip"
        data-cursor="drag"
        role="slider"
        aria-label={`See how ${p.title} is built: drag across the screen`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(open * 100)}
        aria-valuetext={`${Math.round(open * 100)}% open`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="xr__tab">
          <i aria-hidden="true">‹</i>
          <b>X-ray</b>
        </span>
      </button>
    </div>
  )
}
