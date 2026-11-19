import { useEffect, useRef } from 'react'
import { cx } from '../../utils'
import './Devices.css'

// Plays while `playing` is true; otherwise rests on its poster. Muted + inline so phones allow autoplay.
function Screen({ src, poster, playing, className }) {
  const ref = useRef(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.muted = true
    if (playing) v.play().catch(() => {})
    else v.pause()
  }, [playing, src])
  if (!src) return poster ? <img className={className} src={poster} alt="" /> : null
  return <video ref={ref} className={className} src={src} poster={poster} muted loop playsInline preload={playing ? 'auto' : 'none'} aria-hidden="true" />
}

export function Laptop({ src, poster, playing = true, className, children }) {
  return (
    <div className={cx('laptop', className)}>
      <div className="laptop__lid">
        <span className="laptop__cam" aria-hidden="true" />
        <div className="laptop__screen">
          {children ?? <Screen src={src} poster={poster} playing={playing} className="device__media" />}
        </div>
      </div>
      <div className="laptop__base" aria-hidden="true">
        <span />
      </div>
    </div>
  )
}

export function Phone({ src, poster, playing = true, className, children }) {
  return (
    <div className={cx('phone', className)}>
      <div className="phone__screen">
        {children ?? <Screen src={src} poster={poster} playing={playing} className="device__media" />}
        <span className="phone__island" aria-hidden="true" />
      </div>
    </div>
  )
}

export { Screen }
