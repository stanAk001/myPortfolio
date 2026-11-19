import { useEffect, useRef, useState } from 'react'
import { saveData, useMediaQuery, useReducedMotion } from '../../hooks/useMedia'
import { cx } from '../../utils'

/*
  The product ad player. Muted and looping while on screen, paused when not. Simple controls:
  play/pause, a clickable progress bar, full screen. With reduced motion or data saver on, it
  waits on its poster until someone presses play.
*/
export default function AdPlayer({ src, mobile, poster, title }) {
  const box = useRef(null)
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const small = useMediaQuery('(max-width: 760px)')
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [failed, setFailed] = useState(false)
  const [sound, setSound] = useState(false)
  const auto = !reduced && !saveData()

  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.muted = true
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && auto) v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.35 },
    )
    io.observe(v)
    return () => io.disconnect()
  }, [auto, src])

  const toggle = () => {
    const v = ref.current
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }
  const seek = (e) => {
    const v = ref.current
    const r = e.currentTarget.getBoundingClientRect()
    v.currentTime = ((e.clientX - r.left) / r.width) * (v.duration || 0)
  }
  const full = () => box.current?.requestFullscreen?.()
  // Sound only ever starts from a click, and turning it on also starts playback.
  const toggleSound = () => {
    const v = ref.current
    v.muted = sound
    if (!sound) v.play().catch(() => {})
    setSound(!sound)
  }

  if (failed) return <img className="ad__poster" src={poster} alt={`${title}: product ad`} />

  return (
    <div ref={box} className={cx('ad', playing && 'is-playing')}>
      <video
        ref={ref}
        src={small && mobile ? mobile : src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={`${title}: product ad`}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
        onError={() => setFailed(true)}
        onClick={toggle}
      />
      <div className="ad__controls">
        <button type="button" className="ad__btn" onClick={toggle} aria-label={playing ? 'Pause the ad' : 'Play the ad'}>
          {playing ? (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 3h3v10H4zM9 3h3v10H9z" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 2.5l9 5.5-9 5.5z" />
            </svg>
          )}
        </button>
        <button type="button" className="ad__bar" onClick={seek} aria-label="Seek">
          <i style={{ transform: `scaleX(${progress})` }} />
        </button>
        <button type="button" className={cx('ad__sound', sound && 'is-on')} onClick={toggleSound} aria-pressed={sound}>
          <span className="ad__bars" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          {sound ? 'Sound on' : 'Sound off'}
        </button>
        <button type="button" className="ad__btn" onClick={full} aria-label="Full screen">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
