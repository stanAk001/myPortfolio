import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'
import { useUptime } from '../../lib/uptime'
import { featuredProjects, labProjects, liveProjects } from '../../data/projects'
import { site } from '../../data/site'
import { useReducedMotion } from '../../hooks/useMedia'
import { useInView } from './LiveView'
import { POSES, Rig, START, draw } from './Rig'
import { cx, hostOf } from '../../utils'
import './Presenter.css'

/*
  About, as a presentation. A figure traced from Akeem's photo (low cut, gold half-frame glasses,
  earbuds, black camp-collar shirt with orange diamond embroidery) stands in a pool of light in the
  corner and presents his work like a showman, the same way for every item:

    faces you and raises a finger: look at this
    head turns to the stage, body follows
    both hands sweep out to present it, and the item cuts in on that gesture
    bows to you, hands still on the work
    stands back up, looking at what he's shown you

  It ends on a match cut: he turns back to you, hand on heart, and on that frame the figure becomes
  the real photo. The figure is one slot, so real footage or drawn poses can replace it later without
  touching the chapters, the stage or the timing.
*/

const PROJECTS = [...featuredProjects, ...labProjects]

// `cut` is when the item appears: on his presenting gesture.
const CHAPTERS = [
  { id: 'hi', label: 'Hello', say: 'Hi, I’m Akeem. Let me show you what I do.', ms: 6800, cut: 2.95 },
  { id: 'design', label: 'Design', say: 'First, I design the interface: every screen people actually touch.', ms: 6800, cut: 2.55 },
  { id: 'api', label: 'API', say: 'Then I build the API behind it, the part you never see.', ms: 6800, cut: 2.55 },
  { id: 'data', label: 'Data', say: 'I model the data so it still makes sense a year later.', ms: 6800, cut: 2.55 },
  { id: 'live', label: 'Live', say: 'And I put it live. Every one of these is running right now.', ms: 7200, cut: 2.55 },
  { id: 'me', label: 'That’s me', say: 'That’s me. Want to build something together?', ms: 0, cut: 0.4 },
]

// The presenting move, from `t`: wind-up, head leads the turn, body follows, both hands present,
// a bow with hands still on the work, then back up looking at it.
function presentAt(tl, p, t) {
  tl.to(p, { H: -0.06, Y: -0.03, duration: 0.16, ease: 'power1.out' }, t)
    .to(p, { H: 1, duration: 0.55, ease: 'power2.inOut' }, t + 0.16)
    .to(p, { Y: 1, bx: 8, ...POSES.hang, duration: 0.7, ease: 'power2.inOut' }, t + 0.26)
    .to(p, { ...POSES.present, duration: 0.62, ease: 'back.out(1.5)' }, t + 0.8)
    .to(p, { Y: 0.42, H: 0.3, dip: 9, nod: 9, lean: 0, duration: 0.5, ease: 'power2.inOut' }, t + 1.55)
    .to(p, { Y: 0.85, H: 0.9, dip: 0, nod: 0, lean: 2, duration: 0.65, ease: 'power2.out' }, t + 2.35)
}

// Small nods while a line is being said. Kept on their own value so a bow can't cancel them.
const talk = (tl, p, t, n = 6) => tl.to(p, { talk: 1.3, duration: 0.17, yoyo: true, repeat: n, ease: 'sine.inOut' }, t)

function perform(tl, p, id, setReal) {
  if (id === 'hi') {
    tl.to(p, { Y: 0, H: 0, bx: 0, dip: 0, nod: 0, ...POSES.wave, duration: 0.6, ease: 'power3.inOut' }, 0)
      .to(p, { R2: -2, duration: 0.2, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 0.6)
      .to(p, { ...POSES.impulse, duration: 0.5, ease: 'power2.inOut' }, 1.85)
    talk(tl, p, 0.3, 8)
    presentAt(tl, p, 2.0)
    return
  }
  if (id === 'me') {
    // Back to the audience, hand on heart, a small thank-you bow, then the match cut.
    tl.to(p, { Y: 0, H: 0, bx: 0, ...POSES.thanks, duration: 0.75, ease: 'power3.inOut' }, 0)
      .to(p, { dip: 6, nod: 8, duration: 0.42, ease: 'power2.inOut' }, 0.85)
      .to(p, { dip: 0, nod: 0, duration: 0.5, ease: 'power2.out' }, 1.35)
      .call(() => setReal(true), null, 2.05)
    talk(tl, p, 0.3, 5)
    return
  }
  // Each skill: face the audience with a raised finger, then present it.
  tl.to(p, { Y: 0, H: 0, bx: 0, dip: 0, nod: 0, ...POSES.impulse, duration: 0.65, ease: 'power3.inOut' }, 0)
  talk(tl, p, 0.35, 6)
  presentAt(tl, p, 1.6)
}

const Figure = memo(function Figure({ part }) {
  return <Rig part={part} />
})

/* ---------- The chapters' visuals ---------- */

const CODE = {
  api: [
    ["router.post('/tools',", 'k'],
    ['  requireAuth,', ''],
    ['  validate(newTool),', ''],
    ['  tools.create)', ''],
    ['', ''],
    ['POST /api/tools   → 201 Created', 'ok'],
    ['GET  /api/tools?q=design → 200 OK', 'ok'],
  ],
  data: [
    ['model Review {', 'k'],
    ['  id     Int  @id', ''],
    ['  user   User @relation(...)', ''],
    ['  tool   Tool @relation(...)', ''],
    ['  @@unique([userId, toolId])', 'hl'],
    ['}', 'k'],
    ['// one review per person, enforced by the database', 'c'],
  ],
}

function Code({ lines, file }) {
  return (
    <div className="pr__code">
      <p className="pr__file">{file}</p>
      <pre>
        {lines.map(([text, tone], i) => (
          <span key={i} className={cx('pr__ln', tone && `is-${tone}`)} style={{ '--i': i }}>
            {text || ' '}
            {'\n'}
          </span>
        ))}
      </pre>
    </div>
  )
}

function LiveBoard({ on }) {
  const { byId } = useUptime(on)
  return (
    <div className="pr__board">
      <p className="pr__file">
        Out in the world
      </p>
      <ul>
        {liveProjects.map((p, i) => {
          const last = byId[p.id]?.at(-1)
          return (
            <li key={p.id} style={{ '--i': i }} className={cx(last && (last.ok ? 'is-up' : 'is-down'))}>
              <img src={p.image?.src} alt="" loading="lazy" decoding="async" />
              <span>
                <b>{p.title}</b>
                <small>{hostOf(p.liveUrl)}</small>
              </span>
              <em>{last?.ok ? 'Open' : ''}</em>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Visual({ id, on }) {
  // Hello: the agenda, like a presenter opening a talk, each item lighting up in turn.
  if (id === 'hi')
    return (
      <div className="pr__hi">
        <p className="pr__kicker">In the next 30 seconds</p>
        <ol className="pr__agenda">
          {[
            ['Design', 'the interface', 'React'],
            ['Build', 'the API behind it', 'Express · Node'],
            ['Model', 'the data', 'PostgreSQL · Prisma'],
            ['Ship', 'it live, and keep it there', 'Vercel'],
          ].map(([verb, rest, tech], i) => (
            <li key={verb} style={{ '--i': i }}>
              <span className="pr__agenda-no">{String(i + 2).padStart(2, '0')}</span>
              <span>
                <b>{verb}</b> {rest}
              </span>
              <code>{tech}</code>
            </li>
          ))}
        </ol>
      </div>
    )
  if (id === 'design')
    return (
      <div className="pr__fan">
        {PROJECTS.slice(0, 4).map((p, i) => (
          <figure key={p.id} style={{ '--i': i }}>
            <img src={p.image?.src} alt="" loading="lazy" decoding="async" />
            <figcaption>{p.title}</figcaption>
          </figure>
        ))}
      </div>
    )
  if (id === 'api') return <Code file="server/routes/tools.js" lines={CODE.api} />
  if (id === 'data') return <Code file="prisma/schema.prisma" lines={CODE.data} />
  if (id === 'live') return <LiveBoard on={on} />
  return (
    <div className="pr__end">
      <p className="pr__big">
        {site.name}. <span>{site.role}.</span>
      </p>
      <p className="pr__open">
        Open to new projects
      </p>
      <div className="pr__ctas">
        <a href="#contact" className="g-btn g-btn--solid">
          Start a project <span aria-hidden="true">→</span>
        </a>
        <a href="#ab-shell" className="g-btn">
          Or ask the shell <span aria-hidden="true">↓</span>
        </a>
      </div>
    </div>
  )
}


/* ---------- The presentation ---------- */

export default function Presenter() {
  const root = useRef(null)
  const parts = useRef({})
  const pose = useRef({ ...START, talk: 0 })
  const timer = useRef(null)
  const moves = useRef(null)
  const reduced = useReducedMotion()
  const [, seen] = useInView(root)
  const [at, setAt] = useState(reduced ? CHAPTERS.length - 1 : 0)
  const [playing, setPlaying] = useState(!reduced)
  const [started, setStarted] = useState(reduced)
  const [real, setReal] = useState(reduced)
  const part = useCallback((k) => (el) => el && (parts.current[k] = el), [])
  const ch = CHAPTERS[at]
  const last = at === CHAPTERS.length - 1

  // Write the pose to the figure on every tween update, straight to the SVG, never through React.
  const apply = useCallback(() => {
    const p = pose.current
    draw(parts.current, { ...p, nod: p.nod + p.talk })
  }, [])

  useLayoutEffect(() => {
    apply()
  }, [apply])

  // Breathing and the odd glint off his glasses, always running quietly underneath.
  useEffect(() => {
    if (reduced) return
    const breathe = gsap.to(pose.current, { bob: -1.4, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1, onUpdate: apply })
    const glint = gsap
      .timeline({ repeat: -1, repeatDelay: 5, delay: 2 })
      .fromTo(parts.current.glint, { opacity: 0 }, { opacity: 0.9, duration: 0.18, ease: 'power1.out' })
      .to(parts.current.glint, { opacity: 0, duration: 0.25, ease: 'power1.in' })
    return () => {
      breathe.kill()
      glint.kill()
    }
  }, [apply, reduced])

  // Each chapter's performance.
  useEffect(() => {
    if (!started || reduced) return
    moves.current?.kill()
    const tl = gsap.timeline({ onUpdate: apply })
    perform(tl, pose.current, ch.id, setReal)
    moves.current = tl
    return () => tl.kill()
  }, [at, started, ch.id, apply, reduced])

  // Pause the performance while paused or scrolled away.
  useEffect(() => {
    const tl = moves.current
    if (!tl) return
    if (playing && seen) tl.resume()
    else tl.pause()
  }, [playing, seen, at])

  useEffect(() => {
    if (!started || !playing || !seen || last || reduced) return
    timer.current = gsap.delayedCall(ch.ms / 1000, () => setAt((n) => n + 1))
    return () => timer.current?.kill()
  }, [at, started, playing, seen, last, ch.ms, reduced])


  // Starts the first time the section is on screen.
  useEffect(() => {
    if (seen && !started && !reduced) {
      const id = setTimeout(() => setStarted(true), 500)
      return () => clearTimeout(id)
    }
  }, [seen, started, reduced])

  // Jumping to a chapter. With reduced motion there's no performance, so the last chapter is the photo.
  const go = (n) => {
    setStarted(true)
    setReal(reduced && n === CHAPTERS.length - 1)
    setAt(n)
  }
  const replay = () => {
    setPlaying(true)
    go(0)
  }

  return (
    <div ref={root} className={cx('pr', real && 'is-real', !started && 'is-waiting')}>
      <div className="pr__stage-wrap">
        {/* The corner: a pool of light and the person standing in it. */}
        <div className="pr__corner">
          <div className="pr__light" aria-hidden="true" />
          <Figure part={part} />
          <img className="pr__photo" src={site.photo.src} alt={site.photo.alt} width={site.photo.width} height={site.photo.height} loading="lazy" decoding="async" />
          <span className="pr__flash" aria-hidden="true" />
          <p className="pr__nametag">
            <b>{site.name}</b>
            <span>{site.role}</span>
          </p>
        </div>

        <div className="pr__stage">
          {/* What he's saying as a caption, in sync with the talking nods. */}
          <p key={`say-${at}-${started}`} className={cx('pr__say', started && 'is-on')}>
            <span className="pr__say-no">{String(at + 1).padStart(2, '0')}</span>
            {ch.say.split(' ').map((w, i) => (
              <span key={i} className="pr__w" style={{ '--i': i }}>
                {w}{' '}
              </span>
            ))}
          </p>

          <div className="pr__screen">
            {CHAPTERS.map((c, i) => (
              <div
                key={c.id}
                className={cx('pr__slide', `pr__slide--${c.id}`, i === at && 'is-on', i < at && 'is-past')}
                style={{ '--cut': reduced ? '0s' : `${c.cut}s` }}
                aria-hidden={i !== at}
              >
                {Math.abs(i - at) <= 1 && <Visual id={c.id} on={i === at && seen} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pr__controls">
        <ol className="pr__chapters" aria-label="Chapters">
          {CHAPTERS.map((c, i) => (
            <li key={c.id}>
              <button type="button" className={cx(i === at && 'is-on', i < at && 'is-past')} aria-current={i === at ? 'step' : undefined} onClick={() => go(i)}>
                <span>{c.label}</span>
                <i
                  key={`${i}-${at}-${playing}-${started}`}
                  className={cx(i === at && started && playing && seen && !last && !reduced && 'is-running')}
                  style={{ '--ms': `${c.ms}ms` }}
                />
              </button>
            </li>
          ))}
        </ol>
        {!reduced && (
          <div className="pr__buttons">
            {last ? (
              <button type="button" className="pr__ctl" onClick={replay}>
                ↺ Replay
              </button>
            ) : (
              <button type="button" className="pr__ctl" onClick={() => setPlaying((p) => !p)} aria-pressed={!playing}>
                {playing ? 'Pause' : 'Play'}
              </button>
            )}
            {!last && (
              <button type="button" className="pr__ctl" onClick={() => go(CHAPTERS.length - 1)}>
                Skip →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Everything he says, for screen readers, without the timing. */}
      <ul className="sr-only">
        {CHAPTERS.map((c) => (
          <li key={c.id}>{c.say}</li>
        ))}
      </ul>
    </div>
  )
}
