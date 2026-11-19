import { useEffect, useState } from 'react'
import { Link } from '../../router'
import { site } from '../../data/site'
import { liveProjects } from '../../data/projects'
import Scribble from '../../components/Scribble/Scribble'
import { useVisitorName } from '../../lib/visitor'
import { returning } from '../../lib/visit'
import { cx } from '../../utils'
import office from '../../assets/akeem-office.jpg'
import './Human.css'

/*
  About, the human side: his photo taped to the page with notes around it about what he does, where
  he is and the time there right now, a few plain facts, and the road so far. Every fact here is
  true and comes from him or the site.
*/
const CITY = 'Ibadan'
const COUNTRY = 'Nigeria'
const ZONE = 'Africa/Lagos' // West Africa Time, Ibadan's clock
const SINCE = 2022
const BUILT = '30+' // websites built since 2022: client, team and personal
const CLIENTS = ['Small businesses', 'Restaurants', 'Schools', 'Personal brands']

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(id)
  }, [])
  return now
}

/*
  The availability line on the first screen: available, where, and the time there. Returning
  visitors get a welcome back first, by name if they gave one on the welcome page.
*/
export function Here({ className }) {
  const now = useClock()
  const name = useVisitorName()
  const [hello, setHello] = useState(returning)
  useEffect(() => {
    if (!hello) return
    const id = setTimeout(() => setHello(false), 4500)
    return () => clearTimeout(id)
  }, [hello])
  const time = now.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: ZONE }).replace(' ', '\u202f')
  return (
    <span className={cx(className, 'is-on')}>
      {hello ? `Welcome back${name ? `, ${name}` : ''}` : `Available for new work · ${CITY}, ${time}`}
    </span>
  )
}

/* His photo taped to the page, with what he does written around it. */
export function Sticker() {
  return (
    <figure className="hu__print is-main">
      <span className="hu__tape" aria-hidden="true" />
      <img src={office} alt="Akeem in a white shirt and tie, chin on his hand, thinking" width="900" height="1200" loading="lazy" decoding="async" />
      <figcaption className="hu__cap">thinking it through</figcaption>
      <Scribble to="right" className="hu__n is-1">
        designs the interface
      </Scribble>
      <Scribble to="left" className="hu__n is-2">
        writes the API
      </Scribble>
      <Scribble to="right" className="hu__n is-3">
        models the data
      </Scribble>
      <Scribble to="left" className="hu__n is-4">
        ships it live
      </Scribble>
    </figure>
  )
}

/* Where he is and what he's working on, right now. */
export function LifeCards() {
  const now = useClock()
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: ZONE })
  const day = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', timeZone: ZONE })
  const hour = Number(now.toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: ZONE }))
  const mood = hour < 6 ? 'probably asleep' : hour < 9 ? 'first coffee' : hour < 18 ? 'at the desk' : hour < 23 ? 'still building' : 'one more bug'
  return (
    <div className="hu__life">
      <div className="hu__card is-clock">
        <p className="hu__k">
          {CITY}, NG <span>· {mood}</span>
        </p>
        <p className="hu__time">{time}</p>
        <p className="hu__sub">{day}</p>
      </div>
      {site.now && (
        <div className="hu__card is-now">
          <p className="hu__k">
            {site.now.label}
          </p>
          <p className="hu__now">{site.now.text}</p>
          <p className="hu__sub">{site.now.focus}</p>
        </div>
      )}
    </div>
  )
}

/* A few plain facts. */
export function Facts() {
  const facts = [
    ['Based in', `${CITY}, ${COUNTRY}`],
    ['Building since', `${SINCE}, on purpose`],
    ['Out there now', `${liveProjects.length} products, open to try`],
    ['Works in', 'PostgreSQL · Express · React · Node'],
    ['Built for', CLIENTS.join(' · ')],
  ]
  return (
    <dl className="hu__facts">
      {facts.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/*
  The road so far: years of client work, a team build, the five on this page, and a stop that isn't
  built yet. The five are a selection, not the limit, and the road shows that.
*/
export function Road() {
  const thisYear = new Date().getFullYear()
  const stops = [
    { year: SINCE, title: 'Started building', text: 'First websites for real clients.', start: true },
    { year: `${SINCE}–25`, title: `${BUILT} websites`, text: `For ${CLIENTS.join(', ').toLowerCase()}.` },
    { year: 2025, title: 'A team build', text: 'Worked in a team to ship a product.' },
    { year: thisYear, title: `Five picked from ${BUILT}`, text: 'Recent, public, and mine to show.', five: true },
    { year: 'Next', title: 'A bigger build', text: 'Harder problem, bigger team, more users. Maybe yours.', next: true },
  ]
  return (
    <section className="hu__road" aria-labelledby="hu-road">
      <header className="hu__road-head">
        <p className="g-meta label">
          <span className="g-square" aria-hidden="true" />
          The road so far
        </p>
        <h3 id="hu-road" className="hu__road-title">
          {SINCE} <em>to now</em>
        </h3>
        <p className="hu__road-sub">{BUILT} websites in, and still getting better at it.</p>
      </header>
      <ol className="hu__stops">
        {stops.map((s, i) => (
          <li key={i} className={cx(s.start && 'is-start', s.five && 'is-now', s.next && 'is-next')}>
            <p className="hu__year">{s.year}</p>
            <i className="hu__dot" aria-hidden="true" />
            <div className="hu__stop">
              <b>{s.title}</b>
              <span>{s.text}</span>
              {s.five && (
                <span className="hu__five">
                  {liveProjects.map((p) => (
                    <Link key={p.id} to={`/work/${p.id}`}>
                      {p.title}
                    </Link>
                  ))}
                </span>
              )}
              {s.next && (
                <Link to="/work#contact" className="hu__next">
                  Bring me the brief <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
      <Scribble to="left" className="hu__road-note">
        where I am now, not where I stop.
      </Scribble>
    </section>
  )
}