import { useState } from 'react'

/*
  A YouTube embed that costs nothing until someone wants it. Shows the thumbnail and a play button
  first, and only loads the player on click, from the privacy-friendly nocookie domain.
*/
export default function LiteVideo({ id, title }) {
  const [on, setOn] = useState(false)
  // Use the sharp thumbnail if there is one. YouTube returns a 120px placeholder when it's missing.
  const standard = (e) => {
    const img = e.currentTarget
    const fallback = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    if ((e.type === 'error' || img.naturalWidth <= 120) && img.src !== fallback) img.src = fallback
  }
  return (
    <div className="lite">
      {on ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" className="lite__poster" onClick={() => setOn(true)}>
          <img src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`} alt="" loading="lazy" decoding="async" onLoad={standard} onError={standard} />
          <span className="lite__play" aria-hidden="true" />
          <span className="sr-only">Play video: {title}</span>
        </button>
      )}
    </div>
  )
}
