import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../../lib/gsap'
import { useReducedMotion } from '../../hooks/useMedia'
import './Marquee.css'

const WORDS = ['Design', 'Engineering', 'Shipping', 'Iterating']
const STACK = ['React', 'Node.js', 'Express', 'PostgreSQL', 'Prisma', 'REST APIs', 'Authentication', 'Payments', 'Cloudinary', 'Vercel']

/*
  Two bands drifting opposite ways. Scrolling speeds them up and tilts the type into the motion,
  then they settle back to a slow drift.
*/
export default function Marquee() {
  const root = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    const tracks = [...root.current.querySelectorAll('.mq__track')]
    const state = tracks.map(() => ({ x: 0 }))
    const skewTo = gsap.quickTo(tracks, 'skewX', { duration: 0.6, ease: 'power3' })
    let boost = 0
    let visible = false

    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => (visible = self.isActive),
      onUpdate: (self) => {
        const v = self.getVelocity()
        boost = gsap.utils.clamp(-30, 30, v / 120)
        skewTo(gsap.utils.clamp(-12, 12, v / -300))
      },
    })

    const tick = (_, delta) => {
      if (!visible) return
      boost *= 0.92
      if (Math.abs(boost) < 0.4) skewTo(0)
      tracks.forEach((track, i) => {
        const dir = i % 2 ? 1 : -1
        const half = track.scrollWidth / 2
        state[i].x += dir * (0.6 + Math.abs(boost)) * (delta / 16)
        // Wrap at half the track. The content is duplicated so the seam doesn't show.
        state[i].x = ((state[i].x % half) - half) % half
        gsap.set(track, { x: state[i].x })
      })
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      st.kill()
    }
  }, [reduced])

  const band = (
    <>
      {WORDS.map((w, i) => (
        <span key={w} className={i % 2 ? 'mq__word mq__word--outline' : 'mq__word'}>
          {i % 2 ? <em>{w}</em> : w}
          <span className="mq__star" aria-hidden="true">
            ✳
          </span>
        </span>
      ))}
    </>
  )

  const ticker = (
    <>
      {STACK.map((s) => (
        <span key={s} className="mq__tick">
          {s}
          <i aria-hidden="true">/</i>
        </span>
      ))}
    </>
  )

  return (
    <section ref={root} className="mq theme-dark" aria-label="Design, engineering, shipping, iterating" data-component="Marquee">
      <div className="mq__row" aria-hidden="true">
        <div className="mq__track">
          {band}
          {band}
        </div>
      </div>
      <div className="mq__row mq__row--ticker" aria-hidden="true">
        <div className="mq__track">
          {/* Even number of copies so the loop wraps at half the track width. */}
          {ticker}
          {ticker}
          {ticker}
          {ticker}
        </div>
      </div>
    </section>
  )
}
