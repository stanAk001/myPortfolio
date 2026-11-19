import { useEffect, useRef } from 'react'
import { useRouter } from '../../router'
import { useFinePointer, useReducedMotion } from '../../hooks/useMedia'
import './Atmosphere.css'

/*
  One fixed layer behind the page with three soft colour fields, arranged per section, plus a pool
  of light that follows the mouse (pointer devices only). The current section goes on
  <html data-atmo> so CSS does the layout and React never re-renders for it.
*/
const SECTIONS = ['work', 'projects', 'studio', 'build', 'about', 'contact']

export default function Atmosphere() {
  const { path } = useRouter()
  const spot = useRef(null)
  const fine = useFinePointer()
  const reduced = useReducedMotion()

  // On /work it's whichever section crosses the middle of the screen; elsewhere it's the page.
  useEffect(() => {
    const root = document.documentElement
    if (path.startsWith('/studio')) {
      root.dataset.atmo = 'studio'
      return
    }
    if (!/^\/work\/?$/.test(path)) {
      root.dataset.atmo = 'case'
      return
    }
    root.dataset.atmo = 'work'
    let io
    const id = setTimeout(() => {
      io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && (root.dataset.atmo = e.target.id)), {
        rootMargin: '-48% 0px -48% 0px',
      })
      SECTIONS.forEach((s) => {
        const el = document.getElementById(s)
        if (el) io.observe(el)
      })
    }, 200)
    return () => {
      clearTimeout(id)
      io?.disconnect()
    }
  }, [path])

  // Eases toward the pointer each frame and goes idle when it stops.
  useEffect(() => {
    const el = spot.current
    if (!fine || reduced || !el) return
    let x = innerWidth / 2
    let y = innerHeight / 2
    let tx = x
    let ty = y
    let raf = 0
    const tick = () => {
      x += (tx - x) * 0.08
      y += (ty - y) * 0.08
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(tick) : 0
    }
    const move = (e) => {
      tx = e.clientX
      ty = e.clientY
      raf ||= requestAnimationFrame(tick)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => {
      window.removeEventListener('pointermove', move)
      cancelAnimationFrame(raf)
    }
  }, [fine, reduced])

  return (
    <div className="atmo" aria-hidden="true">
      <span className="atmo__key" />
      <span className="atmo__fill" />
      {fine && !reduced && <span ref={spot} className="atmo__spot" />}
      <span className="atmo__edge" />
    </div>
  )
}
