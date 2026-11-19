import { useEffect, useRef, useState } from 'react'
import { useInView } from '../../sections/Gallery/LiveView'
import { useReducedMotion, saveData } from '../../hooks/useMedia'
import { site } from '../../data/site'
import { FLYERS } from '../../sections/Studio/Studio'
import { cx } from '../../utils'
import './OnAir.css'

/*
  Studio intro, set up like a TV control room. Left: who's talking, and the credits for every film
  (all the same name). Right: a multiview with the real films playing, one on PROGRAM (red tally)
  and the next on PREVIEW (green), cutting every few seconds. Click a monitor to open it in the suite.
*/

const FEEDS = [
  { id: 'sa', name: 'StockAcademia', kind: 'Product ad', src: '/projects/stockacademia/ad-mobile.mp4', poster: '/projects/stockacademia/ad-poster.webp', from: 30 },
  { id: 'th', name: 'Toolhaven', kind: 'Product ad', src: '/projects/toolhaven/ad-mobile.mp4', poster: '/projects/toolhaven/ad-poster.webp', from: 17 },
  { id: 'ks', name: 'KeemStore', kind: 'Product ad', src: '/projects/keemstore/ad-mobile.mp4', poster: '/projects/keemstore/ad-poster.webp', from: 8 },
  { id: 'tff', name: 'TFF', kind: 'Client edit', src: '/studio/video/tff-showcase-mobile.mp4', poster: '/studio/video/tff-showcase.webp', from: 4 },
]
const HOLD = 5200

const CREDITS = [
  ['Product & code', site.name],
  ['Direction & edit', site.name],
  ['Motion & type', site.name],
  ['Original score', site.name],
  ['Script & voice direction', site.name],
  ['Flyers & social', site.name],
  ['AI video', `${site.name}, in training`],
]

const tc = (s) => {
  const f = Math.floor(s * 25)
  return `00:${String(Math.floor(f / 1500)).padStart(2, '0')}:${String(Math.floor(f / 25) % 60).padStart(2, '0')}:${String(f % 25).padStart(2, '0')}`
}

function Multiview({ onOpen }) {
  const root = useRef(null)
  const vids = useRef([])
  const clock = useRef(null)
  const reduced = useReducedMotion()
  const [, seen] = useInView(root)
  const [pgm, setPgm] = useState(0)
  const live = seen && !reduced && !saveData()
  const pvw = (pgm + 1) % FEEDS.length

  useEffect(() => {
    vids.current.forEach((v) => v && (live ? v.play().catch(() => {}) : v.pause()))
    if (!live) return
    const id = setInterval(() => setPgm((p) => (p + 1) % FEEDS.length), HOLD)
    return () => clearInterval(id)
  }, [live])

  // Program timecode, read from the program monitor's video.
  useEffect(() => {
    let raf = 0
    const loop = () => {
      const v = vids.current[pgm]
      if (clock.current && v) clock.current.textContent = tc(v.currentTime)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [pgm])

  return (
    <div ref={root} className="mv" role="group" aria-label="The films, playing">
      {FEEDS.map((f, i) => (
        <button
          key={f.id}
          type="button"
          className={cx('mv__tile', i === pgm && 'is-pgm', i === pvw && 'is-pvw')}
          onClick={() => onOpen(f.id)}
          aria-label={`Open ${f.name} — ${f.kind} in the edit suite`}
        >
          <video
            ref={(el) => (vids.current[i] = el)}
            src={f.src}
            poster={f.poster}
            muted
            loop
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) => (e.currentTarget.currentTime = f.from)}
            aria-hidden="true"
          />
          {i === pgm && <span key={pgm} className="mv__cut" aria-hidden="true" />}
          <span className="mv__label">
            <b className="mv__tally">{i === pgm ? 'PGM' : i === pvw ? 'PVW' : `CAM ${i + 1}`}</b>
            {f.name} <em>· {f.kind}</em>
          </span>
          {i === pgm && <span ref={clock} className="mv__tc" aria-hidden="true" />}
          <span className="mv__open label" aria-hidden="true">
            Open in the suite →
          </span>
        </button>
      ))}
    </div>
  )
}

export default function OnAir({ onOpen, onReel, onKit }) {
  return (
    <header className="oa">
      <div className="oa__copy">
        <p className="oa__onair label">
          <span className="oa__light" aria-hidden="true" />
          On air — the studio
        </p>
        <h1 className="oa__title">
          <span className="oa__line">I build your product.</span>
          <span className="oa__line oa__line--thin">
            Then I <em>launch it.</em>
          </span>
        </h1>
        <p className="oa__intro">
          Most developers hand over a website and wish you luck. I hand over the website — and everything that sells it: the ad film, the score, the voice, the flyers. Same hands, same taste, no hand-offs.
        </p>

        <dl className="oa__credits" aria-label="Credits for every film on this page">
          {CREDITS.map(([role, who], i) => (
            <div key={role} style={{ '--i': i }}>
              <dt>{role}</dt>
              <dd>{who}</dd>
            </div>
          ))}
        </dl>

        <div className="oa__ctas">
          <button type="button" className="g-btn g-btn--solid" onClick={onReel}>
            <span className="oa__play" aria-hidden="true" />
            Watch the reel
          </button>
          <button type="button" className="g-btn" onClick={onKit}>
            Render your launch kit
          </button>
        </div>
      </div>

      <div className="oa__wall">
        <Multiview onOpen={onOpen} />
      </div>

      <p className="oa__third" aria-label="In the studio">
        <span>
          <b>03</b> ad films
        </span>
        <span>
          <b>{FLYERS.length}</b> flyers
        </span>
        <span>
          <b>02</b> client edits
        </span>
        <span>
          <b>03</b> original scores
        </span>
        <span className="oa__third-end">Every frame made in-house</span>
      </p>
    </header>
  )
}
