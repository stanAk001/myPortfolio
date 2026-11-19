import { useEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'
import { saveData, useFinePointer, useReducedMotion } from '../../hooks/useMedia'
import { cx } from '../../utils'
import './ProjectMedia.css'

/*
  Image, video, or both. The image is always the poster and the fallback.

  autoplay="hover"  desktop: plays while the cursor is on it; touch: while it's on screen
  autoplay="inview" plays whenever it's on screen
  enabled=false     never plays (e.g. a reel scene stacked under the active one)
*/
export default function ProjectMedia({
  project,
  sizes = '100vw',
  priority = false,
  tilt = true,
  autoplay = 'hover',
  enabled = true,
  controls = false,
  badge = true,
  vtName,
  className,
}) {
  const { image, video, title } = project
  const rootRef = useRef(null)
  const innerRef = useRef(null)
  const videoRef = useRef(null)
  const fine = useFinePointer()
  const reduced = useReducedMotion()

  const [near, setNear] = useState(false)
  const [inView, setInView] = useState(false)
  const [hover, setHover] = useState(false)
  const [manual, setManual] = useState(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!video) return
    const el = rootRef.current
    // Don't even create the <video> until it's within about a screen of the viewport.
    const nearIO = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        setNear(true)
        nearIO.disconnect()
      },
      { rootMargin: '80% 0px' },
    )
    // Big margin on purpose: pausing the moment one pixel leaves the screen makes the video stop and
    // restart when someone nudges the page back and forth.
    const viewIO = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '20% 0px' })
    nearIO.observe(el)
    viewIO.observe(el)
    return () => {
      nearIO.disconnect()
      viewIO.disconnect()
    }
  }, [video])

  const automatic =
    autoplay === 'inview' || !fine ? !reduced && !saveData() : hover
  const shouldPlay = Boolean(video) && near && inView && enabled && (manual ?? automatic)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (shouldPlay) {
      v.play().catch(() => {})
      return
    }
    v.pause()
    // Rewind after the fade back to the poster, so each hover starts from the beginning.
    const id = setTimeout(() => {
      if (v.paused) v.currentTime = 0
    }, 700)
    return () => clearTimeout(id)
  }, [shouldPlay, near])

  useEffect(() => {
    if (!tilt || !fine || reduced) return
    const root = rootRef.current
    const inner = innerRef.current
    gsap.set(inner, { transformPerspective: 1400 })
    const rotX = gsap.quickTo(inner, 'rotationX', { duration: 0.9, ease: 'power3' })
    const rotY = gsap.quickTo(inner, 'rotationY', { duration: 0.9, ease: 'power3' })

    // Only a few degrees. Any more and the UI in the screenshot stops being readable.
    const move = (e) => {
      const box = root.getBoundingClientRect()
      const nx = (e.clientX - box.left) / box.width - 0.5
      const ny = (e.clientY - box.top) / box.height - 0.5
      rotY(nx * 6)
      rotX(-ny * 4)
      root.style.setProperty('--lx', `${(nx + 0.5) * 100}%`)
      root.style.setProperty('--ly', `${(ny + 0.5) * 100}%`)
    }
    const leave = () => {
      rotX(0)
      rotY(0)
    }
    root.addEventListener('pointermove', move)
    root.addEventListener('pointerleave', leave)
    return () => {
      root.removeEventListener('pointermove', move)
      root.removeEventListener('pointerleave', leave)
      gsap.set(inner, { clearProps: 'transform' })
    }
  }, [tilt, fine, reduced])

  const setVideo = (node) => {
    videoRef.current = node
    // React doesn't set `muted` as an attribute, and iOS needs it for inline autoplay.
    if (node) {
      node.muted = true
      node.defaultMuted = true
    }
  }

  const ratio = image?.width && image?.height ? `${image.width} / ${image.height}` : undefined

  return (
    <div
      ref={rootRef}
      className={cx('pm', className)}
      data-hover={hover || undefined}
      data-playing={playing || undefined}
      style={{ '--ar': ratio, viewTransitionName: vtName }}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <div ref={innerRef} className="pm__inner">
        {image ? (
          <img
            className="pm__img"
            src={image.src}
            srcSet={image.srcSet}
            sizes={image.srcSet ? image.sizes ?? sizes : undefined}
            width={image.width}
            height={image.height}
            alt={image.alt ?? ''}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            decoding="async"
          />
        ) : (
          <div className="pm__fallback" role="img" aria-label={title}>
            <span>{title}</span>
          </div>
        )}

        {video && near && (
          <video
            ref={setVideo}
            className="pm__video"
            poster={video.poster ?? image?.src}
            preload="metadata"
            loop
            muted
            playsInline
            aria-hidden="true"
            onPlaying={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          >
            {video.mobile && <source src={video.mobile} type="video/mp4" media="(max-width: 760px)" />}
            {video.webm && <source src={video.webm} type="video/webm" />}
            {video.mp4 && <source src={video.mp4} type="video/mp4" />}
          </video>
        )}
        <span className="pm__light" aria-hidden="true" />
      </div>
      {badge && video && (
        <span className="pm__badge" aria-hidden="true">
          <i /> Recorded live{project.url ? ` — ${project.url}` : ''}
        </span>
      )}

      {controls && video && (
        <button
          type="button"
          className="pm__toggle"
          aria-pressed={playing}
          onClick={() => setManual(!playing)}
          data-cursor={playing ? undefined : 'play'}
        >
          <span className="pm__toggle-icon" aria-hidden="true" data-playing={playing || undefined} />
          {playing ? 'Pause trailer' : 'Play trailer'}
        </button>
      )}
    </div>
  )
}
