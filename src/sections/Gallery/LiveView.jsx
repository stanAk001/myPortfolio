import { useEffect, useRef, useState } from 'react'
import { saveData, useMediaQuery, useReducedMotion } from '../../hooks/useMedia'
import { cx } from '../../utils'

// The real sizes the sites render at before being scaled into their frames: a laptop viewport and
// a phone viewport. Scaling, not squeezing, keeps each site's real layout.
const SIZES = { desk: [1440, 900], phone: [390, 844] }

// `near` once it's within about a screen (create the media), `seen` while it's on screen.
export function useInView(ref) {
  const [near, setNear] = useState(false)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    const soon = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        setNear(true)
        soon.disconnect()
      },
      { rootMargin: '60% 0px' },
    )
    const now = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { rootMargin: '5% 0px' })
    soon.observe(el)
    now.observe(el)
    return () => {
      soon.disconnect()
      now.disconnect()
    }
  }, [ref])
  return [near, seen]
}

// A muted recording that only plays while on screen. If it can't play, the poster underneath stays.
function Recording({ src, poster, play, start = 0 }) {
  const ref = useRef(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.muted = true
    if (play) v.play().catch(() => {})
    else v.pause()
  }, [play])
  if (failed || !src) return null
  // `start` skips dead time at the top of a recording; the loop goes back there, not to 0.
  return (
    <video
      ref={ref}
      className="lv__media"
      src={src}
      poster={poster}
      muted
      loop={!start}
      playsInline
      preload="metadata"
      aria-hidden="true"
      onLoadedMetadata={(e) => start && (e.currentTarget.currentTime = start)}
      onEnded={(e) => {
        e.currentTarget.currentTime = start
        if (play) e.currentTarget.play().catch(() => {})
      }}
      onError={() => setFailed(true)}
    />
  )
}

/*
  One viewport onto a real product, in layers: the poster, the recording over it, and (if the site
  allows framing and the screen is big enough to bother) the live site on top, fading in once it's
  loaded. The live site is blocked off until the visitor chooses to use it, so the page still
  scrolls normally and keyboard focus never wanders into it by accident.
*/
export default function LiveView({ project: p, kind = 'desk', live = false, onState }) {
  const root = useRef(null)
  const done = useRef(null)
  const reduced = useReducedMotion()
  const roomy = useMediaQuery('(min-width: 1024px) and (hover: hover)')
  const small = useMediaQuery('(max-width: 760px)')
  const [near, seen] = useInView(root)
  const [frame, setFrame] = useState('none') // none → loading → on, or failed
  const [active, setActive] = useState(false)
  const [w, h] = SIZES[kind]

  const poster = kind === 'phone' ? p.gallery.find((g) => g.height > g.width) : p.image
  // Phones get the lighter version of the desktop recording.
  const recording = kind === 'phone' ? p.video?.phone : (small && p.video?.mobile) || p.video?.mp4
  const embeddable = live && Boolean(p.embed && p.liveUrl) && roomy && !saveData()

  // Scale the full-size site down to the frame's width.
  useEffect(() => {
    const el = root.current
    const fit = () => el.style.setProperty('--k', el.clientWidth / w)
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [w])

  useEffect(() => {
    if (embeddable && near && frame === 'none') setFrame('loading')
  }, [embeddable, near, frame])

  // A site that refuses to be framed doesn't tell you. After a fair wait, stay on the recording.
  useEffect(() => {
    if (frame !== 'loading') return
    const id = setTimeout(() => setFrame('failed'), 15000)
    return () => clearTimeout(id)
  }, [frame])

  useEffect(() => onState?.(frame === 'on' ? 'live' : 'recording'), [frame, onState])

  // To leave the site: scroll it out of view, press Escape, or press Done.
  useEffect(() => {
    if (!active) return
    done.current?.focus()
    const onKey = (e) => e.key === 'Escape' && setActive(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])
  useEffect(() => {
    if (!seen) setActive(false)
  }, [seen])

  const isLive = frame === 'on'

  return (
    <div ref={root} className={cx('lv', `lv--${kind}`)} data-live={frame} data-active={active || undefined} data-lenis-prevent={active || undefined}>
      {poster && <img className="lv__media" src={poster.src} alt={poster.alt ?? ''} loading="lazy" decoding="async" />}
      {near && !reduced && !saveData() && !isLive && <Recording src={recording} poster={poster?.src} play={seen} start={recording === p.video?.mp4 ? p.video?.start : 0} />}
      {(frame === 'loading' || frame === 'on') && (
        <iframe
          className="lv__site"
          style={{ width: w, height: h }}
          src={p.liveUrl}
          title={`${p.title}, the live site${kind === 'phone' ? ' on a phone' : ''}`}
          tabIndex={active ? 0 : -1}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="strict-origin-when-cross-origin"
          // "load" fires before an app has drawn anything, so wait a beat. The recording should hand over
          // to a finished page, not a loading screen.
          onLoad={() => setTimeout(() => setFrame((f) => (f === 'loading' ? 'on' : f)), 2200)}
        />
      )}
      {isLive && !active && (
        <button type="button" className="lv__shield" onClick={() => setActive(true)}>
          <span className="lv__ask">
            <i aria-hidden="true" /> Interact<span className="sr-only"> with the live {p.title} site</span>
          </span>
        </button>
      )}
      {active && (
        <button ref={done} type="button" className="lv__done" onClick={() => setActive(false)}>
          Done <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  )
}
