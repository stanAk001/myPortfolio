import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../../hooks/useMedia'
import './Board.css'

/*
  Behind "who I am" and the terminal, the background is a display: a fine grid of ink dots, like an
  LED board printed on paper, driven by the terminal next to it. Along the bottom is the board
  itself. Idle, it says "type help" with a blinking block; as you type in the terminal your letters
  show up full width; when the terminal answers, the answer scrolls across (a live ping shows in
  green). The pointer pushes the dots apart as it passes, like a magnet through iron filings.

  It only listens to the real terminal (input and output) and never changes it. One canvas; the
  letters use the site's display font, sampled onto the dot grid.
*/
const IDLE = 'type help'
const HOLD_MS = 9000

function summarise(lines) {
  // The last command's answer: its first few lines joined for the board.
  const out = lines.map((l) => l.text.trim()).filter(Boolean)
  if (!out.length) return null
  const ping = out.join(' ').match(/time=(\d+)ms/)
  if (ping) return { text: `${ping[1]}ms · live`, tone: 'ok' }
  const tone = lines.some((l) => l.tone === 'err') ? 'err' : lines.some((l) => l.tone === 'ok') ? 'ok' : 'out'
  return { text: out.slice(0, 3).join('  ·  ').toLowerCase(), tone }
}

export default function Board() {
  const box = useRef(null)
  const canvas = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = box.current
    const cv = canvas.current
    const ctx = cv.getContext('2d')
    const mask = document.createElement('canvas')
    const mc = mask.getContext('2d', { willReadFrequently: true })
    const dpr = Math.min(2, window.devicePixelRatio || 1)

    let W = 0
    let H = 0
    let pitch = 10
    let cols = 0
    let rows = 0
    let band = 0 // rows of the board proper, at the foot
    let lit = new Float32Array(0) // per dot of the board: 0..1 shown
    let want = new Uint8Array(0) // per dot of the board: lit or not, for the current message
    let changedAt = 0
    let ink = '18 18 18'
    let font = 'sans-serif'
    let msg = { text: IDLE, tone: 'idle', cursor: true }
    let shift = 0 // marquee offset, in columns
    let textCols = 0
    let px = -9999
    let py = -9999

    const readStyle = () => {
      const cs = getComputedStyle(el)
      const m = cs.color.match(/\d+(\.\d+)?/g)
      if (m) ink = `${m[0]} ${m[1]} ${m[2]}`
      font = getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim() || 'sans-serif'
    }

    // Draw the message onto the board's dot grid.
    const compose = (blinkOn) => {
      if (!cols || !band) return
      const size = Math.round(band * 0.82)
      mc.font = `800 ${size}px ${font}`
      const text = msg.text
      const tw = Math.ceil(mc.measureText(text).width)
      const block = msg.cursor ? Math.round(size * 0.5) : 0
      textCols = tw + (block ? block + Math.round(size * 0.18) : 0)
      const fits = textCols <= cols - 4
      mask.width = Math.max(cols, textCols + cols)
      mask.height = band
      mc.font = `800 ${size}px ${font}`
      mc.textBaseline = 'middle'
      mc.fillStyle = '#000'
      const x0 = fits ? 2 : 0
      mc.fillText(text, x0, band / 2 + size * 0.04)
      if (block && blinkOn) mc.fillRect(x0 + tw + Math.round(size * 0.18), Math.round(band / 2 - size * 0.36), block, Math.round(size * 0.72))
      if (!fits) {
        // Marquee: text, gap, text again, so it loops.
        mc.fillText(text, textCols + Math.round(cols * 0.35), band / 2 + size * 0.04)
      }
      const off = fits ? 0 : Math.floor(shift) % (textCols + Math.round(cols * 0.35))
      const data = mc.getImageData(off, 0, cols, band).data
      for (let r = 0; r < band; r++) {
        for (let c = 0; c < cols; c++) want[r * cols + c] = data[(r * cols + c) * 4 + 3] > 110 ? 1 : 0
      }
    }

    const setMessage = (m) => {
      if (m.text === msg.text && m.tone === msg.tone && m.cursor === msg.cursor) return
      msg = m
      shift = 0
      changedAt = performance.now()
    }

    const fit = () => {
      const r = cv.getBoundingClientRect()
      W = r.width
      H = r.height
      cv.width = Math.round(W * dpr)
      cv.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      pitch = W < 760 ? 8 : 10
      cols = Math.floor(W / pitch)
      rows = Math.floor(H / pitch)
      // Same height as --board-band in the CSS: clamp(150px, 22vh, 220px), 120px on a phone.
      const bandPx = W < 760 ? 120 : Math.min(220, Math.max(150, innerHeight * 0.22))
      band = Math.max(9, Math.floor(bandPx / pitch))
      lit = new Float32Array(cols * band)
      want = new Uint8Array(cols * band)
      readStyle()
      compose(true)
    }

    // Listen to the real terminal next to it.
    const term = el.closest('.ab__after')?.querySelector('.term')
    const input = term?.querySelector('input')
    const screen = term?.querySelector('.term__screen')
    let answer = null
    let answeredAt = 0
    const mo = screen
      ? new MutationObserver(() => {
          const ps = [...screen.querySelectorAll('.term__line')]
          let i = ps.length - 1
          while (i >= 0 && !ps[i].classList.contains('term__line--cmd')) i--
          const after = ps.slice(i + 1).map((p) => ({ text: p.textContent, tone: (p.className.match(/term__line--(\w+)/) || [])[1] }))
          const s = summarise(after)
          if (s) {
            answer = s
            answeredAt = performance.now()
          }
        })
      : null
    mo?.observe(screen, { childList: true, subtree: true, characterData: true })

    const move = (e) => {
      const r = cv.getBoundingClientRect()
      px = e.clientX - r.left
      py = e.clientY - r.top
    }
    const leave = () => {
      px = -9999
      py = -9999
    }
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)

    let raf = 0
    let last = 0
    let styleAt = 0
    function frame(now) {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - (last || now)) / 1000)
      last = now
      if (now - styleAt > 600) {
        styleAt = now
        readStyle()
      }
      // What the board should say.
      const typed = input?.value ?? ''
      if (typed) setMessage({ text: typed.toLowerCase(), tone: 'typing', cursor: true })
      else if (answer && now - answeredAt < HOLD_MS) setMessage({ text: answer.text, tone: answer.tone, cursor: false })
      else setMessage({ text: IDLE, tone: 'idle', cursor: true })
      if (textCols > cols - 4) shift += dt * 26
      compose(Math.floor(now / 530) % 2 === 0)

      ctx.clearRect(0, 0, W, H)
      const top = rows - band
      const R = 120
      const paths = [new Path2D(), new Path2D(), new Path2D()]
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let x = c * pitch + pitch / 2
          let y = r * pitch + pitch / 2
          let v = 0
          if (r >= top) {
            const k = (r - top) * cols + c
            // Wipe left to right whenever the message changes.
            const ready = now - changedAt > c * 4
            if (ready) lit[k] += ((want[k] ? 1 : 0) - lit[k]) * Math.min(1, dt * 14)
            v = lit[k]
          }
          // The pointer pushes the dots apart.
          const ddx = x - px
          const ddy = y - py
          const d2 = ddx * ddx + ddy * ddy
          let near = 0
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1
            near = (1 - d / R) ** 2
            x += (ddx / d) * near * 14
            y += (ddy / d) * near * 14
          }
          const rad = 0.75 + v * 2.1 + near * 0.9
          const bucket = v > 0.5 ? 2 : near > 0.15 || v > 0.15 ? 1 : 0
          paths[bucket].moveTo(x + rad, y)
          paths[bucket].arc(x, y, rad, 0, Math.PI * 2)
        }
      }
      const tone = msg.tone === 'ok' ? '43 182 115' : ink
      ctx.fillStyle = `rgb(${ink} / 0.11)`
      ctx.fill(paths[0])
      ctx.fillStyle = `rgb(${ink} / 0.3)`
      ctx.fill(paths[1])
      ctx.fillStyle = `rgb(${tone} / ${msg.tone === 'idle' ? 0.5 : 0.8})`
      ctx.fill(paths[2])
    }

    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(cv)
    document.fonts?.ready.then(fit)

    if (reduced) {
      // A still board that tells you what to do.
      lit.fill(0)
      compose(true)
      for (let i = 0; i < lit.length; i++) lit[i] = want[i]
      last = performance.now()
      changedAt = -1e9
      frame(performance.now())
      cancelAnimationFrame(raf)
      return () => {
        ro.disconnect()
        mo?.disconnect()
        window.removeEventListener('pointermove', move)
        document.removeEventListener('pointerleave', leave)
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
    io.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mo?.disconnect()
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
    }
  }, [reduced])

  return (
    <div ref={box} className="bd" aria-hidden="true">
      <canvas ref={canvas} className="bd__dots" />
    </div>
  )
}
