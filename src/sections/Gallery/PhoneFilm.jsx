import { useEffect, useRef } from 'react'
import { cx } from '../../utils'
import './Handset.css'

/*
  Work on a phone is always framed, same as on a laptop: the product's phone recording inside a
  handset (the same one the laptop layout uses), on a soft wash of the product's colours. Never a raw
  site stretched edge to edge under the text.
*/
export const portrait = (p) => p.gallery?.find((g) => g.height > g.width)?.src ?? p.image?.src

function Recording({ p, play }) {
  const ref = useRef(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.muted = true
    if (play) v.play().catch(() => {})
    else v.pause()
  }, [play])
  return (
    <>
      <img src={portrait(p)} alt="" decoding="async" />
      {p.video?.phone && <video ref={ref} src={p.video.phone} poster={portrait(p)} muted loop playsInline preload="auto" />}
    </>
  )
}

/* A handset playing one product. `k` re-keys it so switching products is a clean cut. */
export function Handset({ p, play, className }) {
  return (
    <div className={cx('hs', className)} aria-hidden="true">
      <div className="ex__handset">
        <div className="lv lv--phone hs__screen" key={p.id}>
          <Recording p={p} play={play} />
        </div>
      </div>
    </div>
  )
}

/* The background wash: the product's poster blurred into colour. Cheap, just an image, no video. */
export function Aura({ p }) {
  return (
    <div className="hs__aura" aria-hidden="true">
      <img key={p.id} src={portrait(p)} alt="" decoding="async" />
    </div>
  )
}

export default Handset
