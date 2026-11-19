import { useLayoutEffect, useRef, useState } from 'react'
import { ScrollTrigger } from '../../lib/gsap'
import { Link } from '../../router'
import { site } from '../../data/site'
import { projects } from '../../data/projects'
import { useReducedMotion } from '../../hooks/useMedia'
import Chapter from '../../components/Chapter/Chapter'
import { Lines, Reveal } from '../../components/Motion/Reveal'
import { Screen } from '../../components/Devices/Devices'
import { rich } from '../../utils/rich'
import { cx, hostOf, themeVars } from '../../utils'
import { METERS, VISUALS } from './Visuals'
import './Problems.css'

/*
  One scene per project. The stage sticks while you scroll through it. First the problem grows
  (tabs pile up, jargon swarms, DMs flood in), then a line crosses it out and the real site wipes
  in, playing, with what it fixed.
*/
function Case({ project: p, index }) {
  const root = useRef(null)
  const meter = useRef(null)
  const reduced = useReducedMotion()
  const [solved, setSolved] = useState(reduced)
  const prob = p.problem
  const Visual = VISUALS[prob.visual] ?? VISUALS.tabs
  const host = p.url ?? hostOf(p.liveUrl)

  useLayoutEffect(() => {
    const el = root.current
    const update = (progress) => {
      // 0 → 0.45 the problem grows, 0.45 → 0.75 the fix comes in, then a pause to look at it.
      const grow = Math.min(1, progress / 0.45)
      const fix = Math.min(1, Math.max(0, (progress - 0.45) / 0.3))
      el.style.setProperty('--grow', grow.toFixed(3))
      el.style.setProperty('--fix', fix.toFixed(3))
      if (meter.current) meter.current.textContent = (METERS[prob.visual] ?? METERS.tabs)(grow)
      setSolved((s) => (s === fix > 0.6 ? s : fix > 0.6))
    }
    if (reduced) {
      update(1)
      return
    }
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => update(self.progress),
      onRefresh: (self) => update(self.progress),
    })
    return () => st.kill()
  }, [reduced, prob.visual])

  return (
    <article ref={root} className={cx('pc', solved && 'is-solved')} style={themeVars(p)} aria-labelledby={`pc-${p.id}`}>
      <div className="pc__stage">
        <div className="pc__copy">
          <p className="pc__meta label">
            <span className="pc__no">{String(index + 1).padStart(2, '0')}</span>
            {p.title}
            <span aria-hidden="true">·</span>
            {host}
          </p>

          <p className="pc__kicker pc__kicker--problem label">The problem</p>
          <h3 id={`pc-${p.id}`} className="pc__problem display">
            <span className="pc__strike">{prob.headline}</span>
          </h3>
          <p className="pc__text">{prob.text}</p>

          <div className="pc__fix" aria-hidden={!solved}>
            <p className="pc__kicker pc__kicker--fix label">What I built</p>
            <p className="pc__solution">{prob.solution}</p>
            <ul className="pc__fixes">
              {prob.fixes?.map((f, i) => (
                <li key={f} style={{ '--i': i }}>
                  <span aria-hidden="true">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link to={`/work/${p.id}`} className="arrow-link pc__link">
              See how I built {p.title} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="pc__frame">
          <div className="pc__chrome">
            <span className="pc__dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="pc__url">
              <span className="pc__url-before">{prob.search}</span>
              <span className="pc__url-after">🔒 {host}</span>
            </span>
            <span className="pc__state label">{solved ? 'After' : 'Before'}</span>
          </div>
          <div className="pc__view">
            <div className="pc__before" aria-hidden="true">
              <Visual meter={meter} />
            </div>
            <div className="pc__after">
              <Screen src={p.video?.mp4} poster={p.image?.src} playing={solved} className="pc__video" />
            </div>
            <span className="pc__wipe" aria-hidden="true">
              <em>Before</em>
              <em>After</em>
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function Problems() {
  const list = projects.filter((p) => p.problem?.headline)
  if (!list.length) return null
  return (
    <section id="problems" className="pb theme-dark" data-component="Problems" aria-labelledby="pb-title">
      <div className="pb__head section">
        <Chapter number="01">Why they exist</Chapter>
        <div className="pb__head-grid">
          <Reveal as="h2" lines id="pb-title" className="pb__title display">
            <Lines lines={[rich(site.problems?.headline ?? 'Every product started as *a frustration.*')]} />
          </Reveal>
          <Reveal as="p" className="pb__intro lead" delay={150}>
            {site.problems?.intro}
          </Reveal>
        </div>
      </div>
      {list.map((p, i) => (
        <Case key={p.id} project={p} index={i} />
      ))}
    </section>
  )
}
