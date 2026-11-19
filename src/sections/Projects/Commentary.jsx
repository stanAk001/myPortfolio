import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useMedia'
import { cx, pad } from '../../utils'
import './Commentary.css'

/*
  Director's commentary: while the recording plays, the decisions behind the product show up under
  it one at a time, in Akeem's own words (each project's highlights: what was decided and what it
  does for the user). The video's own time decides which note shows, so the notes move and pause
  with it. With no video running they change every few seconds; with reduced motion the first stays.
*/
const STILL_MS = 6000

export default function Commentary({ project: p, on }) {
  const box = useRef(null)
  const reduced = useReducedMotion()
  const notes = (p.highlights ?? []).filter((h) => h.title && h.benefit).slice(0, 4)
  const [k, setK] = useState(0)
  const [t, setT] = useState(0) // progress through the current note, 0..1

  useEffect(() => {
    setK(0)
    setT(0)
  }, [p.id])

  useEffect(() => {
    if (!on || notes.length < 2 || reduced) return
    let started = performance.now()
    const id = setInterval(() => {
      const v = box.current?.closest('.pj__view')?.querySelector(`.pj__layer[data-id="${p.id}"] video`)
      if (v && v.duration && !v.paused) {
        // Split the playable part of the recording evenly between the notes.
        const start = Math.min(p.video?.start ?? 0, v.duration - 1)
        const f = Math.max(0, Math.min(0.9999, (v.currentTime - start) / (v.duration - start)))
        const x = f * notes.length
        setK(Math.floor(x))
        setT(x % 1)
        started = performance.now()
        return
      }
      // No video running (poster, or paused): move on by the clock instead.
      const e = (performance.now() - started) / STILL_MS
      if (e >= 1) {
        started = performance.now()
        setK((n) => (n + 1) % notes.length)
        setT(0)
      } else setT(e)
    }, 200)
    return () => clearInterval(id)
  }, [on, notes.length, reduced, p.id, p.video?.start])

  if (!on || !notes.length) return null
  const n = notes[Math.min(k, notes.length - 1)]
  return (
    <div ref={box} className="cm" aria-live="polite">
      <p className="cm__tag">
        <span>Commentary</span>
        <span className="cm__count">
          {pad(k + 1)} / {pad(notes.length)}
        </span>
        <span className="cm__ticks" aria-hidden="true">
          {notes.map((_, i) => (
            <i key={i} className={cx(i < k && 'is-done', i === k && 'is-now')} style={i === k ? { '--t': t } : undefined} />
          ))}
        </span>
      </p>
      <p key={`${p.id}-${k}`} className="cm__line">
        <b>{n.title}.</b> {n.benefit}
      </p>
    </div>
  )
}
