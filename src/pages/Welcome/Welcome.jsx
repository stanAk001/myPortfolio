import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'
import { markReady } from '../../lib/loaded'
import { useMediaQuery, useReducedMotion } from '../../hooks/useMedia'
import { cx } from '../../utils'
import { setVisitorName, useVisitorName } from '../../lib/visitor'
import desk from '../../assets/akeem-desk.jpg'
import './Welcome.css'

/*
  The welcome page. The visitor lands in a dark room and their pointer (or finger) is a warm beam of
  light. Moving it finds things on the wall: the name pressed into the plaster, a few pinned notes,
  a framed photo, and a light switch with a small glowing light. Raised things cast shadows away
  from the beam so the wall looks like a real surface.

  Flipping the switch clicks, the tubes flicker and hum, the lights come up, and you're in the
  portfolio. Nothing is hidden or required: the light starts on the switch, the switch glows
  wherever the beam is, Skip is always there, the switch is a real button (Tab reaches it), and with
  reduced motion the room is just dim. Returning visitors skip the room (App sends them to /work).
*/
const R_DESK = 340

/* Switch sounds: a sharp click and a low thump, then the tubes ticking and humming. */
let audio = null
function sfx(kind) {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)()
    const ctx = audio
    if (ctx.state === 'suspended') ctx.resume()
    const t = ctx.currentTime
    const out = ctx.createGain()
    out.gain.value = 0.55
    out.connect(ctx.destination)
    const burst = (at, len, freq, peak) => {
      const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate)
      const d = b.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3
      const s = ctx.createBufferSource()
      s.buffer = b
      const f = ctx.createBiquadFilter()
      f.type = 'highpass'
      f.frequency.value = freq
      const g = ctx.createGain()
      g.gain.value = peak
      s.connect(f).connect(g).connect(out)
      s.start(at)
    }
    if (kind === 'click') {
      burst(t, 0.03, 1800, 0.9)
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.setValueAtTime(140, t)
      o.frequency.exponentialRampToValueAtTime(60, t + 0.08)
      g.gain.setValueAtTime(0.5, t)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
      o.connect(g).connect(out)
      o.start(t)
      o.stop(t + 0.14)
    }
    if (kind === 'tubes') {
      ;[0.08, 0.2, 0.33, 0.5].forEach((d, i) => burst(t + d, 0.012, 3000, 0.35 - i * 0.05))
      for (const [f, v] of [[100, 0.05], [200, 0.02], [300, 0.008]]) {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.frequency.value = f
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(v, t + 0.35)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2)
        o.connect(g).connect(out)
        o.start(t)
        o.stop(t + 2.3)
      }
    }
  } catch {
    // No audio, but the lights still come on.
  }
}

const read = (k) => {
  try {
    return localStorage.getItem(k) === '1'
  } catch {
    return false
  }
}

export default function Welcome({ exiting = false, onEnter, onGone }) {
  const root = useRef(null)
  const sw = useRef(null)
  const reduced = useReducedMotion()
  const phone = useMediaQuery('(max-width: 760px)')
  const [sound, setSound] = useState(() => read('pj-sound'))
  const [on, setOn] = useState(false) // the switch is flipped
  const [found, setFound] = useState(true) // the beam has reached the switch (it starts there)
  const target = useRef({ x: 0, y: 0 })
  const pin = useRef(false) // keyboard focus holds the light on the switch
  const named = useVisitorName()
  const [name, setName] = useState(named)

  // The beam eases toward the pointer, and every raised thing casts its shadow away from it.
  useEffect(() => {
    const el = root.current
    if (reduced) return
    // Start the light on the switch so the way in is the first thing people see.
    const s0 = sw.current?.getBoundingClientRect()
    let x = s0 ? s0.left + s0.width / 2 : innerWidth * 0.5
    let y = s0 ? s0.top + s0.height / 2 : innerHeight * 0.5
    target.current = { x, y }
    const raised = [...el.querySelectorAll('[data-raised]')]
    const radius = phone ? 190 : R_DESK
    let raf = 0
    let seen = false
    const tick = () => {
      raf = requestAnimationFrame(tick)
      x += (target.current.x - x) * 0.12
      y += (target.current.y - y) * 0.12
      el.style.setProperty('--x', `${x.toFixed(1)}px`)
      el.style.setProperty('--y', `${y.toFixed(1)}px`)
      for (const r of raised) {
        const b = r.getBoundingClientRect()
        const dx = b.left + b.width / 2 - x
        const dy = b.top + b.height / 2 - y
        const d = Math.hypot(dx, dy) || 1
        const k = Math.min(1, d / 600)
        r.style.setProperty('--sx', ((dx / d) * (2 + k * 10)).toFixed(2))
        r.style.setProperty('--sy', ((dy / d) * (2 + k * 10)).toFixed(2))
        r.style.setProperty('--lit', Math.max(0, Math.min(1, 1.15 - d / (radius * 1.05))).toFixed(3))
      }
      const s = sw.current?.getBoundingClientRect()
      if (s && !seen && Math.hypot(s.left + s.width / 2 - x, s.top + s.height / 2 - y) < 120) {
        seen = true
        setFound(true)
      }
    }
    raf = requestAnimationFrame(tick)
    const move = (e) => {
      if (pin.current) return
      target.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', move, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', move)
    }
  }, [reduced, phone])

  // Click, the tubes flicker on, the room lights up, and that's the portfolio.
  const flip = useCallback(() => {
    if (on) return
    setVisitorName(name)
    setOn(true)
    if (sound) {
      sfx('click')
      setTimeout(() => sfx('tubes'), 120)
    }
    const dark = root.current.querySelector('.lo__dark')
    if (reduced) {
      gsap.to(dark, { opacity: 0, duration: 0.3, onComplete: () => onEnter() })
      return
    }
    gsap
      .timeline({ onComplete: () => onEnter() })
      .set(dark, { opacity: 1 }, 0.12)
      .to(dark, { opacity: 0.15, duration: 0.05 }, 0.2)
      .to(dark, { opacity: 0.92, duration: 0.06 }, 0.27)
      .to(dark, { opacity: 0.05, duration: 0.05 }, 0.38)
      .to(dark, { opacity: 0.6, duration: 0.08 }, 0.46)
      .to(dark, { opacity: 0, duration: 0.35, ease: 'power2.out' }, 0.56)
      .to(root.current.querySelector('.lo__warm'), { opacity: 0, duration: 0.4 }, 0.56)
      .to({}, { duration: 0.5 })
  }, [on, sound, reduced, onEnter, name])

  // On the way out the lit room fades and the portfolio's first screen plays in.
  useEffect(() => {
    if (!exiting) return
    markReady()
    const tw = gsap.to(root.current, { opacity: 0, scale: reduced ? 1 : 1.03, duration: reduced ? 0.3 : 0.7, ease: 'power2.inOut', onComplete: onGone })
    return () => tw.kill()
  }, [exiting, reduced, onGone])

  const toggleSound = () => {
    const next = !sound
    setSound(next)
    try {
      localStorage.setItem('pj-sound', next ? '1' : '0')
    } catch {
      // Storage blocked: only for this visit.
    }
  }

  const aim = () => {
    const s = sw.current?.getBoundingClientRect()
    if (!s) return
    pin.current = true
    target.current = { x: s.left + s.width / 2, y: s.top + s.height / 2 }
  }

  return (
    <div ref={root} className={cx('lo', on && 'is-on', reduced && 'is-still', phone && 'is-phone')} inert={exiting || undefined} style={{ '--r': `${phone ? 190 : R_DESK}px` }}>
      {/* The wall, drawn as it looks when lit. */}
      <div className="lo__wall">
        <h1 className="lo__name" data-raised>
          Akeem
        </h1>

        <p className="lo__note is-a" data-raised>
          I design, build
          <br />
          and ship web products.
        </p>
        <p className="lo__note is-b" data-raised>
          PostgreSQL, Express,
          <br />
          React, Node.
        </p>
        <p className="lo__note is-c" data-raised>
          Five things I built,
          <br />
          all out there in use.
        </p>

        <figure className="lo__frame" data-raised>
          <img src={desk} alt="" decoding="async" />
          <figcaption>where it gets built</figcaption>
        </figure>
      </div>

      {/* The dark, with a hole where the beam falls and a warm tint inside it. */}
      <span className="lo__dark" aria-hidden="true" />
      <span className="lo__warm" aria-hidden="true" />

      {/* A card on the wall, found with the light: what should I call you? Optional. */}
      <form className={cx('lo__card', named && 'is-named')} data-raised onSubmit={(e) => { e.preventDefault(); sw.current?.focus() }}>
        <label htmlFor="lo-name">{named ? `Hi, ${named}.` : 'Before you come in, what should I call you?'}</label>
        <input
          id="lo-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setVisitorName(name)}
          placeholder="your first name"
          autoComplete="given-name"
          maxLength={24}
          spellCheck={false}
        />
      </form>

      {/* The switch sits above the dark, so its little light is always visible. */}
      <div className={cx('lo__switch', found && 'is-found')} data-raised>
        <button ref={sw} type="button" onClick={flip} onFocus={aim} onBlur={() => (pin.current = false)} aria-pressed={on} aria-label="Turn the lights on and come in">
          <span className="lo__plate">
            <span className="lo__rocker" />
          </span>
          <i className="lo__led" aria-hidden="true" />
        </button>
        <span className="lo__hint">{on ? (named ? `Welcome in, ${named}.` : 'Welcome in.') : found ? 'Flip it.' : ''}</span>
      </div>

      <header className="lo__top">
        <span className="lo__tag">Akeem — full-stack PERN developer</span>
        <span className="lo__tools">
          <button type="button" onClick={toggleSound} aria-pressed={sound}>
            Sound {sound ? 'on' : 'off'}
          </button>
          <button type="button" onClick={() => onEnter()}>
            Skip →
          </button>
        </span>
      </header>
      <p className="lo__how" aria-hidden="true">
        {reduced ? 'Turn on the lights to come in.' : phone ? 'Tap the switch to come in, or drag the light around first.' : 'Flip the switch to come in, or look around first.'}
      </p>
    </div>
  )
}
