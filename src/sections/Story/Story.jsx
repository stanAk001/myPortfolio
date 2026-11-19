import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'
import { Link } from '../../router'
import { site } from '../../data/site'
import { getProject } from '../../data/projects'
import { useMediaQuery, useReducedMotion } from '../../hooks/useMedia'
import { Phone, Screen } from '../../components/Devices/Devices'
import Split from '../../components/Motion/Split'
import { rich } from '../../utils/rich'
import { cx, hostOf, pad } from '../../utils'
import Sketch from './Sketch'
import './Story.css'

const STEPS = ['Idea', 'Design', 'Build', 'Launch', 'Use']

/*
  "How an idea becomes a real website", told with one real product and no code. One screen goes
  through five states as you scroll: sticky note → pencil sketch → the real design → split into the
  layers behind it → live on the internet → the real recording on a laptop and a phone.
*/
export default function Story() {
  const root = useRef(null)
  const reduced = useReducedMotion()
  const compact = useMediaQuery('(max-width: 900px)')
  const [chapter, setChapter] = useState(0)
  const story = site.story ?? {}
  const project = getProject(story.projectId) ?? null
  const chapters = story.chapters ?? []
  const host = project?.url ?? hostOf(project?.liveUrl) ?? ''
  const phoneShot = project?.gallery?.find((g) => g.height > g.width)?.src

  useLayoutEffect(() => {
    if (reduced || !project) return
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root.current)
      const url = q('.sty__url-text')[0]
      const typed = { n: 0 }

      gsap.set('.sty__world', { transformPerspective: 2000 })
      gsap.set(['.sty__chrome', '.sty__swatches > *', '.sty__layer', '.sty__globe', '.sty__phone', '.sty__video', '.sty__badge', '.sty__layer-label'], { autoAlpha: 0 })
      gsap.set('.sty__shot', { clipPath: 'inset(0% 100% 0% 0%)' })
      gsap.set('.sty__screen', { backgroundColor: '#dcd6c9' })
      gsap.set('.sty__phone', { xPercent: 40, yPercent: 20, rotation: 6 })

      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut', duration: 1 },
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: () => `+=${window.innerHeight * (compact ? 4.5 : 5.5)}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          snap: { snapTo: 'labels', duration: { min: 0.3, max: 0.9 }, delay: 0.1, ease: 'power2.inOut' },
          // self.animation, not `tl`: this can fire while the timeline is still being built.
          onUpdate(self) {
            const { labels } = self.animation
            const t = self.progress * self.animation.duration()
            let c = 0
            ;['c0', 'c1', 'c2', 'c3', 'c4'].forEach((l, i) => {
              if (labels[l] !== undefined && t >= labels[l] - 0.6) c = i
            })
            setChapter((prev) => (prev === c ? prev : c))
          },
        },
      })

      // 0, Idea: the sticky note lands and the sketch draws itself.
      // Pause (and snap) once the sketch is fully drawn, not before it starts.
      tl.fromTo('.sty__note', { y: -60, rotation: -14, autoAlpha: 0 }, { y: 0, rotation: -6, autoAlpha: 1, duration: 0.6, ease: 'back.out(1.6)' }, 0)
        .fromTo(root.current, { '--draw': 0 }, { '--draw': 1, duration: 1.4, ease: 'none' }, 0.2)
        .addLabel('c0')
        .to({}, { duration: 0.4 })

      // 1, Design: the browser shows up and the real design wipes across the sketch.
      tl.addLabel('d', '+=0.1')
        .to('.sty__note', { x: -120, y: -40, rotation: -18, autoAlpha: 0, duration: 0.7 }, 'd')
        .to('.sty__chrome', { autoAlpha: 1, duration: 0.5 }, 'd')
        .to('.sty__screen', { backgroundColor: '#ffffff', duration: 0.5 }, 'd')
        .to('.sty__shot', { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power3.inOut' }, 'd+=0.2')
        .to('.sk', { opacity: 0, duration: 0.6 }, 'd+=1.2')
        .to('.sty__swatches > *', { autoAlpha: 1, scale: 1, stagger: 0.08, duration: 0.6, ease: 'back.out(2)' }, 'd+=0.5')
        .addLabel('c1')
        .to({}, { duration: 0.5 })

      // 2, Build: the screen tips back and the layers behind it slide out.
      tl.addLabel('b', '+=0.1')
        .to('.sty__swatches > *', { autoAlpha: 0, scale: 0.6, stagger: 0.04, duration: 0.4 }, 'b')
        .to('.sty__world', { rotationX: 56, rotationZ: -32, scale: compact ? 0.72 : 0.78, y: compact ? 10 : -10, duration: 1.4 }, 'b')
        .to('.sty__screen', { z: compact ? 70 : 120, duration: 1.4 }, 'b')
        .to('.sty__layer', { autoAlpha: 1, duration: 0.6, stagger: 0.15 }, 'b+=0.4')
        .fromTo('.sty__layer--brain', { z: compact ? 70 : 120 }, { z: 0, duration: 1.1 }, 'b+=0.4')
        .fromTo('.sty__layer--memory', { z: compact ? 70 : 120 }, { z: compact ? -70 : -120, duration: 1.3 }, 'b+=0.5')
        .to('.sty__layer-label', { autoAlpha: 1, stagger: 0.12, duration: 0.5 }, 'b+=1.3')
        .addLabel('c2')
        .to({}, { duration: 0.6 })

      // 3, Launch: everything folds back into one screen, the address types in, the globe lights up.
      tl.addLabel('l', '+=0.1')
        .to('.sty__layer-label', { autoAlpha: 0, duration: 0.3 }, 'l')
        .to('.sty__layer', { z: 0, autoAlpha: 0, duration: 0.9 }, 'l')
        .to('.sty__world', { rotationX: 0, rotationZ: 0, scale: compact ? 0.86 : 0.9, y: 0, duration: 1.2 }, 'l')
        .to('.sty__screen', { z: 0, duration: 1.2 }, 'l')
        .to('.sty__globe', { autoAlpha: 1, scale: 1, duration: 1 }, 'l+=0.4')
        .fromTo(
          typed,
          { n: 0 },
          {
            n: host.length,
            duration: 0.8,
            ease: 'none',
            onUpdate: () => (url.textContent = host.slice(0, Math.round(typed.n))),
          },
          'l+=0.5',
        )
        .to('.sty__badge', { autoAlpha: 1, y: 0, duration: 0.4, ease: 'back.out(2)' }, 'l+=1.3')
        .addLabel('c3')
        .to({}, { duration: 0.5 })

      // 4, Use: the globe fades, the real recording plays, and the phone joins it.
      tl.addLabel('u', '+=0.1')
        .to('.sty__globe', { autoAlpha: 0, scale: 1.2, duration: 0.7 }, 'u')
        .to('.sty__video', { autoAlpha: 1, duration: 0.6 }, 'u+=0.2')
        .to('.sty__world', { scale: compact ? 0.82 : 0.86, x: compact ? '-8%' : '-6%', duration: 1 }, 'u')
        .to('.sty__phone', { autoAlpha: 1, xPercent: 0, yPercent: 0, rotation: 0, duration: 1.1, ease: 'expo.out' }, 'u+=0.4')
        .addLabel('c4')
        .to({}, { duration: 0.4 })

      // Dev-only hook so automated screenshots can land exactly on each chapter.
      if (import.meta.env.DEV) window.__story = tl
    }, root)
    return () => ctx.revert()
  }, [reduced, compact, project, host])

  // A tap travels through the layers on a loop while the Build chapter is showing.
  useEffect(() => {
    if (reduced || chapter !== 2) return
    const ctx = gsap.context(() => {
      const z = compact ? 70 : 120
      gsap
        .timeline({ repeat: -1, repeatDelay: 0.4 })
        .set('.sty__packet', { autoAlpha: 0, z, left: '15%', top: '81%' })
        .fromTo('.sty__tap', { scale: 0.3, autoAlpha: 1 }, { scale: 1.6, autoAlpha: 0, duration: 0.6, ease: 'power2.out' })
        .to('.sty__packet', { autoAlpha: 1, duration: 0.1 }, 0.1)
        .to('.sty__packet', { z: 0, left: '50%', top: '50%', duration: 0.6, ease: 'power2.inOut' }, 0.2)
        .to('.sty__layer--brain', { boxShadow: '0 0 0 2px #c56a3d, 0 0 60px rgba(255,91,38,.45)', duration: 0.2, yoyo: true, repeat: 1 }, 0.75)
        .to('.sty__packet', { z: -z, left: '50%', top: '50%', duration: 0.5, ease: 'power2.inOut' }, 0.95)
        .to('.sty__layer--memory', { boxShadow: '0 0 0 2px #5fd39a, 0 0 60px rgba(95,211,154,.4)', duration: 0.2, yoyo: true, repeat: 1 }, 1.4)
        .to('.sty__packet', { z, left: '15%', top: '81%', duration: 0.8, ease: 'power2.inOut', backgroundColor: '#5fd39a' }, 1.6)
        .to('.sty__packet', { autoAlpha: 0, duration: 0.2, backgroundColor: '#c56a3d' }, 2.4)
    }, root)
    return () => ctx.revert()
  }, [chapter, reduced, compact])

  if (!project) return null
  const active = chapters[chapter] ?? {}

  if (reduced) {
    return (
      <section id="story" className="sty sty--static theme-dark" data-component="Story" aria-labelledby="sty-title">
        <p className="label">How an idea becomes a real website</p>
        <h2 id="sty-title" className="sty__title display">{rich(chapters[0]?.title ?? '')}</h2>
        <ol className="sty__static">
          {chapters.map((c, i) => (
            <li key={i}>
              <span className="label">
                {pad(i + 1)} — {STEPS[i]}
              </span>
              <h3 className="display">{rich(c.title)}</h3>
              <p>{c.text}</p>
            </li>
          ))}
        </ol>
        <img className="sty__static-shot" src={project.image.src} alt={project.image.alt} />
      </section>
    )
  }

  return (
    <section ref={root} id="story" className="sty theme-dark" data-component="Story" aria-labelledby="sty-title" data-chapter={chapter}>
      <div className="sty__copy">
        <p className="sty__kicker label">How an idea becomes a real website</p>
        <div className="sty__say" key={chapter}>
          <p className="sty__num label">
            {pad(chapter + 1)} / {pad(STEPS.length)} — {STEPS[chapter]}
          </p>
          <h2 id="sty-title" className="sty__title display">
            <Split>{rich(active.title ?? '')}</Split>
          </h2>
          <p className="sty__text">{active.text}</p>
          {chapter === 4 && (
            <div className="sty__ctas">
              <Link to={`/work/${project.id}`} className="btn btn--solid">
                See the full project →
              </Link>
              <Link to="/work#contact" className="btn">
                Your idea could be next
              </Link>
            </div>
          )}
        </div>
        <ol className="sty__steps" aria-hidden="true">
          {STEPS.map((s, i) => (
            <li key={s} className={cx(i === chapter && 'is-on', i < chapter && 'is-done')}>
              <i />
              {s}
            </li>
          ))}
        </ol>
      </div>

      <div className="sty__stage" aria-hidden="true">
        <div className="sty__globe">
          <svg viewBox="0 0 400 400">
            <circle cx="200" cy="200" r="160" className="g__sphere" />
            {[-60, -30, 0, 30, 60].map((lat) => (
              <ellipse key={lat} cx="200" cy={200 + lat * 2.2} rx={160 * Math.cos((lat * Math.PI) / 180)} ry={18 * Math.cos((lat * Math.PI) / 180)} className="g__line" />
            ))}
            {[0, 1, 2, 3, 4, 5].map((m) => (
              <ellipse key={m} cx="200" cy="200" rx="160" ry="160" className="g__meridian" style={{ '--m': m }} />
            ))}
            {[
              [140, 150], [250, 130], [300, 210], [170, 250], [230, 285], [110, 215], [205, 175],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="4" className="g__city" style={{ '--d': `${i * 0.45}s` }} />
            ))}
          </svg>
          <span className="g__ring" />
          <span className="g__ring g__ring--2" />
        </div>

        <div className="sty__world">
          <div className="sty__layer sty__layer--memory">
            <p className="sty__layer-label">
              <b>The memory</b> — a database
            </p>
            <div className="sty__rows">
              {['Products', 'Guides', 'Collections', 'Subscribers'].map((r, i) => (
                <span key={r} style={{ '--w': `${60 + ((i * 17) % 35)}%` }}>
                  <em>{r}</em>
                </span>
              ))}
            </div>
          </div>
          <div className="sty__layer sty__layer--brain">
            <p className="sty__layer-label">
              <b>The brain</b> — a server
            </p>
            <div className="sty__chips">
              <span>finds the right products</span>
              <span>keeps accounts safe</span>
              <span>sends the newsletter</span>
            </div>
          </div>

          <div className="sty__screen">
            <div className="sty__chrome">
              <span className="sty__dots">
                <i />
                <i />
                <i />
              </span>
              <span className="sty__url">
                <span className="sty__lock">🔒</span>
                <span className="sty__url-text" />
                <span className="sty__caret" />
              </span>
              <span className="sty__badge">● Live</span>
            </div>
            <div className="sty__view">
              <Sketch />
              <img className="sty__shot" src={project.image.src} alt="" />
              {project.video?.mp4 && (
                <Screen src={project.video.mp4} poster={project.image.src} playing={chapter === 4} className="sty__video" />
              )}
              <span className="sty__tap" />
            </div>
            <p className="sty__layer-label sty__layer-label--top">
              <b>What you see</b> — the website
            </p>
          </div>
          <span className="sty__packet" />
        </div>

        <div className="sty__note">
          <span className="sty__bulb">💡</span>
          {story.idea}
        </div>

        <div className="sty__swatches">
          {(project.theme?.accent ? [project.theme.accent, '#dcd6c9', '#1b1814', '#c9b79c'] : ['#e2552b', '#dcd6c9', '#1b1814']).map((c) => (
            <span key={c} className="sw" style={{ background: c }}>
              <em>{c}</em>
            </span>
          ))}
          <span className="sw sw--type">Aa</span>
          <span className="sw sw--btn">Explore →</span>
        </div>

        <Phone className="sty__phone" src={project.video?.phone} poster={phoneShot} playing={chapter === 4} />
      </div>
    </section>
  )
}
