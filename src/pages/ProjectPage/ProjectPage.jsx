import { useLayoutEffect } from 'react'
import { Link } from '../../router'
import { scrollToY } from '../../lib/smooth'
import { site } from '../../data/site'
import { getNextProject, repoOf, statusLabel } from '../../data/projects'
import CodeViewer from '../../components/CodeViewer/CodeViewer'
import ProjectMedia from '../../components/ProjectMedia/ProjectMedia'
import BrowserFrame from '../../components/BrowserFrame/BrowserFrame'
import LivePreview from '../../components/LivePreview/LivePreview'
import { Reveal } from '../../components/Motion/Reveal'
import AdPlayer from './AdPlayer'
import { hostOf, pad, themeVars } from '../../utils'
import './ProjectPage.css'

/*
  A case study, in order: what it is and how to open it, the product ad, the problem and how it's
  solved, what users get, how it's built, screens, the live site, then the next project.
  Each thing said once.
*/
export default function ProjectPage({ project: p }) {
  const repo = repoOf(p)
  const next = getNextProject(p)
  const ad = p.video?.ad

  useLayoutEffect(() => {
    document.title = `${p.title} — ${site.name}`
    scrollToY(0, { immediate: true })
  }, [p])

  // Back to the projects list at the same spot, if that's where we came from.
  const back = (e) => {
    if (history.state?.from !== '/work') return
    e.preventDefault()
    history.back()
  }

  const facts = [
    ['Role', p.role],
    ['Built with', p.technologies.join(', ')],
    ['Status', statusLabel(p)],
    ['Live at', p.liveUrl ? hostOf(p.liveUrl) : null],
  ].filter(([, v]) => v)

  return (
    <article className="cs" style={{ ...themeVars(p) }} data-component="ProjectPage">
      <header className="cs__head">
        <nav className="cs__crumbs label" aria-label="Breadcrumb">
          <Link to="/work#projects" onClick={back} className="cs__back">
            ← All projects
          </Link>
          <span aria-hidden="true">/</span>
          <span>{p.category}</span>
        </nav>

        <div className="cs__intro">
          <div>
            <p className="cs__kicker label">
              {statusLabel(p)} · Case study
            </p>
            <h1 className="cs__title">{p.title}</h1>
            <p className="cs__hook">{p.hook ?? p.plain}</p>
          </div>
          <div className="cs__actions">
            {p.liveUrl && (
              <a href={p.liveUrl} target="_blank" rel="noreferrer" className="g-btn g-btn--solid">
                Visit {hostOf(p.liveUrl)} <span aria-hidden="true">↗</span>
              </a>
            )}
            {p.repoUrl ? (
              <a href={p.repoUrl} target="_blank" rel="noreferrer" className="g-btn">
                View the code <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <span className="cs__soon label">Code · link coming soon</span>
            )}
          </div>
        </div>
      </header>

      {/* The product ad if there is one, otherwise the screen recording. */}
      <section className="cs__film" aria-label={ad ? 'Product ad' : 'The site, recorded'} style={{ viewTransitionName: `media-${p.id}` }}>
        {ad ? (
          <>
            <AdPlayer src={ad} mobile={p.video.adMobile} poster={p.video.adPoster} title={p.title} />
            <p className="cs__caption label">Product ad · cut from the live site · {p.title}</p>
          </>
        ) : (
          <BrowserFrame url={p.liveUrl} label={p.title.toLowerCase()}>
            <ProjectMedia project={p} priority autoplay="inview" controls sizes="(min-width: 1200px) 92vw, 100vw" />
          </BrowserFrame>
        )}
      </section>

      <section className="cs__story" aria-label="Overview">
        {p.problem && (
          <Reveal className="cs__block">
            <p className="label">The problem</p>
            <h2 className="cs__h">{p.problem.headline}</h2>
            <p className="cs__p">{p.problem.text}</p>
          </Reveal>
        )}
        <Reveal className="cs__block" delay={120}>
          <p className="label">What it does</p>
          <h2 className="cs__h">{p.headline}</h2>
          <p className="cs__p">{p.description}</p>
        </Reveal>
      </section>

      {p.highlights.length > 0 ? (
        <section className="cs__gets" aria-labelledby="cs-gets">
          <div className="cs__section-head">
            <p className="label">What you get</p>
            <h2 id="cs-gets" className="cs__h">{p.highlights.length} reasons people use {p.title}</h2>
          </div>
          <ol className="cs__grid">
            {p.highlights.map((h, i) => (
              <Reveal as="li" key={h.title} className="cs__card" delay={(i % 3) * 90}>
                <span className="cs__no">{pad(i + 1)}</span>
                <h3>{h.title}</h3>
                <p>{h.benefit}</p>
              </Reveal>
            ))}
          </ol>
        </section>
      ) : (
        p.features.length > 0 && (
          <section className="cs__gets" aria-labelledby="cs-gets">
            <div className="cs__section-head">
              <p className="label">What you get</p>
              <h2 id="cs-gets" className="cs__h">Key features</h2>
            </div>
            <ol className="cs__grid">
              {p.features.map((f, i) => (
                <Reveal as="li" key={f} className="cs__card" delay={(i % 3) * 90}>
                  <span className="cs__no">{pad(i + 1)}</span>
                  <h3>{f}</h3>
                </Reveal>
              ))}
            </ol>
          </section>
        )
      )}

      <section className="cs__build" aria-labelledby="cs-build">
        <div className="cs__section-head">
          <p className="label">How it’s built</p>
          <h2 id="cs-build" className="cs__h">Designed, built and shipped end to end</h2>
        </div>
        <dl className="cs__facts">
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt className="label">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {p.gallery.length > 0 && (
        <section className="cs__screens" aria-labelledby="cs-screens">
          <div className="cs__section-head">
            <p className="label">The screens</p>
            <h2 id="cs-screens" className="cs__h">Inside {p.title}</h2>
          </div>
          <div className="cs__shots">
            {p.gallery.map((item, i) => (
              <Reveal as="figure" key={item.src} className={item.height > item.width ? 'cs__shot is-tall' : 'cs__shot'} delay={(i % 2) * 100}>
                <img src={item.src} alt={item.alt} width={item.width} height={item.height} loading="lazy" decoding="async" />
                {item.caption && <figcaption className="label">{item.caption}</figcaption>}
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {p.liveUrl && p.embed && (
        <section className="cs__live" aria-label="Live site">
          <LivePreview project={p} />
        </section>
      )}

      {repo && (
        <section className="cs__code" aria-labelledby="cs-code">
          <p className="label" id="cs-code">
            The code, read straight from GitHub
          </p>
          <CodeViewer owner={repo[0]} repo={repo[1]} />
        </section>
      )}

      {p.liveUrl && (
        <section className="cs__end">
          <p className="label">See it for yourself</p>
          <a href={p.liveUrl} target="_blank" rel="noreferrer" className="cs__big">
            {hostOf(p.liveUrl)} <span aria-hidden="true">↗</span>
          </a>
        </section>
      )}

      {next !== p && (
        <Link to={`/work/${next.id}`} className="cs__next" data-cursor="view">
          <span className="label">Next project</span>
          <span className="cs__next-title">
            {next.title} <span aria-hidden="true">→</span>
          </span>
          {next.image && (
            <span className="cs__next-img">
              <img src={next.image.src} alt="" loading="lazy" decoding="async" />
            </span>
          )}
        </Link>
      )}
    </article>
  )
}
