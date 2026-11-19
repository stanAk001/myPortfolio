import { useState } from 'react'
import { Link } from '../../router'
import { statusLabel } from '../../data/projects'
import ProjectMedia from '../../components/ProjectMedia/ProjectMedia'
import ProjectDNA from '../../components/ProjectDNA/ProjectDNA'
import BrowserFrame from '../../components/BrowserFrame/BrowserFrame'
import { useReveal } from '../../components/Motion/Reveal'
import SceneBackdrop from './SceneBackdrop'
import Split from '../../components/Motion/Split'
import Magnetic from '../../components/Motion/Magnetic'
import { cx, themeVars } from '../../utils'

export default function Scene({ project: p, index, pinned, active, onFocus }) {
  const [engaged, setEngaged] = useState(false)
  const reveal = useReveal()
  const href = `/work/${p.id}`

  return (
    <article
      ref={pinned ? undefined : reveal}
      id={`project-${p.id}`}
      className={cx(
        'scene',
        `scene--${p.theme.treatment ?? 'plain'}`,
        index % 2 === 1 && 'scene--flip',
        (active || !pinned) && 'is-active',
        engaged && 'is-engaged',
      )}
      style={{ ...themeVars(p), '--len': p.title.length, zIndex: index + 1 }}
      aria-labelledby={`scene-${p.id}`}
      onFocus={onFocus}
      data-component="ProjectScene"
    >
      <SceneBackdrop project={p} />

      <div className="scene__head">
        <p className="scene__meta label">
          <span className="scene__num">{p.number}</span>
          <span>{p.category}</span>
          {p.year && <span>{p.year}</span>}
          <span className="scene__status">
            <span className="status-dot" data-status={p.status} />
            {statusLabel(p)}
          </span>
        </p>
        <h3 id={`scene-${p.id}`} className="scene__title display">
          <span className="scene__line">
            <span>
              <Split>{p.title}</Split>
            </span>
          </span>
        </h3>
      </div>

      <div className="scene__visual">
        <div className="scene__zoom">
          <BrowserFrame url={p.liveUrl} label={p.url ?? p.title}>
            {/* A copy of the CTA for mouse users, hidden from keyboards and screen readers so the project is only announced once. */}
            <Link
              to={href}
              className="scene__media-link"
              tabIndex={-1}
              aria-hidden="true"
              data-cursor="view"
              onPointerEnter={() => setEngaged(true)}
              onPointerLeave={() => setEngaged(false)}
            >
              <ProjectMedia
                project={p}
                autoplay="inview"
                badge={false}
                sizes="(min-width: 900px) 58vw, 100vw"
                enabled={active || !pinned}
                vtName={active || !pinned ? `media-${p.id}` : undefined}
              />
            </Link>
          </BrowserFrame>
        </div>
      </div>

      <div className="scene__body">
        {p.tagline.length > 0 && (
          <p className="scene__tagline">
            {p.tagline.map((line, i) => (
              <span className="scene__line" key={i}>
                <span style={{ '--i': i + 1 }}>{line}</span>
              </span>
            ))}
          </p>
        )}
        <p className="scene__stack label">{p.technologies.join(' / ')}</p>
        <div className="scene__ctas">
          <Magnetic>
            <Link to={href} className="btn btn--solid scene__cta" data-cursor="view">
              Case study<span className="sr-only">: {p.title}</span> <span aria-hidden="true">→</span>
            </Link>
          </Magnetic>
          {p.liveUrl && (
            <Magnetic>
              <a href={p.liveUrl} target="_blank" rel="noreferrer" className="btn scene__visit">
                <span className="status-dot" data-status="live" aria-hidden="true" />
                {p.url ?? 'Visit site'} <span aria-hidden="true">↗</span>
              </a>
            </Magnetic>
          )}
          {p.repoUrl && (
            <Magnetic>
              <a href={p.repoUrl} target="_blank" rel="noreferrer" className="btn">
                Code <span aria-hidden="true">↗</span>
              </a>
            </Magnetic>
          )}
        </div>
        {/* Last, so hiding it on desktop doesn't leave a gap in the middle of the column. */}
        <ProjectDNA project={p} fields={['role', 'focus']} className="scene__dna" />
      </div>
    </article>
  )
}
