import { useEffect, useRef, useState } from 'react'
import { Link } from '../../router'
import { liveProjects } from '../../data/projects'
import { useUptime } from '../../lib/uptime'
import { useReducedMotion } from '../../hooks/useMedia'
import { useSwipe } from '../../hooks/useSwipe'
import { useInView } from '../Gallery/LiveView'
import { Aura, Handset } from '../Gallery/PhoneFilm'
import { cx, hostOf, pad } from '../../utils'
import './PhoneStories.css'

/*
  Projects on a phone, as stories: one product at a time, its recording playing in a handset, and
  progress bars along the top filling as it plays. Tap the right side (or swipe) for the next, the
  left for the previous, press and hold to pause, like any story. Under each: what it is, the
  problem it solved, whether it's up today, and the link to the full story.
*/
const SLIDE = 7000

export default function PhoneStories({ projects }) {
  const root = useRef(null)
  const card = useRef(null)
  const reduced = useReducedMotion()
  const [, seen] = useInView(root)
  // Only play while the card is mostly on screen.
  const [watching, setWatching] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setWatching(e.intersectionRatio >= 0.6), { threshold: [0, 0.6, 1] })
    io.observe(card.current)
    return () => io.disconnect()
  }, [])
  const { byId } = useUptime(seen)
  const [i, setI] = useState(0)
  const [hold, setHold] = useState(false)
  const n = projects.length
  const run = watching && !reduced && !hold
  const go = (d) => setI((k) => Math.max(0, Math.min(n - 1, k + d)))
  const next = () => setI((k) => (k + 1) % n)
  const swipe = useSwipe(() => go(1), () => go(-1))
  const p = projects[i]
  const last = byId[p.id]?.at(-1)
  const isLive = liveProjects.some((x) => x.id === p.id)

  return (
    <section ref={root} id="projects" className="ps" aria-labelledby="ps-title">
      {/* Anchors the rest of the site links to (#index-toolhaven and so on). */}
      {projects.map((x) => (
        <span key={x.id} id={`index-${x.id}`} className="ps__anchor" aria-hidden="true" />
      ))}

      <header className="ps__head">
        <h2 id="ps-title">My projects.</h2>
        <p>Five picked from 30+ sites built since 2022.</p>
      </header>

      <div
        ref={card}
        className={cx('ps__story', hold && 'is-held')}
        {...swipe}
        onPointerDown={() => setHold(true)}
        onPointerUp={() => setHold(false)}
        onPointerCancel={() => setHold(false)}
        onPointerLeave={() => setHold(false)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Aura p={p} />

        <div className="ps__bars" aria-hidden="true">
          {projects.map((q, k) => (
            <i key={q.id} className={cx(k < i && 'is-done')}>
              {k === i && <b key={i} className={cx('is-now', !run && 'is-paused', reduced && 'is-full')} style={{ '--ms': `${SLIDE}ms` }} onAnimationEnd={next} />}
            </i>
          ))}
        </div>
        <p className="ps__top label">
          <span>
            {pad(i + 1)} / {pad(n)}
          </span>
          <span>{p.url ?? hostOf(p.liveUrl)}</span>
        </p>

        {/* The product in its handset. Tap either side of it, like any story. */}
        <div className="ps__stage">
          <Handset p={p} play={watching && !reduced && !hold} className="ps__hs" />
          <button type="button" className="ps__tap is-prev" onClick={() => go(-1)} aria-label="Previous project" disabled={i === 0} />
          <button type="button" className="ps__tap is-next" onClick={() => go(1)} aria-label="Next project" disabled={i === n - 1} />
        </div>
        <div className="ps__copy" key={p.id} aria-live="polite">
          <p className="ps__cat label">{p.category}</p>
          <h3 className="ps__name">{p.title}</h3>
          <p className="ps__problem">{p.problem?.headline}</p>
          <p className="ps__stack label">{p.technologies.slice(0, 4).join(' · ')}</p>
          {isLive && last?.ok && <p className="ps__live label is-up">Up and running today.</p>}
          <div className="ps__acts">
            <Link to={`/work/${p.id}`} className="ps__go is-main">
              Read the story <span aria-hidden="true">→</span>
            </Link>
            {p.liveUrl && (
              <a href={p.liveUrl} target="_blank" rel="noreferrer" className="ps__go">
                Visit live <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <p className="ps__hint label">Tap the sides or swipe · hold to pause</p>
    </section>
  )
}
