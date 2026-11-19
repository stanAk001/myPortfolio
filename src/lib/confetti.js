import { gsap } from './gsap'

// A quick burst of paper confetti from a point on screen. Plain DOM + GSAP, cleaned up after.
export function confetti(x = window.innerWidth / 2, y = window.innerHeight / 2, count = 70) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const colours = [getComputedStyle(document.documentElement).getPropertyValue('--signal').trim() || '#c56a3d', '#dcd6c9', '#5fd39a', '#e9c046', '#7cc4ff']
  const layer = document.createElement('div')
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2000;overflow:hidden'
  document.body.appendChild(layer)
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i')
    const w = 6 + Math.random() * 6
    p.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${w * (0.4 + Math.random() * 0.8)}px;background:${colours[i % colours.length]};border-radius:${Math.random() > 0.6 ? '50%' : '1px'}`
    layer.appendChild(p)
    const angle = Math.random() * Math.PI * 2
    const power = 160 + Math.random() * 320
    gsap
      .timeline()
      .to(p, { x: Math.cos(angle) * power, y: Math.sin(angle) * power - 120, rotation: Math.random() * 720 - 360, duration: 0.9, ease: 'power3.out' })
      .to(p, { y: `+=${300 + Math.random() * 300}`, opacity: 0, duration: 1.4, ease: 'power1.in' }, 0.7)
  }
  setTimeout(() => layer.remove(), 2600)
}
