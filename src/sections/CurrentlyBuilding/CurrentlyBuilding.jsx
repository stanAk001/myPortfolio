import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '../../router'
import { liveProjects, projects, STATUS } from '../../data/projects'
import { HISTORY_LENGTH, useUptime } from '../../lib/uptime'
import { useInView } from '../../hooks/useInView'
import Chapter from '../../components/Chapter/Chapter'
import { Lines, Reveal } from '../../components/Motion/Reveal'
import CountUp from '../../components/Motion/CountUp'
import { Screen } from '../../components/Devices/Devices'
import { cx, hostOf, themeVars } from '../../utils'
import './CurrentlyBuilding.css'

/*
  A status board. Every number is measured live from the visitor's browser: response times, a
  sparkline of recent checks, and uptime during this visit.
*/

function Spark({ history }) {
  // The first check includes DNS and TLS setup, so leave it out of the line once there are others.
  const ok = history.filter((r) => r.ok)
  const pts0 = ok.length > 3 ? ok.slice(1) : ok
  if (pts0.length < 2) return <div className="sb__spark" aria-hidden="true" />
  const max = Math.max(...pts0.map((r) => r.ms)) * 1.15
  const min = Math.min(...pts0.map((r) => r.ms)) * 0.85
  const pts = pts0.map((r, i) => [(i / (pts0.length - 1)) * 120, 34 - ((r.ms - min) / Math.max(1, max - min)) * 30])
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const ly = pts.at(-1)[1]
  return (
    <div className="sb__spark" aria-hidden="true">
      <svg viewBox="0 0 120 36" preserveAspectRatio="none">
        <polygon points={`0,36 ${line} 120,36`} className="sb__spark-area" />
        <polyline points={line} className="sb__spark-line" />
      </svg>
      {/* The latest point sits outside the stretched SVG so it stays round. */}
      <span className="sb__spark-dot" style={{ top: `${(ly / 36) * 100}%` }} />
    </div>
  )
}

function Bars({ history }) {
  const slots = Array.from({ length: HISTORY_LENGTH }, (_, i) => history[i - (HISTORY_LENGTH - history.length)])
  return (
    <div className="sb__bars" aria-hidden="true">
      {slots.map((r, i) => (
        <i key={i} data-state={!r ? 'empty' : r.ok ? 'up' : 'down'} title={r ? (r.ok ? `${r.ms}ms` : 'no reply') : undefined} />
      ))}
    </div>
  )
}

function Card({ project: p, history, playing }) {
  const last = history.at(-1)
  const okRate = history.length ? Math.round((history.filter((r) => r.ok).length / history.length) * 100) : null
  const state = !last ? 'checking' : last.ok ? (last.ms > 1500 ? 'slow' : 'up') : 'down'
  const label = { checking: 'Checking…', up: 'Operational', slow: 'Slow response', down: 'Not responding' }[state]
  const host = p.url ?? hostOf(p.liveUrl)

  return (
    <Reveal as="article" className="sb__card" style={themeVars(p)}>
      <a href={p.liveUrl} target="_blank" rel="noreferrer" className="sb__media" data-cursor="open">
        <Screen src={p.video?.mobile ?? p.video?.mp4} poster={p.image?.src} playing={playing} className="sb__video" />
        <span className="sb__shade" aria-hidden="true" />
        <span className="sb__url">
          <span aria-hidden="true">🔒</span> {host}
        </span>
        <span className="sb__rec">
          <i aria-hidden="true" /> Live
        </span>
      </a>
      <div className="sb__body">
        <div className="sb__top">
          <h3>{p.title}</h3>
          <span className="sb__pill" data-state={state}>
            <i aria-hidden="true" /> {label}
          </span>
        </div>
        {p.plain && <p className="sb__plain">{p.plain}</p>}
        <div className="sb__metrics">
          <div className="sb__ms">
            <span className="label">Response</span>
            <b>
              {last?.ok ? <CountUp value={last.ms} duration={0.8} /> : '—'}
              <small>ms</small>
            </b>
          </div>
          <Spark history={history} />
        </div>
        <Bars history={history} />
        <div className="sb__foot">
          <span className="label">Uptime this visit · {okRate == null ? '—' : `${okRate}%`}</span>
          <span className="sb__links">
            <a href={p.liveUrl} target="_blank" rel="noreferrer">
              Visit ↗
            </a>
            <Link to={`/work/${p.id}`}>Case study →</Link>
          </span>
        </div>
      </div>
    </Reveal>
  )
}

export default function CurrentlyBuilding() {
  const root = useRef(null)
  const visible = useInView(root, '200px 0px')
  const up = useUptime(visible)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [visible])

  const rows = liveProjects.map((p) => ({ p, history: up.byId[p.id] ?? [] }))
  const latest = rows.map((r) => r.history.at(-1)).filter(Boolean)
  const allUp = latest.length === rows.length && latest.every((r) => r.ok)
  const avg = useMemo(() => {
    const ms = rows.flatMap((r) => r.history.filter((x) => x.ok).map((x) => x.ms))
    return ms.length ? Math.round(ms.reduce((a, b) => a + b, 0) / ms.length) : null
  }, [rows])
  const ago = up.last ? Math.max(0, Math.round((now - up.last) / 1000)) : null

  return (
    <section ref={root} id="now" className="sb section theme-dark" data-component="StatusBoard" aria-labelledby="sb-title">
      <Chapter number="05">Live in production</Chapter>

      <div className="sb__head">
        <Reveal as="h2" lines id="sb-title" className="sb__title display">
          <Lines lines={['Not screenshots.', <em key="r">Running right now.</em>]} />
        </Reveal>
        <Reveal className="sb__banner" delay={150}>
          <span className={cx('sb__beacon', allUp && 'is-up')} aria-hidden="true" />
          <div>
            <b>{!latest.length ? 'Checking every site…' : allUp ? 'All systems operational' : 'Some sites are slow to answer'}</b>
            <span className="label">
              Pinged from your browser every 5 seconds{ago != null && ` · last check ${ago}s ago`}
            </span>
          </div>
        </Reveal>
      </div>

      <dl className="sb__stats">
        <Reveal className="sb__stat">
          <dt className="label">Products built end to end</dt>
          <dd className="display">
            <CountUp value={visible ? projects.length : 0} pad={2} />
          </dd>
        </Reveal>
        <Reveal className="sb__stat" delay={100}>
          <dt className="label">Live on the internet</dt>
          <dd className="display">
            <CountUp value={visible ? projects.filter((p) => STATUS[p.status]?.group === 'live').length : 0} pad={2} />
          </dd>
        </Reveal>
        <Reveal className="sb__stat" delay={200}>
          <dt className="label">Average response, measured now</dt>
          <dd className="display">
            <CountUp value={avg} />
            <small>ms</small>
          </dd>
        </Reveal>
        <Reveal className="sb__stat" delay={300}>
          <dt className="label">Checks run this visit</dt>
          <dd className="display">
            <CountUp value={up.checks * rows.length} pad={2} duration={0.6} />
          </dd>
        </Reveal>
      </dl>

      <div className="sb__grid">
        {rows.map(({ p, history }) => (
          <Card key={p.id} project={p} history={history} playing={visible} />
        ))}
      </div>
      <p className="sb__note label">Measured from your own connection, so the numbers reflect where you are.</p>
    </section>
  )
}
