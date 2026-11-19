import { useRef, useState } from 'react'
import { Link } from '../../router'
import { useReducedMotion } from '../../hooks/useMedia'
import { useSwipe } from '../../hooks/useSwipe'
import { useInView } from './LiveView'
import { Aura, Handset } from './PhoneFilm'
import { Here } from './Human'
import { cx, pad } from '../../utils'
import './PhoneHero.css'

/*
  The first screen, built for a phone in one hand rather than the laptop layout shrunk down. The
  headline, then the product's phone recording in a handset with its name and links beside it, and
  the five products as chapters along the bottom, filling up like stories. Swipe (or tap a
  chapter) to switch product; the recording, the line about it and the links change together.
*/
const SLIDE = 6500

export default function PhoneHero({ projects }) {
  const root = useRef(null)
  const reduced = useReducedMotion()
  const [, seen] = useInView(root)
  const n = projects.length
  // Came from the welcome page on a specific product: start there.
  const [i, setI] = useState(() => {
    try {
      const id = sessionStorage.getItem('hero:start')
      sessionStorage.removeItem('hero:start')
      return Math.max(0, projects.findIndex((p) => p.id === id))
    } catch {
      return 0
    }
  })
  const [held, setHeld] = useState(false)
  const run = seen && !reduced && !held
  const go = (d) => setI((k) => (k + d + n) % n)
  const choose = (k) => {
    setI(k)
    setHeld(true)
  }
  const swipe = useSwipe(
    () => {
      go(1)
      setHeld(true)
    },
    () => {
      go(-1)
      setHeld(true)
    },
  )
  const p = projects[i]

  return (
    <section ref={root} id="work" className="mh" aria-label="Akeem, full-stack PERN developer: selected work" {...swipe}>
      <Aura p={p} />

      <div className="mh__copy">
        <p className="label">
          <Here className="mh__status" />
        </p>
        <h1 className="mh__title">
          I design, build
          <br />
          and ship <em>web products.</em>
        </h1>

        {/* The work next to the text, like on a laptop: the product in a handset with its story beside it. */}
        <div className="mh__pair">
          <Handset p={p} play={seen && !reduced} className="mh__hs" />
          <div className="mh__now" key={p.id} aria-live="polite">
            <p className="label">
              {pad(i + 1)} / {pad(n)}
            </p>
            <p className="mh__name">{p.title}</p>
            <p className="mh__plain">{p.plain}</p>
            <div className="mh__acts">
              <Link to={`/work/${p.id}`} className="mh__go is-main">
                Explore <span aria-hidden="true">↗</span>
              </Link>
              {p.liveUrl && (
                <a href={p.liveUrl} target="_blank" rel="noreferrer" className="mh__go">
                  Visit live <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>
          </div>
        </div>
        <nav className="mh__chapters" aria-label="Choose a product">
          {projects.map((q, k) => (
            <button key={q.id} type="button" className={cx(k === i && 'is-on')} aria-current={k === i ? 'true' : undefined} onClick={() => choose(k)} aria-label={`${pad(k + 1)} ${q.title}`}>
              <i className={cx(k < i && 'is-done')}>{k === i && <b key={`${i}-${run}`} className={cx(run && 'is-run')} style={{ '--ms': `${SLIDE}ms` }} onAnimationEnd={() => go(1)} />}</i>
              <span>{q.title}</span>
            </button>
          ))}
        </nav>
      </div>
    </section>
  )
}
