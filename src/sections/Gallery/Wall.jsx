import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { gsap } from '../../lib/gsap'
import { useMediaQuery, useReducedMotion } from '../../hooks/useMedia'
import { cx } from '../../utils'
import './Wall.css'

/*
  The wall of work behind the first screen: everything Akeem has made, laid out on one tilted table.
  The five sites playing, their phone views, real screens, the ad films, the Pinterest flyers. A
  camera hangs over it; on arrival it sweeps across and settles on the product on screen, and picking
  another glides over to that one. That product's prints come up to full strength, the rest stay
  dim. The left side fades into the paper so the text sits on a calm background.

  The camera is two transforms: pan the table in its own plane (so a tile's centre lands exactly on
  the camera's point), then tilt and turn the whole thing around that point.
*/
const FLYERS = ['01', '05', '08', '12', '13', '15', '18', '19', '21', '24', '26', '28', '29', '30']

function build(projects) {
  const tiles = []
  const flyers = [...FLYERS]
  const ads = projects.filter((p) => p.video?.adPoster)
  projects.forEach((p, i) => {
    // Each product: its running screen, its phone view, a real section, then something made to promote it.
    tiles.push({ id: `${p.id}-site`, kind: 'site', project: i, src: p.image?.src, video: p.video?.mobile ?? p.video?.mp4, start: p.video?.mobile ? 0 : p.video?.start })
    tiles.push({ id: `${p.id}-fly-a`, kind: 'tall', src: `/studio/flyers/${flyers.shift()}.webp` })
    tiles.push({ id: `${p.id}-s1`, kind: 'shot', project: i, src: p.gallery.find((g) => g.src.includes('section-1'))?.src ?? p.image?.src })
    tiles.push({ id: `${p.id}-phone`, kind: 'tall', project: i, src: p.gallery.find((g) => g.height > g.width)?.src, video: p.video?.phone })
    tiles.push({ id: `${p.id}-s2`, kind: 'shot', project: i, src: p.gallery.find((g) => g.src.includes('section-2'))?.src ?? p.image?.src })
    tiles.push({ id: `${p.id}-fly-b`, kind: 'tall', src: `/studio/flyers/${flyers.shift()}.webp` })
    const ad = ads[i % ads.length]
    tiles.push({ id: `${p.id}-ad`, kind: 'shot', src: ad?.video.adPoster })
    tiles.push({ id: `${p.id}-s3`, kind: 'shot', project: i, src: p.gallery.find((g) => g.src.includes('section-3'))?.src ?? p.image?.src })
  })
  // A few extra prints around the edges so you never see the table end.
  flyers.forEach((n) => tiles.push({ id: `fly-${n}`, kind: 'tall', src: `/studio/flyers/${n}.webp` }))
  return tiles.filter((t) => t.src)
}

function Tile({ t, on }) {
  return (
    <figure className={cx('wl__tile', `is-${t.kind}`, on && 'is-on')} data-tile={t.id}>
      <img src={t.src} alt="" loading="lazy" decoding="async" />
    </figure>
  )
}

export default function Wall({ projects, index, seen, className }) {
  const pan = useRef(null)
  const cam = useRef(null)
  const first = useRef(true)
  const reduced = useReducedMotion()
  const small = useMediaQuery('(max-width: 760px)')
  const tiles = useMemo(() => build(projects), [projects])

  // Where a product's screen tile sits on the table, as the pan that centres it.
  const target = (i) => {
    const grid = pan.current
    const el = grid?.querySelector(`[data-tile="${projects[i].id}-site"]`)
    if (!el) return { x: 0, y: 0 }
    return { x: -(el.offsetLeft + el.offsetWidth / 2), y: -(el.offsetTop + el.offsetHeight / 2) }
  }

  // On arrival: start over another part of the table, slightly out of focus, and sweep in.
  useLayoutEffect(() => {
    const p = target(index)
    if (reduced || !first.current) return
    const from = target((index + 2) % projects.length)
    gsap.set(pan.current, { x: from.x - 260, y: from.y + 180 })
    gsap.set(cam.current, { '--z': 1.35, '--blur': '6px' })
    const tl = gsap.timeline({ delay: 0.15 })
    tl.to(pan.current, { x: p.x, y: p.y, duration: 2.1, ease: 'power3.inOut' }, 0)
    tl.to(cam.current, { '--z': 1, '--blur': '0px', duration: 2.1, ease: 'power2.inOut' }, 0)
    return () => tl.kill()
    // First arrival only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // New product: glide across the table to it.
  useEffect(() => {
    if (first.current) {
      first.current = false
      if (reduced) gsap.set(pan.current, target(index))
      return
    }
    const p = target(index)
    if (reduced) gsap.set(pan.current, p)
    else gsap.to(pan.current, { x: p.x, y: p.y, duration: 1.3, ease: 'power3.inOut', overwrite: 'auto' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, reduced])

  // Keep the camera on target if the layout resizes.
  useEffect(() => {
    const ro = new ResizeObserver(() => gsap.set(pan.current, target(index)))
    ro.observe(pan.current)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, small])

  // The camera drifts slightly and leans a bit with the pointer. Paused when off screen.
  useEffect(() => {
    if (reduced || !seen) return
    const el = cam.current
    let mx = 0
    let my = 0
    const move = (e) => {
      mx = e.clientX / innerWidth - 0.5
      my = e.clientY / innerHeight - 0.5
    }
    window.addEventListener('pointermove', move, { passive: true })
    const tick = (t) => {
      el.style.setProperty('--dx', `${Math.sin(t / 6) * 26 - mx * 40}px`)
      el.style.setProperty('--dy', `${Math.cos(t / 8) * 18 - my * 30}px`)
      el.style.setProperty('--ry', `${mx * 3}deg`)
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      window.removeEventListener('pointermove', move)
    }
  }, [reduced, seen])

  return (
    <div className={cx('wl', className)} aria-hidden="true">
      <div ref={cam} className="wl__cam">
        <div ref={pan} className="wl__table">
          {tiles.map((t) => (
            // Everything for the current product lights up (screen, phone, sections). They stay as still
            // prints since the screen in front is already playing that footage.
            <Tile key={t.id} t={t} on={t.project === index} />
          ))}
        </div>
      </div>
      <span className="wl__fade" />
    </div>
  )
}
