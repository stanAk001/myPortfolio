import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'
import { scrollToY } from '../../lib/smooth'
import { Link } from '../../router'
import { useMediaQuery, useReducedMotion } from '../../hooks/useMedia'
import LiveView, { useInView } from '../Gallery/LiveView'
import { Clip, PROJECTS } from '../Gallery/Gallery'
import { cx, hostOf, pad } from '../../utils'
import { liveProjects, statusLabel } from '../../data/projects'
import { useUptime } from '../../lib/uptime'
import Atmosphere from './Atmosphere'
import Journey from './Journey'
import XRay from './XRay'
import Scribble from '../../components/Scribble/Scribble'
import Commentary from './Commentary'
import Wall from '../Gallery/Wall'
import PhoneStories from './PhoneStories'
import { playChord, playNote } from '../../lib/reelChord'
import './Projects.css'

/*
  The projects section. You arrive at a big "My projects" heading with the five sites in a row under
  it. A little scroll closes the row into the browser frame and docks the heading above the line,
  where it stays. Then it's one product at a time: on the left, who made it and why; on the right,
  the running site and its phone with a bit of depth. On big screens scrolling moves from one to the
  next on a sticky stage (normal scrolling, nothing hijacked) and turns the rig as it goes, but
  nothing depends on that: the line above the name has every project, right next to the work.

  Three optional deeper views: watch the site as a film, use the real thing, or see the devices
  apart. "Explore the build" splits the preview into its real layers, using only what can be
  verified. "From idea to product" tells the journey from what's on record.

  The main idea is that line. Its stops are the projects; a dot rides it to the one you pick, the
  accent runs on into the frame, and when it gets there the next site opens through an aperture
  while the last one blurs out. Everything in a change runs off one `scene`, so text, video, colour
  and links can't get out of sync, and a change can be interrupted at any point.
*/

const PINNED = '(min-width: 1081px) and (min-height: 520px)'
const TOTAL = pad(PROJECTS.length)
const INTRO = 0.7 // screens of scroll the arrival takes, on the sticky stage
const CLOSED = 'inset(44% 44% 44% 44% round 10px)'
const OPEN = 'inset(0% 0% 0% 0% round 0px)'

const phonePoster = (p) => p.gallery.find((g) => g.height > g.width)?.src

// The visitor's own settings (commentary, sound), saved on their device. Storage might be blocked.
const recall = (k, fallback) => {
  try {
    const v = localStorage.getItem(k)
    return v == null ? fallback : v === '1'
  } catch {
    return fallback
  }
}
const remember = (k, v) => {
  try {
    localStorage.setItem(k, v ? '1' : '0')
  } catch {
    // Not saved, but still applies for this visit.
  }
  return v
}

/* The name split into letters for the reveal, but read aloud as one word. */
const Name = ({ text }) => (
  <span key={text} aria-hidden="true">
    {[...text].map((c, i) => (
      <span key={i} className="pj__ch">
        {c}
      </span>
    ))}
  </span>
)

/*
  The facts as a build log, all of it true: what it's built with, ticked off one by one, then where
  the site lives and whether it's up today.
*/
function BuildLog({ project: p, on }) {
  const { byId } = useUptime(on)
  const isLive = liveProjects.some((x) => x.id === p.id)
  const last = byId[p.id]?.at(-1)
  const host = p.url ?? hostOf(p.liveUrl)
  let status = `${statusLabel(p)} at ${host}`
  if (isLive) status = last?.ok ? `Up and running at ${host}` : `At ${host}`
  return (
    <div className="pj__log pj__rise">
      <p className="pj__log-cat">{p.category}</p>
      <ul className="pj__log-stack" aria-label="Built with">
        {p.technologies.slice(0, 4).map((t, k) => (
          <li key={t} style={{ '--k': k }}>
            {t}
          </li>
        ))}
      </ul>
      <p className={cx('pj__log-live', isLive && last && (last.ok ? 'is-up' : 'is-down'))}>
        <span>{status}</span>
      </p>
    </div>
  )
}

/* The text next to the exploded view: pick a layer, read what it is and how we know. */
function BuildPanel({ project: p, layer, setLayer, onClose }) {
  const l = p.anatomy[layer]
  return (
    <div className="pj__build">
      <div className="pj__build-head pj__rise">
        <p className="label">Explore the build</p>
        <button type="button" className="pj__action" onClick={onClose}>
          <span aria-hidden="true">←</span> Back to the project
        </button>
      </div>
      <ol className="pj__layers pj__rise">
        {p.anatomy.map((x, i) => (
          <li key={x.id}>
            <button type="button" aria-pressed={i === layer} onClick={() => setLayer(i)}>
              <span>{pad(i + 1)}</span>
              {x.name}
            </button>
          </li>
        ))}
      </ol>
      <div className="pj__layer-info" key={`${p.id}-${l.id}`}>
        <p className="pj__text">{l.text}</p>
        <ul className="pj__evidence">
          {l.evidence.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </div>
      <p className="pj__source pj__rise">Routes and endpoints are read from the live site’s own navigation and requests.</p>
    </div>
  )
}

function DesktopProjects() {
  const root = useRef(null)
  const stage = useRef(null)
  const list = useRef(null)
  const track = useRef(null)
  const motion = useRef(null) // the one running change; a new change kills it
  const entry = useRef(null)
  const wanted = useRef(0)
  const reduced = useReducedMotion()
  const pinned = useMediaQuery(PINNED)
  const small = useMediaQuery('(max-width: 760px)')
  const canEmbed = useMediaQuery('(min-width: 1024px) and (hover: hover)')
  const [, seen] = useInView(root)
  // The intro (with its sweep) plays the first time the section is reached, then stays put.
  const [wallOn, setWallOn] = useState(false)
  useEffect(() => {
    if (seen) setWallOn(true)
  }, [seen])
  // What's on stage, what it replaced (kept until the aperture is fully open), and a counter so
  // that going A → B → A mid-change still animates back properly.
  const [scene, setScene] = useState({ i: 0, from: null, n: 0 })
  const [mode, setMode] = useState('film') // film | live | devices
  const [build, setBuild] = useState(false)
  const [layer, setLayer] = useState(0)
  const [journey, setJourney] = useState(false)
  const [frame, setFrame] = useState('recording')
  const [stalled, setStalled] = useState(false)
  // Commentary is on unless the visitor turned it off; sound is off unless they turned it on.
  const [commentary, setCommentary] = useState(() => recall('pj-commentary', true))
  const [sound, setSound] = useState(() => recall('pj-sound', false))
  const p = PROJECTS[scene.i]
  const canLive = Boolean(p.embed && p.liveUrl) && canEmbed
  const live = mode === 'live' && canLive && !build
  const devices = mode === 'devices' && !build && !small
  const q = (sel) => stage.current.querySelectorAll(sel)

  const present = useCallback(
    (i) => {
      if (i === wanted.current) return
      wanted.current = i
      setMode('film')
      setLayer(0)
      if (reduced) {
        setScene((s) => ({ i, from: null, n: s.n + 1 }))
        return
      }
      entry.current?.progress(1).kill()
      entry.current = null
      motion.current?.kill()
      // Out: the text leaves and the line pulls back. As soon as it's gone, the scene changes.
      motion.current = gsap
        .timeline({
          defaults: { overwrite: 'auto' },
          onComplete: () => setScene((s) => ({ i: wanted.current, from: s.i === wanted.current ? null : s.i, n: s.n + 1 })),
        })
        .to(q('.pj__title-in'), { yPercent: -106, duration: 0.24, ease: 'power3.in' }, 0)
        .to(q('.pj__rise'), { y: -10, opacity: 0, duration: 0.18, ease: 'power2.in' }, 0)
        .to(q('.pj__signal'), { scaleX: 0, transformOrigin: 'right center', duration: 0.24, ease: 'power3.in' }, 0)
        .to(q('.pj__phone'), { y: 22, opacity: 0, duration: 0.22, ease: 'power2.in' }, 0)
    },
    [reduced],
  )

  // In: the line runs to the frame, the aperture opens, then the letters and the phone settle.
  useLayoutEffect(() => {
    if (scene.n === 0 || reduced) return
    motion.current?.kill()
    const fresh = q(`.pj__layer[data-id="${PROJECTS[scene.i].id}"]`)
    const old = scene.from == null ? [] : q(`.pj__layer[data-id="${PROJECTS[scene.from].id}"]`)
    const tl = gsap.timeline({
      onComplete: () => setScene((s) => (s.n === scene.n ? { ...s, from: null } : s)),
    })
    gsap.set(old, { clearProps: 'clipPath' })
    gsap.set(q('.pj__title-in'), { yPercent: 0 })
    tl.fromTo(q('.pj__signal'), { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 0.34, ease: 'power3.out' }, 0)
    if (old.length) {
      tl.fromTo(fresh, { clipPath: CLOSED }, { clipPath: OPEN, duration: 0.78, ease: 'expo.inOut', clearProps: 'clipPath' }, 0.16)
        .fromTo(fresh[0]?.children ?? [], { scale: 1.14 }, { scale: 1, duration: 1.05, ease: 'expo.out', clearProps: 'transform' }, 0.2)
        .fromTo(old, { scale: 1, opacity: 1, filter: 'blur(0px)' }, { scale: 1.08, opacity: 0.25, filter: 'blur(7px)', duration: 0.78, ease: 'power2.inOut' }, 0.16)
        .fromTo(q('.pj__aperture'), { top: '44%', right: '44%', bottom: '44%', left: '44%', opacity: 1 }, { top: '0%', right: '0%', bottom: '0%', left: '0%', duration: 0.78, ease: 'expo.inOut' }, 0.16)
        .to(q('.pj__aperture'), { opacity: 0, duration: 0.25 }, 0.74)
    }
    tl.fromTo(q('.pj__ch'), { yPercent: 112 }, { yPercent: 0, duration: 0.8, stagger: 0.02, ease: 'expo.out' }, 0.08)
      .fromTo(q('.pj__rise'), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: 'power3.out', clearProps: 'transform,opacity' }, 0.26)
      .fromTo(q('.pj__phone'), { y: 44, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'expo.out', clearProps: 'transform,opacity' }, 0.42)
    motion.current = tl
    return () => tl.kill()
    // A scene is identified by its counter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.n, reduced])

  // First arrival, in order: number, name, text, screen opens, phone settles.
  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      entry.current = gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: pinned ? () => `top+=${window.innerHeight * INTRO * 0.55} top` : 'top 62%', once: true } })
        .fromTo('.pj__signal', { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 0.7, ease: 'power3.inOut' }, 0)
        .fromTo('.pj__index', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0)
        .fromTo('.pj__ch', { yPercent: 112 }, { yPercent: 0, duration: 0.9, stagger: 0.025, ease: 'expo.out' }, 0.1)
        .fromTo('.pj__rise', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.07, ease: 'power3.out', clearProps: 'transform,opacity' }, 0.3)
        .fromTo('.pj__view', { clipPath: 'inset(0% 50% 0% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.05, ease: 'power3.inOut', clearProps: 'clipPath' }, 0.3)
        .fromTo('.pj__phone', { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', clearProps: 'transform,opacity' }, 0.85)
    }, root)
    return () => {
      entry.current = null
      ctx.revert()
    }
  }, [reduced, pinned])

  // Scrolling through the stage picks the project whose stop is crossing the middle of the screen.
  useEffect(() => {
    if (!pinned) return
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && present(Number(e.target.dataset.i))), {
      rootMargin: '-50% 0px -50% 0px',
    })
    root.current.querySelectorAll('.pj__stop').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [pinned, present])

  // How far through the current project the scroll is, as one CSS variable. It turns the rig,
  // settles the phone, shows the "why" line and fills the archive, all without re-renders.
  useEffect(() => {
    const el = stage.current
    if (!pinned || reduced) {
      el.style.setProperty('--p', '0.6')
      el.style.setProperty('--i', '1')
      delete el.dataset.intro
      return
    }
    let raf = 0
    const update = () => {
      raf = 0
      const box = root.current
      const intro = window.innerHeight * INTRO
      const run = box.offsetHeight - window.innerHeight - intro
      const scrolled = -box.getBoundingClientRect().top
      // The intro, eased at both ends.
      const t = Math.max(0, Math.min(1, scrolled / intro))
      el.style.setProperty('--i', (t * t * (3 - 2 * t)).toFixed(3))
      if (t < 0.8) el.dataset.intro = 'true'
      else delete el.dataset.intro
      const at = ((scrolled - intro) / run) * PROJECTS.length
      const clamped = Math.max(0, Math.min(PROJECTS.length - 0.001, at))
      el.style.setProperty('--p', (clamped % 1).toFixed(3))
    }
    const onScroll = () => (raf ||= requestAnimationFrame(update))
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [pinned, reduced])

  // The rig tilts a little toward the pointer. Written to CSS so nothing re-renders.
  useEffect(() => {
    if (!pinned || reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const el = stage.current
    const move = (e) => {
      el.style.setProperty('--tx', ((e.clientX / window.innerWidth - 0.5) * 3).toFixed(2))
      el.style.setProperty('--ty', ((e.clientY / window.innerHeight - 0.5) * -2).toFixed(2))
    }
    el.addEventListener('pointermove', move)
    return () => el.removeEventListener('pointermove', move)
  }, [pinned, reduced])

  // If a site won't load in the frame, say so, with the way out right there.
  useEffect(() => {
    setStalled(false)
    if (!live || frame === 'live') return
    const id = setTimeout(() => setStalled(true), 16000)
    return () => clearTimeout(id)
  }, [live, frame, p.id])

  // The dot sits under the current stop, and the accent runs from there to the frame.
  useLayoutEffect(() => {
    const place = () => {
      const a = list.current?.querySelector('[aria-current="true"]')
      if (a) track.current?.style.setProperty('--dot', `${a.offsetLeft + a.offsetWidth / 2 - list.current.scrollLeft}px`)
    }
    place()
    window.addEventListener('resize', place)
    document.fonts?.ready.then(place)
    return () => window.removeEventListener('resize', place)
  }, [scene.i, pinned])

  // Preload the neighbours' posters; the line keeps the active one in view.
  useEffect(() => {
    for (const d of [1, -1]) {
      const n = PROJECTS[(scene.i + d + PROJECTS.length) % PROJECTS.length]
      if (n.image?.src) new Image().src = n.image.src
    }
    const active = list.current?.querySelector('[aria-current="true"]')
    if (active && list.current.scrollWidth > list.current.clientWidth) {
      list.current.scrollTo({ left: active.offsetLeft - 16, behavior: reduced ? 'auto' : 'smooth' })
    }
  }, [scene.i, reduced])

  // Each project change plays that project's note; reaching the last one rolls the whole chord.
  const lastNote = useRef(scene.i)
  useEffect(() => {
    if (scene.i === lastNote.current) return
    lastNote.current = scene.i
    if (!sound) return
    if (scene.i === PROJECTS.length - 1) playChord()
    else playNote(scene.i)
  }, [scene.i, sound])

  const toggleSound = () => {
    const next = remember('pj-sound', !sound)
    setSound(next)
    if (next) playNote(scene.i) // the click is the gesture that lets audio start; let it be heard
  }

  // Going in or out of the build view, the text swaps places with a short rise.
  const firstBuild = useRef(true)
  useLayoutEffect(() => {
    if (firstBuild.current) {
      firstBuild.current = false
      return
    }
    if (reduced) return
    gsap.fromTo(q('.pj__rise'), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, stagger: 0.05, ease: 'power3.out', clearProps: 'transform,opacity' })
  }, [build, reduced])

  const select = (i) => {
    const n = (i + PROJECTS.length) % PROJECTS.length
    if (pinned) {
      // On the sticky stage the page doesn't visibly move, only the project changes.
      const box = root.current
      const y = box.getBoundingClientRect().top + window.scrollY
      const intro = reduced ? 0 : window.innerHeight * INTRO
      scrollToY(y + intro + ((box.offsetHeight - window.innerHeight - intro) * (n + 0.5)) / PROJECTS.length, { immediate: true })
    }
    present(n)
  }

  const onLineKey = (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const n = (wanted.current + step + PROJECTS.length) % PROJECTS.length
    select(n)
    list.current.querySelectorAll('button')[n]?.focus({ preventScroll: true })
  }

  const layers = scene.from == null || scene.from === scene.i ? [scene.i] : [scene.from, scene.i]
  const story = p.showcase ?? { headline: p.hook, text: p.plain }
  const anatomy = p.anatomy ?? []
  const modes = [['film', 'Film'], canLive && ['live', 'Live site'], !small && ['devices', 'Devices']].filter(Boolean)
  // The plates, top to bottom. The interface, which you've already seen, goes on top.
  const mid = (anatomy.length - 1) / 2

  return (
    <section ref={root} id="projects" className="pj tone-graphite" aria-labelledby="pj-heading" style={{ '--n': PROJECTS.length }}>
      <div className="pj__stops" aria-hidden="true">
        {PROJECTS.map((x, i) => (
          <span key={x.id} id={`index-${x.id}`} className="pj__stop" data-i={i} data-nav-label={x.title} />
        ))}
      </div>

      <div ref={stage} className={cx('pj__stage', build && 'is-build', devices && 'is-devices', live && 'is-live')} data-project={p.id} style={{ '--p-accent': p.theme?.accent ?? 'var(--vermilion)' }}>
        {/* Same wall of work as the first screen. Here the camera follows the scroll from one product's
            prints to the next, and that product's prints come up to full strength. */}
        {pinned && wallOn && <Wall projects={PROJECTS} index={scene.i} seen={seen} className="wl--pj" />}
        <div className="pj__room" aria-hidden="true">
          <span className="pj__light" />
          <span className="pj__floor" />
        </div>
        <Atmosphere key={p.id} id={p.id} />

        {/* The five sites in a row. Scrolling closes them into the frame. */}
        <div className="pj__wall" aria-hidden="true">
          <p className="pj__wall-sub">Five picked from 30+ sites built since 2022. Choose one, or keep scrolling.</p>
          {PROJECTS.map((x, i) => (
            <button key={x.id} type="button" tabIndex={-1} className="pj__hung" style={{ '--k': i - (PROJECTS.length - 1) / 2 }} onClick={() => select(i)}>
              <img src={x.image?.src} alt="" decoding="async" />
              <span>
                <b>{pad(i + 1)}</b> {x.title}
              </span>
            </button>
          ))}
        </div>

        <header className="pj__heading">
          <h2 id="pj-heading">My projects.</h2>
          <Scribble to="left" className="pj__scr">
            all five are live. go and click.
          </Scribble>
          <p>Five picked from 30+ sites built since 2022.</p>
        </header>

        <div
          className="pj__main"
          onFocusCapture={() => {
            // Tabbing in from above: skip the intro instead of focusing something that's still hidden.
            if (stage.current?.dataset.intro) select(wanted.current)
          }}
        >
          <div className="pj__lead">
            <span key={scene.i} className="pj__bignum" aria-hidden="true">
              {pad(scene.i + 1)}
            </span>
            <nav ref={track} className="pj__line" aria-label="Choose a project">
              <ol ref={list} onKeyDown={onLineKey}>
                {PROJECTS.map((x, i) => (
                  <li key={x.id}>
                    <button type="button" aria-current={i === scene.i ? 'true' : undefined} onClick={() => select(i)}>
                      <span className="pj__no">{pad(i + 1)}</span>
                      <span className="pj__name">{x.title}</span>
                      <img className="pj__peek" src={x.image?.src} alt="" loading="lazy" decoding="async" />
                    </button>
                  </li>
                ))}
              </ol>
              <i className="pj__rail" aria-hidden="true" />
              <i className="pj__signal" aria-hidden="true" />
              <i className="pj__dot" aria-hidden="true" />
            </nav>
            <h3 className="pj__title" style={{ '--len': p.title.length }}>
              <span className="pj__title-in">
                <Link to={`/work/${p.id}`} aria-label={`${p.title}: the full story`}>
                  <Name text={p.title} />
                </Link>
              </span>
            </h3>
          </div>

          <div className="pj__screen" data-cursor={live ? undefined : 'explore'}>
            <div className="pj__space">
              <span className="pj__plane" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </span>
              <div className="pj__rig">
                <div className="pj__frame" aria-hidden={live ? undefined : 'true'}>
                  <div className="pj__bar">
                    <span className="pj__host">{p.url ?? hostOf(p.liveUrl)}</span>
                    <span className={cx('pj__mode', live && frame === 'live' && 'is-live')}>
                      {live ? (frame === 'live' ? 'Live site' : stalled ? 'Didn’t load here' : 'Connecting…') : 'Recording'}
                    </span>
                  </div>
                  <div className="pj__view">
                    {layers.map((i) => {
                      const x = PROJECTS[i]
                      const useMobile = small && x.video?.mobile
                      return (
                        <div key={x.id} className="pj__layer" data-id={x.id}>
                          <Clip on play={seen && !reduced && i === scene.i && !live && !build} poster={x.image?.src} src={useMobile ? x.video.mobile : x.video?.mp4} start={useMobile ? 0 : x.video?.start} />
                        </div>
                      )
                    })}
                    <span className="pj__aperture" aria-hidden="true" />
                    {!live && !build && !devices && <Commentary project={p} on={commentary && seen} />}
                    {!live && !build && !devices && <XRay key={p.id} project={p} poster={p.image?.src} />}
                    {live && (
                      <div className="pj__live">
                        <LiveView key={p.id} project={p} kind="desk" live onState={setFrame} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="pj__phone" aria-hidden="true">
                  <div className="pj__phone-in">
                    <div className="ex__handset">
                      <div className="lv lv--phone">
                        <Clip key={p.id} on play={seen && !reduced && !build} poster={phonePoster(p)} src={p.video?.phone} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* The exploded view: the same product split into what's verifiably in it. */}
              {anatomy.length > 0 && (
                <div className="pj__plates" aria-hidden="true">
                  <div className="pj__plates-in">
                    {anatomy.map((l, i) => {
                      const height = anatomy.length - 1 - i
                      return (
                        <button key={`${p.id}-${l.id}`} type="button" tabIndex={-1} className={cx('pj__plate', i === layer && 'is-on', i < layer && 'is-above', l.id === 'interface' && 'is-face')} style={{ '--h': height - mid, '--i': i }} onClick={() => setLayer(i)}>
                          {l.id === 'interface' && <img src={p.image?.src} alt="" loading="lazy" decoding="async" />}
                          <span className="pj__plate-name">{l.name}</span>
                          {l.id !== 'interface' && (
                            <span className="pj__plate-lines">
                              {l.evidence.slice(0, 4).map((e) => (
                                <span key={e}>{e}</span>
                              ))}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="pj__under">
              <p className="pj__why">{p.problem?.headline}</p>
              <div className="pj__step">
                <button type="button" onClick={() => select(wanted.current - 1)} aria-label="Previous project">
                  ←
                </button>
                <span>
                  {pad(scene.i + 1)} / {TOTAL}
                </span>
                <button type="button" onClick={() => select(wanted.current + 1)} aria-label="Next project">
                  →
                </button>
              </div>
              <div className="pj__modes pj__extras" role="group" aria-label="Commentary and sound">
                <button type="button" aria-pressed={commentary} disabled={build || live || devices} onClick={() => setCommentary((v) => remember('pj-commentary', !v))}>
                  Commentary
                </button>
                <button type="button" aria-pressed={sound} onClick={toggleSound} title="Each project plays one note of a chord">
                  Sound {sound ? 'on' : 'off'}
                </button>
              </div>
              {modes.length > 1 && (
                <div className="pj__modes" role="group" aria-label="How to view this project">
                  {modes.map(([id, label]) => (
                    <button key={id} type="button" aria-pressed={mode === id && !build} disabled={build} onClick={() => setMode(id)}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pj__story">
            {build && anatomy.length > 0 ? (
              <BuildPanel project={p} layer={layer} setLayer={setLayer} onClose={() => setBuild(false)} />
            ) : (
              <>
                {/* The text: two short columns, one line of facts, one button. */}
                <div className="pj__cols pj__rise">
                  <div>
                    <h4>The problem</h4>
                    <p>{p.problem?.headline}</p>
                  </div>
                  <div>
                    <h4>What I built</h4>
                    <p>{story.text}</p>
                  </div>
                </div>
                <BuildLog key={p.id} project={p} on={seen} />
                <div className="pj__actions pj__rise">
                  <Link to={`/work/${p.id}`} className="pj__explore">
                    Explore project <span aria-hidden="true">→</span>
                    <span className="sr-only"> — {p.title}</span>
                  </Link>
                  {p.liveUrl && (
                    <a href={p.liveUrl} target="_blank" rel="noreferrer" className="pj__action">
                      Visit the site <span aria-hidden="true">↗</span>
                      <span className="sr-only"> {p.title} (new tab)</span>
                    </a>
                  )}
                </div>
                <div className="pj__deeper pj__rise">
                  {anatomy.length > 0 && (
                    <button type="button" className="pj__deep" onClick={() => setBuild(true)}>
                      <i aria-hidden="true">
                        <b />
                        <b />
                        <b />
                      </i>
                      Explore the build
                    </button>
                  )}
                  <button type="button" className="pj__deep" aria-haspopup="dialog" onClick={() => setJourney(true)}>
                    <i className="is-line" aria-hidden="true">
                      <b />
                      <b />
                      <b />
                    </i>
                    From idea to product
                  </button>
                </div>
              </>
            )}
          </div>

          {journey && <Journey project={p} pinned={pinned} onClose={() => setJourney(false)} />}
        </div>

        <p className="sr-only" aria-live="polite">
          Project {scene.i + 1} of {PROJECTS.length}: {p.title}
        </p>
      </div>
    </section>
  )
}

// On a phone the projects are stories, not the laptop stage stacked up.
export default function Projects() {
  const phone = useMediaQuery('(max-width: 760px)')
  return phone ? <PhoneStories projects={PROJECTS} /> : <DesktopProjects />
}
