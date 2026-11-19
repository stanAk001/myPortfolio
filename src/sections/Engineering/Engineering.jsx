import { useEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'
import { site } from '../../data/site'
import { getProject } from '../../data/projects'
import { useReducedMotion } from '../../hooks/useMedia'
import { useInView } from '../../hooks/useInView'
import { Reveal } from '../../components/Motion/Reveal'
import { rich } from '../../utils/rich'
import { cx } from '../../utils'
import { SCENARIOS } from './scenarios'
import Relay from './Relay'
import Approach from '../../components/Approach/Approach'
import './Engineering.css'

const TAG = { browser: 'you', react: 'react', api: 'api', db: 'postgres', pay: 'payments', media: 'cdn' }
const BACK = (h) => ['db', 'pay', 'media'].includes(h.from) || (h.from === 'api' && h.to === 'react') || (h.from === 'react' && h.to === 'browser')
const hopTime = (h) => Math.min(1.1, 0.5 + h.ms / 380)
const PAUSE = 3

const RESULTS = [
  ['Figma', 'Interface design'],
  ['Framer', 'Sites and prototypes'],
  ['Penpot', 'Open-source design'],
]

/* What the visitor would see on screen, playing in sync with the request. */
function AppMock({ scenario, step, onRun }) {
  const n = scenario.hops.length
  const phase = step < 0 ? 'idle' : step >= n ? 'done' : 'busy'
  const pct = Math.round((Math.max(0, Math.min(step + 1, n)) / n) * 100)
  const run = (label) => (
    <button type="button" className={cx('bc__run', phase === 'busy' && 'is-busy')} onClick={onRun} disabled={phase === 'busy'}>
      {phase === 'busy' ? <span className="bc__spin" aria-hidden="true" /> : null}
      {label}
    </button>
  )

  if (scenario.id === 'search')
    return (
      <div className="bc__app">
        <div className="bc__search">
          <span className={cx('bc__typed', phase !== 'idle' && 'is-typed')}>{phase === 'idle' ? 'What are you trying to do?' : 'design'}</span>
          {run('Search')}
        </div>
        {phase === 'busy' && <div className="bc__skeleton" aria-hidden="true"><i /><i /><i /></div>}
        {phase === 'done' && (
          <ul className="bc__results">
            {RESULTS.map(([name, what], i) => (
              <li key={name} style={{ '--i': i }}>
                <b>{name}</b>
                <span>{what}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    )

  if (scenario.id === 'login')
    return (
      <div className="bc__app">
        {phase === 'done' ? (
          <div className="bc__ok">
            <span className="bc__tick" aria-hidden="true">✓</span>
            <b>Welcome back.</b>
            <span>Signed in with a secure, HttpOnly session.</span>
          </div>
        ) : (
          <div className="bc__form">
            <span className="bc__field">you@example.com</span>
            <span className="bc__field">••••••••••</span>
            {run(phase === 'busy' ? 'Signing in…' : 'Sign in')}
          </div>
        )}
      </div>
    )

  if (scenario.id === 'buy')
    return (
      <div className="bc__app">
        <div className="bc__order">
          <span>Order #1042</span>
          <b>$49.00</b>
        </div>
        {phase === 'done' ? (
          <div className="bc__ok">
            <span className="bc__tick" aria-hidden="true">✓</span>
            <b>Paid. Receipt sent.</b>
            <span>Confirmed by the provider’s webhook, not just the button.</span>
          </div>
        ) : (
          <>
            {run(phase === 'busy' ? (step >= 2 ? 'Confirming payment…' : 'Processing…') : 'Pay $49.00')}
          </>
        )}
      </div>
    )

  const photo = getProject('keemstore')?.image?.src
  return (
    <div className="bc__app">
      <div className={cx('bc__drop', phase === 'done' && 'is-done')}>
        {phase === 'done' && photo ? <img src={photo} alt="" /> : <span>product-photo.jpg</span>}
      </div>
      {phase === 'busy' && (
        <div className="bc__bar" aria-hidden="true">
          <i style={{ width: `${pct}%` }} />
          <span>{pct}%</span>
        </div>
      )}
      {phase === 'done' ? (
        <div className="bc__ok bc__ok--row">
          <span className="bc__tick" aria-hidden="true">✓</span>
          <b>Uploaded</b>
          <span>served resized from the CDN</span>
        </div>
      ) : (
        phase === 'idle' && run('Upload photo')
      )}
    </div>
  )
}

/*
  "Behind the click". One window, three panes, all driven by the same request: the app you'd see on
  the left, the server log streaming on the right, and the request's path through the whole stack
  underneath. It cycles through everyday actions on its own; pressing the button in the app runs
  one by hand.
*/
// compact: just the window, for when this runs inside one of the old desktop's windows.
export default function Engineering({ compact = false }) {
  const root = useRef(null)
  const log = useRef(null)
  const visible = useInView(root, '-15% 0px')
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [auto, setAuto] = useState(true)
  const [step, setStep] = useState(-1)
  const [run, setRun] = useState(0)
  const scenario = SCENARIOS[index]
  const hops = scenario.hops
  const total = hops.reduce((s, h) => s + h.ms, 0)
  const start = (i) => hops.slice(0, i).reduce((s, h) => s + h.ms, 0)
  const done = step >= hops.length
  const shown = hops.slice(0, Math.max(0, Math.min(step + 1, hops.length)))
  const elapsed = done ? total : step < 0 ? 0 : start(step + 1)

  useEffect(() => {
    if (!visible) return
    if (reduced) {
      setStep(hops.length)
      return
    }
    setStep(-1)
    const tl = gsap.timeline({ delay: 0.9 })
    hops.forEach((h, i) => tl.call(() => setStep(i)).to({}, { duration: hopTime(h) }))
    tl.call(() => setStep(hops.length))
    if (auto) tl.call(() => setIndex((n) => (n + 1) % SCENARIOS.length), null, `+=${PAUSE}`)
    return () => tl.kill()
  }, [index, visible, reduced, auto, run]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: reduced ? 'auto' : 'smooth' })
  }, [step, reduced])

  const pick = (i) => {
    setAuto(false)
    setIndex(i)
    setRun((r) => r + 1)
  }

  return (
    <section
      ref={root}
      id={compact ? undefined : 'build'}
      className={cx('bc tone-graphite', compact && 'bc--compact')}
      data-component="Engineering"
      aria-labelledby={compact ? undefined : 'bc-title'}
      aria-label={compact ? 'Behind the click' : undefined}
    >
      {!compact && <span className="bgword" aria-hidden="true">BUILD</span>}
      {!compact && (
      <header className="bc__head">
        <p className="g-meta label">
          <span className="g-square" aria-hidden="true" />
          Behind the click
        </p>
        <Reveal as="h2" lines id="bc-title" className="bc__title ap-title">
          <span className="line">
            <span>{rich(site.engineering?.headline ?? 'One click. *Everything it wakes up.*')}</span>
          </span>
        </Reveal>
        <Reveal as="p" className="bc__intro" delay={120}>
          {site.engineering?.intro}
        </Reveal>
        <Approach />
      </header>
      )}

      <div className="bc__win">
        <div className="bc__chrome">
          <span className="bc__dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <div className="bc__tabs" role="tablist" aria-label="Choose an action">
            {SCENARIOS.map((s, i) => (
              <button key={s.id} type="button" role="tab" aria-selected={i === index} className={cx('bc__tab', i === index && 'is-on')} onClick={() => pick(i)}>
                {s.label}
              </button>
            ))}
          </div>
          {!auto && (
            <button type="button" className="bc__auto" onClick={() => setAuto(true)}>
              ▶ Autoplay
            </button>
          )}
        </div>

        <div className="bc__panes">
          <div className="bc__pane bc__pane--app">
            <p className="bc__pane-title">
              <span>What you see</span>
              <span className="bc__scene">{scenario.plain}</span>
            </p>
            <AppMock scenario={scenario} step={step} onRun={() => pick(index)} />
          </div>

          <div className="bc__pane bc__pane--log">
            <p className="bc__pane-title">
              <span>What the server sees</span>
              <span className="bc__clock">
                <b>{elapsed}</b> ms
              </span>
            </p>
            <div ref={log} className="bc__log" role="log" aria-live="polite" aria-label="Server log">
              <p className="bc__line bc__line--dim">$ tail -f server.log</p>
              {shown.map((h, i) => (
                <div key={`${scenario.id}-${i}`} className={cx('bc__line', BACK(h) ? 'is-back' : 'is-out', i === step && 'is-now')}>
                  <span className="bc__t">+{start(i + 1)}ms</span>
                  <span className="bc__route">
                    {TAG[h.from]} <i>{BACK(h) ? '←' : '→'}</i> {TAG[h.to]}
                  </span>
                  <code>{h.tech}</code>
                  <span className="bc__say">{h.say}</span>
                </div>
              ))}
              {done && (
                <p className="bc__line bc__line--ok">
                  ✓ done · {hops.length} hops · {total}ms
                </p>
              )}
              <span className="bc__cursor" aria-hidden="true" />
            </div>
          </div>
        </div>

        <Relay scenario={scenario} step={step} hopTime={hopTime} reduced={reduced} />
      </div>
    </section>
  )
}
