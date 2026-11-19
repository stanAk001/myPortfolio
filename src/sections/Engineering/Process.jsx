import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'
import { buildProcess } from '../../data/process'
import { getProject } from '../../data/projects'
import { Link } from '../../router'
import { useMediaQuery, useReducedMotion } from '../../hooks/useMedia'
import { Lines, Reveal } from '../../components/Motion/Reveal'
import { Screen } from '../../components/Devices/Devices'
import { tokenize } from '../../utils/highlight'
import { cx, pad } from '../../utils'
import './Process.css'

/*
  The engineering side of the story: one real product (Toolhaven) through five stages, as a film
  strip that slides sideways as you scroll. Each panel's demo plays when it reaches the centre, and
  the last one ends on the real site, running.
*/

const NOTE_COLOURS = ['#ffd75e', '#ff9f80', '#9be3b8', '#9fc9ff']

function Corkboard({ artifact }) {
  return (
    <div className="art-cork">
      <p className="art-cork__title">{artifact.title}</p>
      {artifact.lines.map((l, i) => (
        <div key={l} className="art-cork__note" style={{ '--c': NOTE_COLOURS[i % 4], '--r': `${[-5, 4, -2, 6][i % 4]}deg`, '--i': i }}>
          <span className="art-cork__pin" />
          {l}
        </div>
      ))}
      <svg className="art-cork__string" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M18 30 Q 40 55 62 28 T 86 70" />
      </svg>
    </div>
  )
}

function DesignWipe({ project }) {
  return (
    <div className="art-design">
      <img src={project?.image?.src} alt="" className="art-design__shot" />
      <div className="art-design__wire" aria-hidden="true">
        <span style={{ left: '11%', top: '5%', width: '78%', height: '3%' }} />
        <span style={{ left: '11%', top: '13%', width: '34%', height: '5%' }} />
        <span style={{ left: '11%', top: '28%', width: '46%', height: '34%' }} />
        <span style={{ left: '11%', top: '73%', width: '40%', height: '6%' }} />
        <span style={{ left: '66%', top: '27%', width: '23%', height: '25%' }} />
        <span style={{ left: '66%', top: '56%', width: '23%', height: '13%' }} />
      </div>
      <div className="art-design__redlines" aria-hidden="true">
        <i style={{ left: '11%', top: '24%', width: '46%' }}>
          <em>640</em>
        </i>
        <i className="v" style={{ left: '61%', top: '28%', height: '34%' }}>
          <em>48</em>
        </i>
        <i style={{ left: '66%', top: '24%', width: '23%' }}>
          <em>320</em>
        </i>
      </div>
      <span className="art-design__scan" aria-hidden="true" />
      <span className="art-design__tag label">Wireframe â†’ design</span>
    </div>
  )
}

function CodeTyping({ artifact }) {
  const lines = useMemo(() => artifact.code.split('\n'), [artifact])
  let delay = 0
  return (
    <div className="art-code">
      <div className="art-code__bar">
        <span className="art-code__dots">
          <i />
          <i />
          <i />
        </span>
        {artifact.title}
      </div>
      <pre>
        {lines.map((l, i) => {
          const d = delay
          delay += Math.max(0.08, l.length * 0.011)
          return (
            <span key={i} className="art-code__ln">
              <span className="art-code__no">{i + 1}</span>
              <span className="art-code__in" style={{ '--len': `${l.length}ch`, '--d': `${d}s`, '--t': `${Math.max(0.08, l.length * 0.011)}s` }}>
                {tokenize(l).map(([t, c], j) => (
                  <span key={j} className={c ? `t-${c}` : undefined}>
                    {t}
                  </span>
                ))}
              </span>
            </span>
          )
        })}
      </pre>
      <div className="art-code__log">
        {['POST /api/tools  201  18ms', 'GET  /api/tools  200  12ms', 'GET  /api/tools?q=ai  200  9ms'].map((l, i) => (
          <p key={l} style={{ '--i': i }}>
            <span>â—</span> {l}
          </p>
        ))}
      </div>
    </div>
  )
}

function Schema({ artifact }) {
  const pos = [
    { left: '4%', top: '8%' },
    { left: '56%', top: '4%' },
    { left: '8%', top: '56%' },
    { left: '58%', top: '56%' },
  ]
  return (
    <div className="art-db">
      <svg className="art-db__rels" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M40 22 C 50 22 48 16 56 16" pathLength="1" style={{ '--i': 0 }} />
        <path d="M22 44 C 22 50 22 52 22 58" pathLength="1" style={{ '--i': 1 }} />
        <path d="M72 38 C 72 48 72 50 72 58" pathLength="1" style={{ '--i': 2 }} />
      </svg>
      {artifact.models.map((m, i) => (
        <div key={m.name} className="art-db__table" style={{ ...pos[i % 4], '--i': i }}>
          <p className="art-db__name">
            <span>â–¦</span> {m.name}
          </p>
          <ul>
            {m.fields.map((f) => (
              <li key={f} className={f.includes('â†’') ? 'is-rel' : undefined}>
                {f}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function Deploy({ artifact, project, active }) {
  const steps = artifact.lines.filter((l) => l.cmd || l.ok)
  return (
    <div className="art-deploy">
      <div className="art-deploy__panel">
        <p className="art-deploy__head">
          <span className="art-deploy__tri">â–²</span> Deployment
          <span className="art-deploy__state">Ready</span>
        </p>
        <ol>
          {steps.map((s, i) => (
            <li key={i} style={{ '--i': i }}>
              <span className="art-deploy__check" />
              {s.cmd ?? `Production: ${project?.url ?? 'live'}`}
            </li>
          ))}
        </ol>
        <span className="art-deploy__bar">
          <i />
        </span>
      </div>
      <div className="art-deploy__site">
        <div className="art-deploy__chrome">
          <span>ðŸ”’ {project?.url}</span>
        </div>
        <Screen src={project?.video?.mp4} poster={project?.image?.src} playing={active} className="art-deploy__video" />
      </div>
    </div>
  )
}

function Artifact({ step, project, active }) {
  switch (step.artifact.type) {
    case 'note':
      return <Corkboard artifact={step.artifact} />
    case 'wireframe':
      return <DesignWipe project={project} />
    case 'code':
      return <CodeTyping artifact={step.artifact} />
    case 'schema':
      return <Schema artifact={step.artifact} />
    case 'terminal':
      return <Deploy artifact={step.artifact} project={project} active={active} />
    default:
      return null
  }
}

export default function Process() {
  const { steps, projectId } = buildProcess
  const project = getProject(projectId)
  const root = useRef(null)
  const track = useRef(null)
  const reduced = useReducedMotion()
  const wide = useMediaQuery('(min-width: 900px) and (min-height: 600px)')
  const pinned = wide && !reduced
  const [active, setActive] = useState(pinned ? -1 : steps.length)

  useLayoutEffect(() => {
    if (!pinned) {
      setActive(steps.length)
      return
    }
    const ctx = gsap.context(() => {
      const distance = () => track.current.scrollWidth - window.innerWidth
      gsap.to(track.current, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          snap: { snapTo: 1 / (steps.length - 1), duration: { min: 0.25, max: 0.7 }, delay: 0.1, ease: 'power2.inOut' },
          onUpdate(self) {
            const i = Math.round(self.progress * (steps.length - 1))
            setActive((a) => (a === i ? a : i))
            root.current?.style.setProperty('--progress', self.progress)
          },
          onEnter: () => setActive((a) => (a < 0 ? 0 : a)),
        },
      })
    }, root)
    return () => ctx.revert()
  }, [pinned, steps.length])

  return (
    <div ref={root} className={cx('blog', pinned ? 'blog--pinned' : 'blog--stacked')} data-component="BuildLog">
      <div className="blog__head">
        <div>
          <p className="label">The engineerâ€™s cut â€” {project?.title}</p>
          <Reveal as="h3" lines className="blog__title display">
            <Lines lines={['From idea', <>to <em>production.</em></>]} />
          </Reveal>
        </div>
        <ol className="blog__steps" aria-hidden="true">
          {steps.map((s, i) => (
            <li key={s.id} className={cx(i === active && 'is-on', i < active && 'is-done')}>
              <span>{pad(i + 1)}</span>
              {s.label}
            </li>
          ))}
          <span className="blog__fill" />
        </ol>
      </div>

      <div ref={track} className="blog__track">
        {steps.map((s, i) => (
          <article key={s.id} className={cx('blog__panel', `blog__panel--${s.artifact.type}`, (i === active || !pinned) && 'is-active')}>
            <div className="blog__copy">
              <p className="blog__num" aria-hidden="true">
                {pad(i + 1)}
              </p>
              <p className="label">
                Stage {pad(i + 1)} â€” {s.label}
              </p>
              <p className="blog__text">{s.text}</p>
              {i === steps.length - 1 && project && (
                <Link to={`/work/${project.id}`} className="arrow-link">
                  Open the case study â†’
                </Link>
              )}
            </div>
            <div className="blog__art" key={i === active || !pinned ? 'on' : 'off'}>
              <Artifact step={s} project={project} active={i === active} />
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
