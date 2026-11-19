import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useMedia'
import { cx, hostOf } from '../../utils'

/*
  The headline doubles as a window onto the work. A canvas behind it paints a slow, zoomed-in,
  drifting crop of whatever recording is playing next to it (the same <video>, so no extra download
  and it can't go out of sync). The headline sits on top as a knockout layer, paper with ink
  letters, blended so the footage only shows through the letters. The words are still real text.

  The three verbs act out what they mean, once each on arrival and again on hover: "design" gets
  framed like a selected layer, "build" retypes itself, "ship" gets a deploy receipt for the
  product on screen.
*/
const VERBS = ['design', 'build', 'ship']
const FX_MS = 1500

export default function Headline({ project, film = false }) {
  const box = useRef(null)
  const canvas = useRef(null)
  const words = useRef({})
  const reduced = useReducedMotion()
  const [lit, setLit] = useState(false) // footage has started pouring in
  const [verb, setVerb] = useState(null)
  const [rects, setRects] = useState({})
  const host = project?.url ?? (project?.liveUrl && hostOf(project.liveUrl))

  // Paint the footage into the letters while the headline is visible.
  useEffect(() => {
    if (!film) {
      const id = setTimeout(() => setLit(true), 1600)
      return () => clearTimeout(id)
    }
    const cv = canvas.current
    const ctx = cv.getContext('2d')
    let raf = 0
    let seen = true
    let last = 0
    const dpr = Math.min(1.5, window.devicePixelRatio || 1)
    const fit = () => {
      const r = cv.getBoundingClientRect()
      cv.width = Math.round(r.width * dpr)
      cv.height = Math.round(r.height * dpr)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(cv)
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting
      if (seen && !raf) raf = requestAnimationFrame(draw)
    })
    io.observe(cv)

    function source() {
      const v = document.querySelector('.rl__view .rl__clip.is-on video')
      if (v && v.readyState >= 2 && v.videoWidth) return [v, v.videoWidth, v.videoHeight]
      const img = document.querySelector('.rl__view .rl__clip.is-on img')
      if (img?.complete && img.naturalWidth) return [img, img.naturalWidth, img.naturalHeight]
      return null
    }

    function draw(now) {
      raf = 0
      if (!seen) return
      if (now - last > 33) {
        last = now
        const src = source()
        if (src) {
          const [el, sw, sh] = src
          const W = cv.width
          const H = cv.height
          // A close-up: about 55% of the frame, drifting slowly, covering the whole headline.
          const t = reduced ? 0 : now / 1000
          const zoom = 0.55
          const cw = sw * zoom
          const ch = Math.min(sh, cw * (H / W))
          const x = (sw - cw) * (0.5 + 0.45 * Math.sin(t / 7))
          const y = (sh - ch) * (0.5 + 0.45 * Math.cos(t / 9))
          ctx.globalCompositeOperation = 'source-over'
          ctx.drawImage(el, x, y, cw, ch, 0, 0, W, H)
          // Keep the letters readable: darker in light mode, lighter in dark mode.
          const dark = document.documentElement.dataset.theme === 'dark'
          ctx.fillStyle = dark ? 'rgba(232, 228, 220, 0.38)' : 'rgba(18, 18, 18, 0.5)'
          ctx.fillRect(0, 0, W, H)
          if (!lit) setLit(true)
        }
      }
      if (!reduced || !lit) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [reduced, lit, film])

  // Where each verb is, for the effects drawn over the headline.
  useLayoutEffect(() => {
    const measure = () => {
      const b = box.current.getBoundingClientRect()
      const out = {}
      for (const v of [...VERBS, 'end']) {
        const r = words.current[v]?.getBoundingClientRect()
        if (r) out[v] = { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height }
      }
      setRects(out)
    }
    measure()
    document.fonts?.ready.then(measure)
    const ro = new ResizeObserver(measure)
    ro.observe(box.current)
    return () => ro.disconnect()
  }, [])

  // On arrival the verbs play one after another, once the footage is in.
  useEffect(() => {
    if (!lit || reduced) return
    const ids = VERBS.map((v, i) => setTimeout(() => setVerb(v), 900 + i * FX_MS))
    ids.push(setTimeout(() => setVerb(null), 900 + VERBS.length * FX_MS))
    return () => ids.forEach(clearTimeout)
  }, [lit, reduced])

  const play = (v) => {
    if (!reduced) setVerb(v)
  }
  const Verb = ({ v, children }) => (
    <span ref={(el) => (words.current[v] = el)} className={cx('hl__verb', `is-${v}`, verb === v && 'is-on')} onPointerEnter={() => play(v)}>
      {children ?? v}
    </span>
  )
  const r = verb && rects[verb]

  return (
    <div ref={box} className={cx('hl', lit && 'is-lit', !film && 'is-solid')}>
      <canvas ref={canvas} className="hl__film" aria-hidden="true" />
      <h1 className="hl__ko ds__title">
        I <Verb v="design" />, <Verb v="build" />
        <br />
        and <Verb v="ship" /> web <span ref={(el) => (words.current.end = el)}>products.</span>
      </h1>
      {verb === 'ship' && rects.end && (
        // The deploy receipt goes in the empty space after the sentence, never over a word.
        <em className="hl__receipt" style={{ left: rects.end.x + rects.end.w + 14, top: rects.end.y + rects.end.h / 2 }} aria-hidden="true">
          ✓ Deployed<span> — {host}</span>
        </em>
      )}
      {r && (
        <span key={verb} className={`hl__fx is-${verb}`} style={{ left: r.x, top: r.y, width: r.w, height: r.h }} aria-hidden="true">
          {verb === 'design' && (
            <>
              <em>Frame · {Math.round(r.w)} × {Math.round(r.h)}</em>
              <b />
              <b />
              <b />
              <b />
            </>
          )}
          {verb === 'build' && <i className="hl__caret" />}
        </span>
      )}
    </div>
  )
}
