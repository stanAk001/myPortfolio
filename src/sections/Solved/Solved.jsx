import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, scrollToId } from '../../router'
import { liveProjects } from '../../data/projects'
import { useUptime } from '../../lib/uptime'
import { useMediaQuery, useReducedMotion } from '../../hooks/useMedia'
import { Handset } from '../Gallery/PhoneFilm'
import { useInView } from '../Gallery/LiveView'
import { Clip, PROJECTS } from '../Gallery/Gallery'
import { cx, hostOf, pad } from '../../utils'
import './Solved.css'

/*
  Before and after. Every product here started with someone stuck: hunting for the right tool, lost
  in jargon, scrolling page 47, calling to ask if the pitch is free, answering DMs one by one. The
  bar types out that moment, as recorded for each project, then turns into the fix: the product
  running, the problem in one line, what it fixed, and whether it's up today.

  It cycles through them on its own while on screen; pick one and it stays. "I need this" takes the
  visitor to the brief with the product type and a first line already filled in.
*/
const TYPE_MS = 38
const HOLD_MS = 7600
const KIND = { toolhaven: 'Website', stockacademia: 'Web app', keemstore: 'Online store', primetime: 'Web app', hadex: 'Website' }

const ITEMS = PROJECTS.filter((p) => p.problem?.search && p.problem?.headline)

function Icon({ visual }) {
  if (visual === 'dms')
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5h16v11H9l-5 4z" />
      </svg>
    )
  if (visual === 'scroll')
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 6h14M5 12h14M5 18h9" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </svg>
  )
}

function Live({ p, on }) {
  const { byId } = useUptime(on)
  const last = byId[p.id]?.at(-1)
  if (!liveProjects.some((x) => x.id === p.id) || !last?.ok) return null
  return <span className="sv__live is-up">Up and running today.</span>
}

export default function Solved() {
  const root = useRef(null)
  const reduced = useReducedMotion()
  const phone = useMediaQuery('(max-width: 760px)')
  const [, seen] = useInView(root)
  const [i, setI] = useState(0)
  const [typed, setTyped] = useState(reduced ? ITEMS[0].problem.search : '')
  const [phase, setPhase] = useState(reduced ? 'after' : 'typing') // typing → finding → after
  const [held, setHeld] = useState(false)
  const p = ITEMS[i]

  // Type the "before", then show the "after".
  useEffect(() => {
    const q = p.problem.search
    if (reduced) {
      setTyped(q)
      setPhase('after')
      return
    }
    if (!seen) return
    setTyped('')
    setPhase('typing')
    let n = 0
    const ids = []
    const tick = setInterval(() => {
      n++
      setTyped(q.slice(0, n))
      if (n >= q.length) {
        clearInterval(tick)
        ids.push(setTimeout(() => setPhase('finding'), 260))
        ids.push(setTimeout(() => setPhase('after'), 980))
      }
    }, TYPE_MS)
    return () => {
      clearInterval(tick)
      ids.forEach(clearTimeout)
    }
  }, [i, seen, reduced, p])

  // Then move on to the next, unless the visitor picked one.
  useEffect(() => {
    if (reduced || held || !seen || phase !== 'after') return
    const id = setTimeout(() => setI((n) => (n + 1) % ITEMS.length), HOLD_MS)
    return () => clearTimeout(id)
  }, [phase, held, seen, reduced])

  const choose = (n) => {
    setHeld(true)
    setI(n)
  }

  const need = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent('brief:prefill', {
        // The product first (it becomes the blueprint's headline), then the reference.
        detail: { kind: KIND[p.id] ?? 'Website', message: `${p.plain?.replace(/\s*$/, '')} Something like ${p.title}, for my business. ` },
      }),
    )
    scrollToId('contact')
  }, [p])

  return (
    <section ref={root} id="build" className={cx('sv', `is-${phase}`)} aria-labelledby="sv-title">
      <header className="sv__head">
        <p className="g-meta label">
          <span className="g-square" aria-hidden="true" />
          Before → after
        </p>
        <h2 id="sv-title" className="sv__title">
          Someone was stuck.
          <span>So I built the way out.</span>
        </h2>
      </header>

      {/* Before: the moment, typed out. */}
      <div className="sv__bar" role="group" aria-label="Before">
        <span className="sv__tag">Before</span>
        <span className="sv__icon">
          <Icon visual={p.problem.visual} />
        </span>
        <span className="sv__query" aria-live="polite">
          {typed}
          <i className="sv__caret" aria-hidden="true" />
        </span>
        <span className="sv__scan" aria-hidden="true" />
      </div>

      <ol className="sv__picks" aria-label="Choose a before">
        {ITEMS.map((q, n) => (
          <li key={q.id}>
            <button type="button" aria-current={n === i ? 'true' : undefined} onClick={() => choose(n)}>
              <span>{pad(n + 1)}</span>
              {q.problem.search}
            </button>
          </li>
        ))}
      </ol>

      {/* After: the fix. */}
      <article key={p.id} className="sv__after" aria-label={`After: ${p.title}`} style={{ '--p-accent': p.theme?.accent ?? 'var(--ink-text)' }}>
        <div className="sv__film">
          {phone ? (
            <Handset p={p} play={seen && !reduced && phase === 'after'} className="sv__hs" />
          ) : (
            <div className="sv__frame">
              <p className="sv__host">
                <span>{p.url ?? hostOf(p.liveUrl)}</span>
              </p>
              <div className="sv__view">
                <Clip on play={seen && !reduced && phase === 'after'} poster={p.image?.src} src={p.video?.mobile ?? p.video?.mp4} start={p.video?.mobile ? 0 : p.video?.start} />
              </div>
            </div>
          )}
        </div>        <div className="sv__words">
          <p className="sv__was">
            <span className="label">The problem</span>
            {p.problem.headline}
          </p>
          <h3 className="sv__name">
            <span className="label">The way out · {pad(i + 1)}</span>
            {p.title}
          </h3>
          <p className="sv__fix">{p.problem.solution}</p>
          <ul className="sv__fixes">
            {(p.problem.fixes ?? []).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <Live p={p} on={seen} />
          <div className="sv__go">
            <button type="button" className="sv__need" onClick={need} data-cursor="build">
              I need this <span aria-hidden="true">→</span>
            </button>
            <Link to={`/work/${p.id}`} className="sv__how">
              How I built it <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </article>
    </section>
  )
}
