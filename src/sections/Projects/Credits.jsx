import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'
import { Link } from '../../router'
import { site } from '../../data/site'
import { useReducedMotion } from '../../hooks/useMedia'
import { liveProjects } from '../../data/projects'
import { PROJECTS } from '../Gallery/Gallery'
import './Credits.css'

/*
  The reel ends like a film does, with credits. Every role on all five products went to the same
  person, which is the point, said with a straight face. The credits roll as you scroll (tied to
  scroll, not a timer) and stop on the only open role: the next production.
*/
const ROLES = [
  ['Product & design', 'Interface · type · motion'],
  ['Frontend', 'React · Vite'],
  ['Backend', 'Node.js · Express'],
  ['Database', 'PostgreSQL'],
  ['Shipped & kept running', `${liveProjects.length} live sites`],
]

export default function Credits() {
  const root = useRef(null)
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: 'top 85%', end: 'center 50%', scrub: 0.6 } })
        .fromTo('.cr__row', { yPercent: 160, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.12, ease: 'none' }, 0)
        .fromTo('.cr__next', { y: 40, opacity: 0 }, { y: 0, opacity: 1, ease: 'none' }, 0.55)
    }, root)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section ref={root} className="cr" aria-labelledby="cr-title">
      <p className="cr__label label">
        <span>End credits</span>
        <span>
          {PROJECTS.length} productions · {PROJECTS.map((p) => p.title).join(' · ')}
        </span>
      </p>
      <h2 id="cr-title" className="sr-only">
        Credits
      </h2>
      <dl className="cr__list">
        {ROLES.map(([role, how]) => (
          <div key={role} className="cr__row">
            <dt>
              {role}
              <small>{how}</small>
            </dt>
            <dd>{site.name}</dd>
          </div>
        ))}
      </dl>
      <div className="cr__next">
        <p>
          Next production: <em>yours.</em>
        </p>
        <Link to="/#contact" className="cr__go" data-cursor="explore">
          Let’s talk <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  )
}
