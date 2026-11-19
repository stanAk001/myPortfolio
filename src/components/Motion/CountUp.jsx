import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'

// A number that rolls from its previous value to the new one instead of jumping.
export default function CountUp({ value, pad = 0, duration = 1.1, className }) {
  const ref = useRef(null)
  const shown = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (value == null || !el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const format = (n) => String(Math.round(n)).padStart(pad, '0')
    if (reduced) {
      el.textContent = format(value)
      shown.current = value
      return
    }
    const obj = { n: shown.current }
    const tween = gsap.to(obj, {
      n: value,
      duration,
      ease: 'power3.out',
      onUpdate: () => {
        el.textContent = format(obj.n)
        shown.current = obj.n
      },
    })
    return () => tween.kill()
  }, [value, pad, duration])

  return (
    <span ref={ref} className={className}>
      {value == null ? '—' : String(0).padStart(pad, '0')}
    </span>
  )
}
