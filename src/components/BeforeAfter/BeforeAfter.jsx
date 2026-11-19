import { useRef, useState } from 'react'
import './BeforeAfter.css'

// Only rendered when a project has real before/after material in its data.
export default function BeforeAfter({ before, after, caption }) {
  const [pos, setPos] = useState(50)
  const frame = useRef(null)
  const dragging = useRef(false)

  const fromPointer = (e) => {
    const box = frame.current.getBoundingClientRect()
    setPos(Math.min(100, Math.max(0, ((e.clientX - box.left) / box.width) * 100)))
  }

  return (
    <figure className="ba">
      <div
        ref={frame}
        className="ba__frame"
        data-cursor="drag"
        style={{ '--pos': `${pos}%` }}
        onPointerDown={(e) => {
          dragging.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          fromPointer(e)
        }}
        onPointerMove={(e) => dragging.current && fromPointer(e)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <img src={after.src} alt={after.alt} loading="lazy" decoding="async" />
        <div className="ba__before">
          <img src={before.src} alt={before.alt} loading="lazy" decoding="async" />
        </div>
        <span className="ba__tag ba__tag--before label">Before</span>
        <span className="ba__tag ba__tag--after label">After</span>
        <span className="ba__handle" aria-hidden="true" />
      </div>
      {/* The visual handle is for pointers; this is the same control for keyboards and screen readers. */}
      <input
        className="sr-only"
        type="range"
        min="0"
        max="100"
        value={Math.round(pos)}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Compare before and after"
        onFocus={(e) => e.target.closest('.ba').classList.add('is-focused')}
        onBlur={(e) => e.target.closest('.ba').classList.remove('is-focused')}
      />
      {caption && <figcaption className="label">{caption}</figcaption>}
    </figure>
  )
}
