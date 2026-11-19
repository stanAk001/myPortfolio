import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '../../lib/gsap'
import { pageReady, takeHandoff } from '../../lib/loaded'
import { useUptime } from '../../lib/uptime'
import { Link } from '../../router'
import { featuredProjects, labProjects, liveProjects } from '../../data/projects'
import { site } from '../../data/site'
import { useMediaQuery, useReducedMotion } from '../../hooks/useMedia'
import { Reveal } from '../../components/Motion/Reveal'
import { useInView } from './LiveView'
import Terminal from '../../components/Terminal/Terminal'
import Presenter from './Presenter'
import Dossier from './Dossier'
import Wall from './Wall'
import Board from './Board'
import PhoneHero from './PhoneHero'
import { Facts, LifeCards, Road, Sticker } from './Human'
import Scribble from '../../components/Scribble/Scribble'
import { cx, hostOf, pad } from '../../utils'
import './Gallery.css'

// Featured work first, side projects after.
const PROJECTS = [...featuredProjects, ...labProjects]
const REEL = PROJECTS.filter((p) => p.video?.mp4)
const SLIDE = 8000

// "Real products, *live right now.*" → two lines, the second one lighter.
const split = (text) => text.replaceAll('*', '').split(/,\s*/)

function Lines({ text }) {
  const parts = split(text)
  return parts.map((part, i) => (
    <span className="line" key={part}>
      <span className={cx(i > 0 && 'g-thin')}>{i < parts.length - 1 ? `${part},` : part}</span>
    </span>
  ))
}

/*
  One clip. Always shows the poster; only plays the recording while it's the one on screen. `start`
  skips dead time at the top of a recording and the loop goes back there, not to 0. If the recording
  fails it gets out of the way and the poster stays.
*/
function Clip({ src, poster, on, play, start = 0 }) {
  const ref = useRef(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.muted = true
    if (play) v.play().catch(() => {})
    else v.pause()
  }, [play])
  const toStart = (e) => {
    if (start) e.currentTarget.currentTime = start
  }
  const loop = (e) => {
    e.currentTarget.currentTime = start
    if (play) e.currentTarget.play().catch(() => {})
  }
  return (
    <span className={cx('rl__clip', on && 'is-on')}>
      {poster && <img src={poster} alt="" loading="eager" decoding="async" />}
      {on && src && !failed && (
        <video
          ref={ref}
          src={src}
          poster={poster}
          muted
          loop={!start}
          playsInline
          preload="auto"
          aria-hidden="true"
          onLoadedMetadata={toStart}
          onEnded={loop}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  )
}

/*
  The reel: recordings of the real sites one after another, on a laptop-width screen and a phone.
  The dossier next to it decides which one plays; this just shows it with a one-line caption.
*/
function Reel({ index, running, onHold }) {
  const small = useMediaQuery('(max-width: 760px)')
  const p = REEL[index]
  if (!p) return null

  return (
    <div className="rl" style={{ '--p-accent': p.theme?.accent ?? 'var(--cobalt)' }} onPointerEnter={() => onHold(true)} onPointerLeave={() => onHold(false)}>
      <Scribble to="up" className="rl__scr">
        recorded live, not a mock-up
      </Scribble>
      <div className="rl__stage">
        {/* The flat panel the screen sits on, in the product's colour, with crop marks. */}
        <span className="rl__plane" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <figure className="rl__desk">
          <figcaption className="ex__bar">
            <span className="ex__host">{p.url ?? hostOf(p.liveUrl)}</span>
            <span className="ex__state is-live">
              Playing
            </span>
            {p.liveUrl && (
              <a className="ex__open" href={p.liveUrl} target="_blank" rel="noreferrer">
                Open site <span aria-hidden="true">↗</span>
                <span className="sr-only"> ({p.title}, new tab)</span>
              </a>
            )}
          </figcaption>
          <Link to={`/work/${p.id}`} className="rl__view" data-cursor="explore" aria-label={`Explore ${p.title}: the case study`}>
            {REEL.map((q, i) => (
              <Clip key={q.id} on={i === index} play={i === index && running} poster={q.image?.src} src={(small && q.video.mobile) || q.video.mp4} start={small && q.video.mobile ? 0 : q.video.start} />
            ))}
          </Link>
          <span className="rl__seam" aria-hidden="true" />
        </figure>
        <div className="rl__phone" aria-hidden="true">
          <div className="ex__handset">
            <div className="lv lv--phone">
              {REEL.map((q, i) => (
                <Clip key={q.id} on={i === index} play={i === index && running} poster={q.gallery.find((g) => g.height > g.width)?.src} src={q.video.phone} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="rl__what" aria-live="polite">
        <b>{p.title}</b> {p.category}
      </p>
    </div>
  )
}

/*
  The first screen: a dossier on the left, the product it describes running on the right. They
  share one index. The reel moves on by itself unless you're hovering it or picked one.
*/
function Hero() {
  const root = useRef(null)
  const reduced = useReducedMotion()
  const [, seen] = useInView(root)
  // Came from the welcome page: start on the product it was showing.
  const [index, setIndex] = useState(() => {
    try {
      const id = sessionStorage.getItem('hero:start')
      sessionStorage.removeItem('hero:start')
      return Math.max(0, REEL.findIndex((p) => p.id === id))
    } catch {
      return 0
    }
  })
  const [held, setHeld] = useState(false)
  const [picked, setPicked] = useState(false)
  // Start rolling once the welcome has cleared and the screen has opened, not hidden behind it.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let id = 0
    pageReady.then(() => (id = setTimeout(() => setReady(true), 1200)))
    return () => clearTimeout(id)
  }, [])
  const running = ready && !held && !picked && !reduced && seen

  // The timeline's playhead keeps time; when it hits the end of a clip it cuts to the next one.
  const advance = useCallback(() => setIndex((i) => (i + 1) % REEL.length), [])

  const pick = (i) => {
    setIndex(i)
    setPicked(true)
  }

  // Play/pause: hold the edit where it is, or carry on from there.
  const roll = () => {
    if (running) setPicked(true)
    else {
      setPicked(false)
      setHeld(false)
    }
  }

  useLayoutEffect(() => {
    if (reduced) return
    let safety = 0
    const ctx = gsap.context(() => {
      gsap.set('.rl__desk', { transformPerspective: 2200, transformOrigin: '50% 100%' })
      // The screen opens from a slit of light down the middle of the frame, then the page opens out
      // from it. Phones just get a simple rise.
      const wide = window.matchMedia('(min-width: 761px)').matches
      const tl = gsap
        .timeline({ paused: true, defaults: { ease: 'expo.out' } })
        .from('.ds__top, .ds__title, .tl__bar, .tl__more', { y: 18, opacity: 0, duration: 0.9, stagger: 0.1 }, 0.2)
        // The clips drop onto the track one after another, like an edit being laid down.
        .from('.tl__clip', { y: 26, opacity: 0, duration: 0.8, stagger: 0.07, ease: 'back.out(1.6)' }, 0.45)
        .from('.rl__desk', { y: 30, opacity: 0, duration: 0.9 }, 0.1)
      if (wide) {
        tl.fromTo('.rl__seam', { scaleY: 0, opacity: 1 }, { scaleY: 1, duration: 0.55, ease: 'power3.out' }, 0.35)
          .fromTo('.rl__view', { clipPath: 'inset(0% 50% 0% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power3.inOut', clearProps: 'clipPath' }, 0.75)
          .to('.rl__seam', { opacity: 0, duration: 0.5, ease: 'power1.out' }, 1.35)
      }
      tl.from('.rl__phone', { y: 120, opacity: 0, duration: 1.4 }, wide ? 1.25 : 0.4).from('.rl__what', { y: 20, opacity: 0, duration: 1 }, wide ? 1.4 : 0.6)
      pageReady.then(() => {
        // The welcome's exit just landed on this screen, so that already was the entrance.
        if (takeHandoff()) tl.progress(1)
        else tl.play()
        // Whatever happens to the timeline, never leave the screen half open.
        safety = setTimeout(() => tl.progress(1), 4000)
      })

      // Scrolling past the first screen: the reel sinks back a little as the projects come up.
      gsap.to('.rl__stage', {
        scale: 0.94,
        yPercent: 6,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
    }, root)
    return () => {
      clearTimeout(safety)
      ctx.revert()
    }
  }, [reduced])

  // The screen tilts a couple of degrees toward the pointer. Enough to feel physical, not enough
  // to make the UI hard to read. Written straight to the transform, no re-renders.
  useEffect(() => {
    if (reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const desk = root.current.querySelector('.rl__desk')
    const rx = gsap.quickTo(desk, 'rotationX', { duration: 1.1, ease: 'power3' })
    const ry = gsap.quickTo(desk, 'rotationY', { duration: 1.1, ease: 'power3' })
    const move = (e) => {
      rx((e.clientY / window.innerHeight - 0.5) * -3)
      ry((e.clientX / window.innerWidth - 0.5) * 4)
    }
    const area = root.current
    area.addEventListener('pointermove', move)
    return () => area.removeEventListener('pointermove', move)
  }, [reduced])

  return (
    <section ref={root} id="work" className="hr tone-night" aria-label={`${site.name}, ${site.role}: selected work`}>
      <Wall projects={REEL} index={index} seen={seen} />
      <Dossier projects={REEL} index={index} onPick={pick} onAdvance={advance} onRoll={roll} running={running} slide={SLIDE} />
      <Reel index={index} running={running} onHold={setHeld} />
    </section>
  )
}

const STACK_WORDS = ['PostgreSQL', 'Express', 'React', 'Node']
const LAYERS = [
  ['Interface', 'React'],
  ['API', 'Express · Node'],
  ['Database', 'PostgreSQL · Prisma'],
  ['Deploy', 'Vercel'],
]

/* The statement reveals word by word as you scroll; the stack names light up when you reach them. */
function Statement({ text }) {
  const root = useRef(null)
  const reduced = useReducedMotion()
  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.st__w',
        { opacity: 0.16 },
        { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top 80%', end: 'bottom 45%', scrub: true } },
      )
      gsap.utils.toArray('.st__w.is-stack').forEach((el) =>
        ScrollTrigger.create({ trigger: el, start: 'top 62%', onEnter: () => el.classList.add('is-lit'), onLeaveBack: () => el.classList.remove('is-lit') }),
      )
    }, root)
    return () => ctx.revert()
  }, [reduced])
  return (
    <p ref={root} className="st" aria-label={text}>
      {text.split(' ').map((w, i) => (
        <span key={i} aria-hidden="true" className={cx('st__w', STACK_WORDS.some((s) => w.startsWith(s)) && 'is-stack', reduced && 'is-lit')}>
          {w}{' '}
        </span>
      ))}
    </p>
  )
}

/* Proof for "What I build": the real sites on a phone, with the four layers lighting up in turn. */
function BuildProof({ on }) {
  const reduced = useReducedMotion()
  const [i, setI] = useState(0)
  const [layer, setLayer] = useState(0)
  useEffect(() => {
    if (!on || reduced) return
    const id = setInterval(() => setLayer((n) => (n + 1) % LAYERS.length), 1100)
    return () => clearInterval(id)
  }, [on, reduced])
  useEffect(() => {
    if (!on || reduced) return
    const id = setTimeout(() => setI((n) => (n + 1) % REEL.length), 6500)
    return () => clearTimeout(id)
  }, [i, on, reduced])
  const p = REEL[i]
  return (
    <div className="pf pf--build">
      <div className="pf__phone">
        <div className="ex__handset">
          <div className="lv lv--phone">
            {REEL.map((q, n) => (
              <Clip key={q.id} on={n === i} play={on && !reduced && n === i} poster={q.gallery.find((g) => g.height > g.width)?.src} src={q.video?.phone} />
            ))}
          </div>
        </div>
        <span className="pf__cap">
          <b key={p.id}>{p.title}</b> · live
        </span>
      </div>
      <ol className="pf__layers">
        {LAYERS.map(([name, tech], n) => (
          <li key={name} className={cx(n === layer && 'is-on', reduced && 'is-on')}>
            <span>{name}</span>
            <code>{tech}</code>
          </li>
        ))}
      </ol>
    </div>
  )
}

/* Proof for "How I work": the live projects and how they're doing right now. */
function LiveProof({ on }) {
  const { checks, byId } = useUptime(on)
  return (
    <div className="pf pf--live">
      <p className="pf__head">
        <span>
          <i className="pf__pulse" aria-hidden="true" /> Checked from your browser
        </span>
        <span>{checks ? `${checks} ${checks === 1 ? 'check' : 'checks'} · every 5s` : 'Connecting…'}</span>
      </p>
      <ul className="pf__sites">
        {liveProjects.map((p) => {
          const hist = byId[p.id] ?? []
          const last = hist.at(-1)
          const max = Math.max(400, ...hist.map((h) => h.ms ?? 0))
          return (
            <li key={p.id} className={cx(last && (last.ok ? 'is-up' : 'is-down'))}>
              <span className="pf__dot" aria-hidden="true" />
              <span className="pf__host">{hostOf(p.liveUrl)}</span>
              <span className="pf__spark" aria-hidden="true">
                {hist.slice(-16).map((h, n) => (
                  <i key={n} style={{ height: `${h.ok ? Math.max(12, (h.ms / max) * 100) : 100}%` }} className={cx(!h.ok && 'is-fail')} />
                ))}
              </span>
              <span className="pf__ms">{last ? (last.ok ? `${last.ms}ms` : 'no reply') : '…'}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* Proof for "What I care about": tap and see how fast this page responds. */
function TapProof() {
  const [taps, setTaps] = useState([])
  const t0 = useRef(0)
  const down = () => {
    t0.current = performance.now()
    // Two frames later the press has actually been drawn. That's the delay a person feels.
    requestAnimationFrame(() => requestAnimationFrame(() => setTaps((t) => [...t, Math.max(1, Math.round(performance.now() - t0.current))].slice(-6))))
  }
  const last = taps.at(-1)
  return (
    <div className="pf pf--tap">
      <button type="button" className="pf__tap" onPointerDown={down} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && down()}>
        <span>{last ? 'Again' : 'Tap me'}</span>
      </button>
      <div className="pf__result" aria-live="polite">
        {last ? (
          <>
            <b key={taps.length}>{last}</b>
            <span>ms to respond</span>
          </>
        ) : (
          <span className="pf__hint">Press it and I’ll measure how fast this page answers you.</span>
        )}
      </div>
      {taps.length > 1 && (
        <ol className="pf__taps" aria-label="Previous taps">
          {taps.slice(0, -1).map((t, n) => (
            <li key={n}>{t}</li>
          ))}
        </ol>
      )}
    </div>
  )
}

/*
  About, as a presentation: a silhouette of Akeem traced from his photo walks through what he does,
  chapter by chapter, and ends on a match cut to the real photo. Below it, the statement and the
  real terminal so you can ask him yourself.
*/
function Profile() {
  const { about } = site
  return (
    <section id="about" className="ab tone-night" aria-labelledby="ab-title">
      <span className="bgword" aria-hidden="true">THINK</span>
      <header className="ab__head">
        <p className="g-meta label">
          <span className="g-square" aria-hidden="true" />
          About
        </p>
        <Reveal as="h2" lines id="ab-title" className="ab__title ap-title">
          <Lines text={about.headline} />
        </Reveal>
      </header>

      {/* The human part: photo with notes, where he is right now, plain facts. */}
      <div className="hu">
        <Sticker />
        <div className="hu__side">
          <LifeCards />
          <Facts />

        </div>
      </div>

      <Presenter />

      <Road />

      <div className="ab__after">
        <Board />
        <div className="ab__words">
          <Statement text={site.statement} />
        </div>
        <Reveal id="ab-shell" className="ab__shell" delay={150}>
          <p className="label">
            <span className="ab__caret" aria-hidden="true">›_</span> Ask the shell — it’s real. Try <kbd>projects</kbd> or <kbd>ping toolhaven</kbd>
          </p>
          <Terminal />
        </Reveal>
      </div>
    </section>
  )
}

export function GalleryIntro() {
  // Phones get their own first screen, not the laptop one stacked up.
  const phone = useMediaQuery('(max-width: 760px)')
  return phone ? <PhoneHero projects={REEL} /> : <Hero />
}

export { Profile }

// The old desktop (pages/OS) was built from these same parts.
export { PROJECTS, REEL, Clip, BuildProof, LiveProof, TapProof }
