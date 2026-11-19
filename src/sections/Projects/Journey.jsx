import { useEffect, useRef, useState } from 'react'
import { lockScroll } from '../../lib/smooth'
import { Link } from '../../router'
import { cx, pad } from '../../utils'

/*
  A project's journey from idea to product, using only what's on record. No made-up dates, sketches
  or wireframes: stages with nothing behind them just don't show, and the only pictures are real
  screens of the finished site, labelled as such.
*/
function stagesOf(p) {
  const shots = p.gallery.filter((g) => g.width > g.height)
  const list = []
  if (p.why) list.push({ name: 'The idea', text: p.why })
  if (p.problem?.text) list.push({ name: 'The challenge', text: p.problem.text })
  if (p.problem?.solution) list.push({ name: 'The direction', text: p.problem.solution })
  list.push({ name: 'The build', text: p.whatIBuilt ?? `Built with ${p.technologies.join(', ')}.`, facts: p.whatIBuilt ? p.technologies : null })
  list.push({ name: 'The finished product', facts: p.problem?.fixes, text: p.plain })
  return list.map((s, i) => ({ ...s, shot: shots.length ? shots[i % shots.length] : p.image }))
}

export default function Journey({ project: p, pinned, onClose }) {
  const panel = useRef(null)
  const [at, setAt] = useState(0)
  const stages = stagesOf(p)
  const s = stages[at]

  useEffect(() => {
    const back = document.activeElement
    panel.current?.querySelector('button')?.focus({ preventScroll: true })
    // Locking body scroll would break the sticky stage, so scrolling away closes this instead.
    const from = window.scrollY
    const onScroll = () => Math.abs(window.scrollY - from) > 60 && onClose()
    if (pinned) window.addEventListener('scroll', onScroll, { passive: true })
    else lockScroll(true)
    return () => {
      if (pinned) window.removeEventListener('scroll', onScroll)
      else lockScroll(false)
      back?.focus?.({ preventScroll: true })
    }
    // Set up once, for as long as the panel is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onKey = (e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      setAt((n) => Math.min(stages.length - 1, n + 1))
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      setAt((n) => Math.max(0, n - 1))
    }
    if (e.key !== 'Tab') return
    const all = panel.current.querySelectorAll('a[href], button')
    const first = all[0]
    const last = all[all.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <>
      <button type="button" className="pj__scrim" tabIndex={-1} aria-hidden="true" onClick={onClose} />
      <div ref={panel} className="jn" role="dialog" aria-modal="true" aria-label={`From idea to product: ${p.title}`} onKeyDown={onKey} data-lenis-prevent>
        <div className="jn__head">
          <p className="label">From idea to product — {p.title}</p>
          <button type="button" className="jn__close" onClick={onClose}>
            Close <span aria-hidden="true">✕</span>
          </button>
        </div>
        <ol className="jn__rail" style={{ '--stages': stages.length }}>
          {stages.map((x, i) => (
            <li key={x.name}>
              <button type="button" className={cx(i <= at && 'is-past')} aria-current={i === at ? 'step' : undefined} onClick={() => setAt(i)}>
                <span>{pad(i + 1)}</span>
                {x.name}
              </button>
            </li>
          ))}
        </ol>
        <div className="jn__body" key={s.name}>
          <div className="jn__words">
            <h4>{s.name}</h4>
            <p>{s.text}</p>
            {s.facts?.length > 0 && (
              <ul>
                {s.facts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
            {at === stages.length - 1 && (
              <Link to={`/work/${p.id}`} className="pj__action pj__action--main">
                The full case study <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
          <figure className="jn__shot">
            <img src={s.shot.src} alt={s.shot.alt ?? ''} loading="lazy" decoding="async" />
            <figcaption className="label">The finished site{s.shot.caption ? ` — ${s.shot.caption}` : ''}</figcaption>
          </figure>
        </div>
      </div>
    </>
  )
}
