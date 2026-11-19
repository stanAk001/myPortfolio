import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { gsap, ScrollTrigger } from './gsap'

let lenis = null

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Smooth scrolling for mouse/trackpad only. Touch keeps its native momentum, which already feels right.
export function startSmoothScroll() {
  if (lenis || reduced()) return
  lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis?.raf(time * 1000))
  // Lenis already smooths. GSAP's lag compensation on top of it makes pinned sections stutter.
  gsap.ticker.lagSmoothing(0)
}

export function scrollToY(y, { immediate = false } = {}) {
  if (lenis) lenis.scrollTo(y, { immediate, force: true, duration: 1.4 })
  else window.scrollTo({ top: y, behavior: immediate || reduced() ? 'auto' : 'smooth' })
}

export function scrollToEl(el, opts) {
  if (!el) return
  scrollToY(el.getBoundingClientRect().top + window.scrollY, opts)
}

export function lockScroll(locked) {
  if (lenis) locked ? lenis.stop() : lenis.start()
  document.body.style.overflow = locked ? 'hidden' : ''
}
