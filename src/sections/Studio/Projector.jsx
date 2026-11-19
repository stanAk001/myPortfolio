import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../../hooks/useMedia'
import './Projector.css'

/*
  The studio is a projection room. A beam of light comes from behind the monitor, high on the right,
  down across the section; dust hangs in the air and only shows where the beam catches it; fine film
  grain sits over everything. At rest the light is warm tungsten and barely moves.

  Cut an ad and the projector runs: the beam flickers at film rate, swells on every beat of the music
  (120 bpm, the tempo of the cuts) and takes on the colour of the vibe being cut, so the ad lights
  the room while it plays. Then it settles back to tungsten.

  The beam is drawn small and scaled up, which is what softens its edges; the dust is drawn at full
  resolution. One canvas, paused whenever the section is off screen.
*/
const TUNGSTEN = [245, 211, 160]
const VIBE_LIGHT = {
  food: [255, 178, 92],
  fashion: [255, 143, 160],
  tech: [127, 178, 255],
  fitness: [200, 255, 106],
}
const BEAT = 0.5 // seconds, at 120 bpm
const DUST = 190

function grainTile() {
  const c = document.createElement('canvas')
  c.width = c.height = 160
  const g = c.getContext('2d')
  const img = g.createImageData(160, 160)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  g.putImageData(img, 0, 0)
  return c.toDataURL('image/png')
}

export default function Projector({ cutting = false, vibe = 'food' }) {
  const box = useRef(null)
  const canvas = useRef(null)
  const state = useRef({ cutting, vibe })
  const reduced = useReducedMotion()

  useEffect(() => {
    state.current = { cutting, vibe, since: cutting ? performance.now() : state.current.since }
  }, [cutting, vibe])

  // Film grain: one noise tile made once, shifted every frame by CSS.
  useEffect(() => {
    box.current.style.setProperty('--grain', `url(${grainTile()})`)
  }, [])

  useEffect(() => {
    const cv = canvas.current
    const ctx = cv.getContext('2d')
    const low = document.createElement('canvas')
    const lc = low.getContext('2d')
    const dpr = Math.min(1.75, window.devicePixelRatio || 1)
    let W = 0
    let H = 0
    const SCALE = 5

    const dust = Array.from({ length: DUST }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.25 + Math.random() * 0.75,
      s: Math.random() * Math.PI * 2,
    }))

    const fit = () => {
      const r = cv.getBoundingClientRect()
      W = r.width
      H = r.height
      cv.width = Math.round(W * dpr)
      cv.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      low.width = Math.max(1, Math.round(W / SCALE))
      low.height = Math.max(1, Math.round(H / SCALE))
    }

    const col = [...TUNGSTEN]
    let light = 1
    let raf = 0
    let last = 0
    let flick = 0
    let flickAt = 0

    // Where the beam comes from and where it points.
    const geometry = () => {
      const ax = W * 0.9
      const ay = -H * 0.14
      const tx = W * 0.42
      const ty = H * 1.02
      const len = Math.hypot(tx - ax, ty - ay)
      return { ax, ay, dx: (tx - ax) / len, dy: (ty - ay) / len, reach: Math.hypot(W, H) * 1.3, half: 0.36 }
    }

    function beam(g, I) {
      const { ax, ay, dx, dy, reach, half } = g
      const s = 1 / SCALE
      lc.clearRect(0, 0, low.width, low.height)
      lc.globalCompositeOperation = 'lighter'
      for (const [spread, power] of [[1, 1], [0.55, 0.7], [0.22, 0.55]]) {
        const a = half * spread
        const p1 = [ax + (dx * Math.cos(a) - dy * Math.sin(a)) * reach, ay + (dx * Math.sin(a) + dy * Math.cos(a)) * reach]
        const p2 = [ax + (dx * Math.cos(-a) - dy * Math.sin(-a)) * reach, ay + (dx * Math.sin(-a) + dy * Math.cos(-a)) * reach]
        const grad = lc.createRadialGradient(ax * s, ay * s, 0, ax * s, ay * s, reach * s * 0.95)
        const c = `${col[0] | 0} ${col[1] | 0} ${col[2] | 0}`
        grad.addColorStop(0, `rgb(${c} / ${0.34 * power * I})`)
        grad.addColorStop(0.18, `rgb(${c} / ${0.16 * power * I})`)
        grad.addColorStop(0.55, `rgb(${c} / ${0.05 * power * I})`)
        grad.addColorStop(1, `rgb(${c} / 0)`)
        lc.fillStyle = grad
        lc.beginPath()
        lc.moveTo(ax * s, ay * s)
        lc.lineTo(p1[0] * s, p1[1] * s)
        lc.lineTo(p2[0] * s, p2[1] * s)
        lc.closePath()
        lc.fill()
      }
      ctx.globalCompositeOperation = 'lighter'
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(low, 0, 0, W, H)
    }

    function motes(g, I, t, dt) {
      const { ax, ay, dx, dy, half } = g
      const c = `${Math.min(255, col[0] + 30) | 0} ${Math.min(255, col[1] + 30) | 0} ${Math.min(255, col[2] + 30) | 0}`
      for (const p of dust) {
        // Drift: a slow rise and a lazy sideways sway, with nearer specks moving more.
        p.x += (Math.sin(t * 0.21 + p.s) * 0.004 + 0.002) * dt * p.z
        p.y += (-0.006 + Math.cos(t * 0.17 + p.s * 1.7) * 0.004) * dt * p.z
        if (p.y < -0.02) p.y = 1.02
        if (p.x > 1.02) p.x = -0.02
        const px = p.x * W
        const py = p.y * H
        const vx = px - ax
        const vy = py - ay
        const d = Math.hypot(vx, vy)
        const ang = Math.acos(Math.max(-1, Math.min(1, (vx * dx + vy * dy) / d)))
        const inside = Math.max(0, 1 - ang / half)
        if (inside <= 0.02) continue
        const near = Math.max(0.25, 1 - d / (Math.hypot(W, H) * 1.1))
        const a = Math.min(1, inside * inside * near * I * (0.35 + p.z * 0.75))
        const r = 0.5 + p.z * 1.6
        ctx.fillStyle = `rgb(${c} / ${a})`
        ctx.beginPath()
        ctx.arc(px, py, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    function frame(now) {
      raf = requestAnimationFrame(frame)
      const t = now / 1000
      const dt = Math.min(0.05, (now - (last || now)) / 1000)
      last = now
      const { cutting: hot, vibe: v, since } = state.current
      // Colour: toward the vibe while cutting, back to tungsten after.
      const target = hot ? VIBE_LIGHT[v] ?? TUNGSTEN : TUNGSTEN
      for (let i = 0; i < 3; i++) col[i] += (target[i] - col[i]) * Math.min(1, dt * 2.2)
      // Brightness: a projector flicker (new value every film frame) plus a swell on each beat.
      if (now - flickAt > 1000 / 24) {
        flickAt = now
        flick = (Math.random() - 0.5) * (hot ? 0.16 : 0.035)
      }
      let pulse = 0
      if (hot && since) {
        const b = ((now - since) / 1000 / BEAT) % 1
        pulse = Math.exp(-b * 5) * 0.32
      }
      const goal = (hot ? 1.35 : 1) + pulse + flick
      light += (goal - light) * Math.min(1, dt * 12)
      ctx.globalCompositeOperation = 'source-over'
      ctx.clearRect(0, 0, W, H)
      const g = geometry()
      beam(g, light)
      ctx.globalCompositeOperation = 'lighter'
      motes(g, light, t, dt)
    }

    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(cv)
    if (reduced) {
      // Still version: the beam and the dust, not moving.
      const draw = () => {
        ctx.clearRect(0, 0, W, H)
        const g = geometry()
        beam(g, 1)
        ctx.globalCompositeOperation = 'lighter'
        motes(g, 1, 0, 0)
      }
      draw()
      const ro2 = new ResizeObserver(draw)
      ro2.observe(cv)
      return () => {
        ro.disconnect()
        ro2.disconnect()
      }
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !raf) {
        last = 0
        raf = requestAnimationFrame(frame)
      } else if (!e.isIntersecting && raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    })
    io.observe(box.current)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [reduced])

  return (
    <div ref={box} className={`pjx${cutting ? ' is-running' : ''}`} aria-hidden="true">
      <canvas ref={canvas} className="pjx__light" />
      <span className="pjx__grain" />
    </div>
  )
}
