import { useCallback, useState } from 'react'
import { useReveal } from '../Motion/Reveal'
import { cx } from '../../utils'
import './Scribble.css'

/*
  A handwritten margin note with a pen-drawn arrow pointing at what it's about. The words are real
  text (screen readers read them as an aside); the arrow is just decoration. `to` is the arrow
  direction: left, right, down or up. Draws itself in the first time it's seen.
*/
const ARROWS = {
  right: 'M2 14 C 18 4, 34 4, 50 12 M42 5 L51 12 L41 17',
  left: 'M50 14 C 34 4, 18 4, 2 12 M10 5 L1 12 L11 17',
  down: 'M10 2 C 2 16, 4 30, 14 44 M6 37 L14 45 L19 35',
  up: 'M10 44 C 2 30, 4 16, 14 2 M6 9 L14 1 L19 11',
}

export default function Scribble({ children, to = 'right', className, style }) {
  const [shown, setShown] = useState(false)
  const ref = useReveal(useCallback(() => setShown(true), []))
  const arrow = (
    <svg className={cx('scr__arrow', `is-${to}`)} viewBox={to === 'down' || to === 'up' ? '0 0 22 46' : '0 0 52 20'} aria-hidden="true">
      <path d={ARROWS[to]} pathLength="1" />
    </svg>
  )
  return (
    <span ref={ref} className={cx('scr', `is-${to}`, shown && 'is-in', className)} style={style}>
      {(to === 'left' || to === 'up') && arrow}
      <span className="scr__text">{children}</span>
      {(to === 'right' || to === 'down') && arrow}
    </span>
  )
}
