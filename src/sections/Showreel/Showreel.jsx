import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'
import { pageReady } from '../../lib/loaded'
import { Link } from '../../router'
import { site } from '../../data/site'
import { projects } from '../../data/projects'
import { useFinePointer, useReducedMotion } from '../../hooks/useMedia'
import { useInView } from '../../hooks/useInView'
import { Laptop, Phone, Screen } from '../../components/Devices/Devices'
import Magnetic from '../../components/Motion/Magnetic'
import Split from '../../components/Motion/Split'
import { rich } from '../../utils/rich'
import { cx, hostOf } from '../../utils'
import './Showreel.css'

const SLIDE = 9000

/*
  The landing: no code, no jargon. Real sites, recorded live, playing on a laptop and a phone, each
  with one plain sentence about what it is. Anyone gets "he builds real websites" in seconds.
*/
export default function Showreel() {
  const reel = projects.filter((p) => p.video?.mp4)
  const root = useRef(null)
  const stage = useRef(null)
  const visible = useInView(root)
  const reduced = useReducedMotion()
  const fine = useFinePointer()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const current = reel[index]

  // Auto-advance while on screen. Paused when hidden, hovered, or for reduced motion.
  useEffect(() => {
    if (!visible || paused || reduced || reel.length < 2) return
    const id = setTimeout(() => setIndex((i) => (i + 1) % reel.length), SLIDE)
    return () => clearTimeout(id)
  }, [index, visible, paused, reduced, reel.length])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (reduced) return
      const intro = gsap
        .timeline({ paused: true, defaults: { ease: 'expo.out' } })
        .from('.sr__laptop', { y: 120, rotationX: 28, opacity: 0, duration: 1.8, transformPerspective: 1600 }, 0)
        .from('.sr__phone', { y: 160, x: -40, rotation: -8, opacity: 0, duration: 1.8 }, 0.25)
        .from('.sr__headline .split__char', { yPercent: 115, duration: 1.1, stagger: 0.012 }, 0.2)
        .from('.sr__sub, .sr__ctas, .sr__caption, .sr__tabs', { y: 24, opacity: 0, duration: 1, stagger: 0.1 }, 0.7)
      pageReady.then(() => intro.play())

      // Scrolling away: the devices sink and tilt back, the text lifts off.
      const out = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true }
      gsap.to('.sr__devices', { yPercent: 18, rotationX: 14, scale: 0.92, transformPerspective: 1600, ease: 'none', scrollTrigger: out })
      gsap.to('.sr__copy', { yPercent: -22, opacity: 0, ease: 'none', scrollTrigger: { ...out, start: '25% top' } })
    }, root)
    return () => ctx.revert()
  }, [reduced])

  // A gentle 3D tilt toward the cursor.
  useEffect(() => {
    if (!fine || reduced) return
    const el = stage.current
    const rx = gsap.quickTo(el, 'rotationX', { duration: 1.2, ease: 'power3' })
    const ry = gsap.quickTo(el, 'rotationY', { duration: 1.2, ease: 'power3' })
    gsap.set(el, { transformPerspective: 1800 })
    const move = (e) => {
      if (window.scrollY > window.innerHeight) return
      rx((e.clientY / window.innerHeight - 0.5) * -5)
      ry((e.clientX / window.innerWidth - 0.5) * 7)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [fine, reduced])

  if (!current) return null

  return (
    <section ref={root} className="sr theme-dark" data-component="Showreel" aria-labelledby="sr-title">
      {/* Background light: the current site's colours, blurred, spilling into the section. */}
      <div className="sr__ambient" aria-hidden="true">
        {reel.map((p, i) => (
          <img key={p.id} src={p.image?.src} alt="" className={cx(i === index && 'is-on')} />
        ))}
      </div>

      <div className="sr__masthead">
        <p className="sr__eyebrow label">
          <span className="sr__dot" aria-hidden="true" />
          {site.name} — {site.role}
        </p>
        <p className="sr__eyebrow label sr__count">
          {String(reel.length).padStart(2, '0')} sites, live on the internet
        </p>
      </div>

      <h1 id="sr-title" className="sr__headline display">
        <Split>{rich(site.hero?.headline ?? '')}</Split>
      </h1>

      <div className="sr__copy">
        <p className="sr__sub">{site.hero?.sub}</p>
        <div className="sr__ctas">
          <Magnetic>
            <Link to="/work#story" className="btn btn--solid">
              See how I build <span aria-hidden="true">↓</span>
            </Link>
          </Magnetic>
          <Magnetic>
            <Link to="/work#contact" className="btn">
              Work with me
            </Link>
          </Magnetic>
        </div>
      </div>

      <div className="sr__stage" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
        <div ref={stage} className="sr__devices">
          <Laptop className="sr__laptop">
            {reel.map((p, i) => (
              <Screen
                key={p.id}
                src={p.video.mp4}
                poster={p.image?.src}
                playing={visible && i === index}
                className={cx('device__media sr__media', i === index && 'is-on')}
              />
            ))}
          </Laptop>
          <Phone className="sr__phone">
            {reel.map((p, i) => (
              <Screen
                key={p.id}
                src={p.video.phone}
                poster={p.gallery?.find((g) => g.height > g.width)?.src}
                playing={visible && i === index}
                className={cx('device__media sr__media', i === index && 'is-on')}
              />
            ))}
          </Phone>
        </div>

        <div className="sr__caption" aria-live="polite">
          <p className="sr__live label">
            <span className="status-dot" data-status="live" aria-hidden="true" /> Live now — {current.url ?? hostOf(current.liveUrl)}
          </p>
          <p className="sr__what" key={current.id}>
            <b>{current.title}</b> {current.plain}
          </p>
          <Link to={`/work/${current.id}`} className="arrow-link">
            See how I built it <span aria-hidden="true">→</span>
          </Link>
        </div>

        <ol className="sr__tabs" aria-label="Choose a project">
          {reel.map((p, i) => (
            <li key={p.id}>
              <button type="button" aria-current={i === index ? 'true' : undefined} onClick={() => setIndex(i)}>
                <span>{p.title}</span>
                <i key={i === index ? `${index}-${paused}` : 'idle'} className={cx(i === index && !paused && !reduced && 'is-running')} style={{ '--slide': `${SLIDE}ms` }} />
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
