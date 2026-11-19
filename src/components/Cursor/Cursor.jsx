import { useEffect, useRef, useState } from 'react'
import { useFinePointer } from '../../hooks/useMedia'
import './Cursor.css'

/*
  The system cursor always stays; nothing beats it for speed. This only adds a small label next to
  it over things worth labelling (projects, external links, the drag handle). Position is set on
  every pointer move with no easing, so it never lags.
*/
const LABELS = { view: 'View', play: 'Play', open: 'Visit website ↗', drag: 'Drag ↔', explore: 'Explore project ↗', build: 'Let’s build ↗' }
// Buttons that lean slightly toward the cursor.
const MAGNETS = '.g-btn, .qc__door, .nav__cta, .pj__action--main, .egg__red, .ds__go, .ct__make, .pj__explore'

function kindFor(target) {
  const el = target?.closest?.('[data-cursor], a[target="_blank"]')
  if (!el) return null
  if (el.dataset.cursor) return LABELS[el.dataset.cursor] ? el.dataset.cursor : null
  return 'open'
}

export default function Cursor() {
  const fine = useFinePointer()
  const ref = useRef(null)
  const [kind, setKind] = useState(null)

  useEffect(() => {
    if (!fine) return
    const el = ref.current
    const move = (e) => {
      if (e.pointerType !== 'mouse') return
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
    }
    // The nearest one eases toward the pointer and back. Uses `translate` so it doesn't fight the
    // element's own transforms.
    let mag = null
    let tx = 0
    let ty = 0
    let x = 0
    let y = 0
    let raf = 0
    const tick = () => {
      x += (tx - x) * 0.2
      y += (ty - y) * 0.2
      if (mag) mag.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.05) raf = requestAnimationFrame(tick)
      else {
        raf = 0
        if (mag && !tx && !ty) {
          mag.style.translate = ''
          mag = null
        }
      }
    }
    const pull = (e) => {
      const m = e.target.closest?.(MAGNETS)
      if (m !== mag && mag) {
        mag.style.translate = ''
        x = y = 0
      }
      if (m) {
        mag = m
        const r = m.getBoundingClientRect()
        tx = (e.clientX - (r.left + r.width / 2)) * 0.18
        ty = (e.clientY - (r.top + r.height / 2)) * 0.28
      } else {
        tx = ty = 0
      }
      raf ||= requestAnimationFrame(tick)
    }
    const over = (e) => setKind(kindFor(e.target))
    const hide = () => setKind(null)
    window.addEventListener('pointermove', move, { passive: true })
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) window.addEventListener('pointermove', pull, { passive: true })
    document.addEventListener('pointerover', over)
    document.addEventListener('pointerleave', hide)
    window.addEventListener('blur', hide)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointermove', pull)
      cancelAnimationFrame(raf)
      if (mag) mag.style.translate = ''
      document.removeEventListener('pointerover', over)
      document.removeEventListener('pointerleave', hide)
      window.removeEventListener('blur', hide)
    }
  }, [fine])

  if (!fine) return null

  return (
    <div ref={ref} className="cursor" aria-hidden="true">
      <span className={`cursor__label${kind ? ' is-on' : ''}`} data-kind={kind ?? undefined}>
        {kind === 'play' && <i className="cursor__play" />}
        {LABELS[kind] ?? ''}
      </span>
    </div>
  )
}
