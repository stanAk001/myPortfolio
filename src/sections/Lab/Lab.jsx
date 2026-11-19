import { labProjects, statusLabel } from '../../data/projects'
import { Link } from '../../router'
import Chapter from '../../components/Chapter/Chapter'
import { Lines, Reveal } from '../../components/Motion/Reveal'
import ProjectMedia from '../../components/ProjectMedia/ProjectMedia'
import { themeVars } from '../../utils'
import './Lab.css'

// Everything not in the main reel: client builds, experiments, things on Vercel.
export default function Lab() {
  if (labProjects.length === 0) return null
  return (
    <section id="lab" className="lab section theme-dark" data-component="Lab" aria-labelledby="lab-title">
      <Chapter number="03">The lab</Chapter>
      <div className="lab__head grid">
        <Reveal as="h2" lines id="lab-title" className="lab__title display">
          <Lines lines={['More things', <em key="s">I’ve shipped.</em>]} />
        </Reveal>
        <Reveal as="p" className="lab__intro lead" delay={150}>
          Client builds and side projects, deployed and running.
        </Reveal>
      </div>
      <div className="lab__grid">
        {labProjects.map((p, i) => (
          <Reveal as="article" key={p.id} className="lab__card" delay={(i % 2) * 120} style={themeVars(p)}>
            <Link to={`/work/${p.id}`} className="lab__media" data-cursor="view" tabIndex={-1} aria-hidden="true">
              <ProjectMedia project={p} autoplay="inview" sizes="(min-width: 900px) 45vw, 100vw" badge={false} />
            </Link>
            <div className="lab__meta">
              <p className="label">
                {p.category}
                <span className="lab__status">
                  <span className="status-dot" data-status={p.status} /> {statusLabel(p)}
                </span>
              </p>
              <h3>
                <Link to={`/work/${p.id}`}>{p.title}</Link>
              </h3>
              {p.tagline.length > 0 && <p className="lab__tag">{p.tagline.join(' ')}</p>}
              <div className="lab__links">
                {p.liveUrl && (
                  <a href={p.liveUrl} target="_blank" rel="noreferrer" className="arrow-link">
                    {p.url ?? 'Live site'} ↗
                  </a>
                )}
                {p.repoUrl && (
                  <a href={p.repoUrl} target="_blank" rel="noreferrer" className="arrow-link">
                    Code ↗
                  </a>
                )}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
