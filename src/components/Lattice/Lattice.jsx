import { useEffect, useRef } from 'react'
import { useFinePointer, useReducedMotion } from '../../hooks/useMedia'
import './Lattice.css'

/*
  A small 3D object: three brushed-metal frames rotated around one axis, two smoked-glass panes
  between them and an orange node where they meet. Pure CSS 3D, since WebGL is overkill at this
  size. Turns slowly, leans a little toward the pointer, sits on a soft shadow.
*/
export default function Lattice() {
  const root = useRef(null)
  const fine = useFinePointer()
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!fine || reduced) return
    const el = root.current
    const area = el.closest('section') ?? el
    const move = (e) => {
      const r = el.getBoundingClientRect()
      const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth
      const dy = (e.clientY - (r.top + r.height / 2)) / innerHeight
      el.style.setProperty('--lean-y', `${dx * 26}deg`)
      el.style.setProperty('--lean-x', `${dy * -16}deg`)
    }
    const reset = () => {
      el.style.setProperty('--lean-y', '0deg')
      el.style.setProperty('--lean-x', '0deg')
    }
    area.addEventListener('pointermove', move)
    area.addEventListener('pointerleave', reset)
    return () => {
      area.removeEventListener('pointermove', move)
      area.removeEventListener('pointerleave', reset)
    }
  }, [fine, reduced])

  return (
    <div ref={root} className="lt" aria-hidden="true">
      <div className="lt__lean">
        <div className="lt__turn">
          {[0, 60, 120].map((a) => (
            <i key={a} className="lt__frame" style={{ '--a': `${a}deg` }} />
          ))}
          <i className="lt__glass" style={{ '--a': '30deg' }} />
          <i className="lt__glass" style={{ '--a': '-60deg' }} />
          <i className="lt__ring" />
          <i className="lt__node" />
        </div>
      </div>
      <span className="lt__shadow" />
    </div>
  )
}
