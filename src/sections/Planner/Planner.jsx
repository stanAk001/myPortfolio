import { useMemo, useRef, useState } from 'react'
import { site } from '../../data/site'
import Chapter from '../../components/Chapter/Chapter'
import { Lines, Reveal } from '../../components/Motion/Reveal'
import { confetti } from '../../lib/confetti'
import { cx } from '../../utils'
import './Planner.css'

/*
  "Build your idea": the visitor describes what they want and watches it come together. Each toggle
  adds a real piece to the mockup and to the brief, and the brief goes to Akeem by email.
  No prices or timelines. Those depend on the conversation, and making them up would be dishonest.
*/
const TYPES = [
  { id: 'store', label: 'Online store', icon: '🛍️', name: 'My Shop', hero: 'New season, new finds.', defaults: ['payments', 'search', 'uploads'] },
  { id: 'booking', label: 'Booking site', icon: '📅', name: 'Book Me', hero: 'Reserve your date in seconds.', defaults: ['bookings', 'reviews'] },
  { id: 'learning', label: 'Learning platform', icon: '🎓', name: 'Learnly', hero: 'Learn it properly. Start free.', defaults: ['accounts', 'payments', 'progress'] },
  { id: 'business', label: 'Business website', icon: '🏢', name: 'Studio Co.', hero: 'We help businesses grow.', defaults: ['blog', 'contact'] },
  { id: 'app', label: 'Web app / dashboard', icon: '📊', name: 'Dashly', hero: 'Everything in one dashboard.', defaults: ['accounts', 'admin', 'search'] },
]

const FEATURES = [
  { id: 'accounts', label: 'Accounts & login', step: 'Secure sign-up, login and password reset', stack: ['Authentication', 'PostgreSQL'] },
  { id: 'payments', label: 'Online payments', step: 'Checkout and payment confirmation', stack: ['Payments'] },
  { id: 'admin', label: 'Admin dashboard', step: 'A dashboard to manage everything without code', stack: ['React', 'Express'] },
  { id: 'search', label: 'Search & filters', step: 'Fast search with filters', stack: ['PostgreSQL', 'Prisma'] },
  { id: 'uploads', label: 'Image uploads', step: 'Image uploads, resized automatically', stack: ['Cloudinary'] },
  { id: 'bookings', label: 'Bookings & calendar', step: 'Availability calendar and booking requests', stack: ['PostgreSQL'] },
  { id: 'reviews', label: 'Reviews & ratings', step: 'Reviews and star ratings', stack: ['PostgreSQL'] },
  { id: 'blog', label: 'Blog / news', step: 'A blog you can update yourself', stack: ['React'] },
  { id: 'progress', label: 'Courses & progress', step: 'Lessons with progress tracking', stack: ['PostgreSQL', 'Prisma'] },
  { id: 'contact', label: 'Contact & email', step: 'Contact form that lands in your inbox', stack: ['Express'] },
]

const BASE_STACK = ['React', 'Node.js', 'Express', 'PostgreSQL', 'Vercel']

function Mockup({ type, on, name }) {
  const has = (id) => on.has(id)
  return (
    <div className={cx('mk2', `mk2--${type.id}`)}>
      <div className="mk2__chrome">
        <span className="mk2__dots">
          <i />
          <i />
          <i />
        </span>
        <span className="mk2__url">🔒 {(name || type.name).toLowerCase().replace(/[^a-z0-9]+/g, '')}.com</span>
      </div>
      <div className="mk2__body">
        {has('admin') && (
          <aside className="mk2__admin pop">
            <b>Admin</b>
            {['Dashboard', 'Orders', 'Users', 'Settings'].map((s) => (
              <span key={s}>{s}</span>
            ))}
          </aside>
        )}
        <div className="mk2__site">
          <header className="mk2__nav">
            <b>{name || type.name}</b>
            <span className="mk2__links">
              <i />
              <i />
              {has('blog') && <em className="pop">Blog</em>}
            </span>
            {has('search') && <span className="mk2__search pop">⌕ Search…</span>}
            {has('payments') && (
              <span className="mk2__cart pop">
                🛒<sup>2</sup>
              </span>
            )}
            {has('accounts') && <span className="mk2__login pop">Log in</span>}
          </header>

          <section className="mk2__hero" key={type.id}>
            <p>{type.hero}</p>
            <span className="mk2__cta">{type.id === 'booking' || has('bookings') ? 'Book now' : type.id === 'store' ? 'Shop now' : 'Get started'}</span>
          </section>

          {has('search') && (
            <div className="mk2__filters pop">
              {['All', 'Popular', 'New', 'Under $25'].map((f, i) => (
                <span key={f} className={i === 0 ? 'is-on' : undefined}>
                  {f}
                </span>
              ))}
            </div>
          )}

          <div className="mk2__grid">
            {Array.from({ length: type.id === 'business' ? 3 : 4 }, (_, i) => (
              <div key={i} className="mk2__card">
                <span className={cx('mk2__img', has('uploads') && 'is-photo')} style={{ '--h': `${(i * 47) % 360}` }} />
                <b />
                {has('reviews') && <em className="mk2__stars pop">★★★★★</em>}
                {has('progress') && (
                  <span className="mk2__progress pop">
                    <i style={{ width: `${[80, 45, 20, 60][i]}%` }} />
                  </span>
                )}
                {has('payments') && <span className="mk2__buy pop">Add to cart</span>}
              </div>
            ))}
          </div>

          {has('bookings') && (
            <div className="mk2__cal pop">
              <b>Pick a date</b>
              <div>
                {Array.from({ length: 14 }, (_, i) => (
                  <span key={i} className={cx(i === 9 && 'is-on', [2, 5, 11].includes(i) && 'is-off')}>
                    {i + 10}
                  </span>
                ))}
              </div>
            </div>
          )}

          {has('contact') && (
            <div className="mk2__contact pop">
              <span />
              <span />
              <em>Send message</em>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Planner() {
  const [typeId, setTypeId] = useState('store')
  const [on, setOn] = useState(() => new Set(TYPES[0].defaults))
  const [name, setName] = useState('')
  const [sent, setSent] = useState(false)
  const sendBtn = useRef(null)
  const type = TYPES.find((t) => t.id === typeId)

  const pickType = (t) => {
    setTypeId(t.id)
    setOn(new Set(t.defaults))
    setSent(false)
  }
  const toggle = (id) =>
    setOn((s) => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const chosen = FEATURES.filter((f) => on.has(f.id))
  const stack = useMemo(() => [...new Set([...BASE_STACK, ...chosen.flatMap((f) => f.stack)])], [chosen])
  const steps = ['Design every screen, desktop and mobile', ...chosen.map((f) => f.step), 'Launch on a real web address, fast and secure']

  const brief = [
    `Hi ${site.name},`,
    '',
    `I'd like to build: ${type.label}${name ? ` — “${name}”` : ''}.`,
    '',
    'Features:',
    ...(chosen.length ? chosen.map((f) => `• ${f.label}`) : ['• (just the essentials)']),
    '',
    'A bit more about it:',
    '',
  ].join('\n')

  const send = () => {
    const b = sendBtn.current.getBoundingClientRect()
    confetti(b.left + b.width / 2, b.top + b.height / 2)
    setSent(true)
    setTimeout(() => {
      window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(`Project brief: ${name || type.label}`)}&body=${encodeURIComponent(brief)}`
    }, 600)
  }

  return (
    <section id="plan" className="pl section theme-dark" data-component="Planner" aria-labelledby="pl-title">
      <Chapter number="07">Your turn</Chapter>
      <div className="pl__head">
        <Reveal as="h2" lines id="pl-title" className="pl__title display">
          <Lines lines={['Build your idea —', <em key="l">live.</em>]} />
        </Reveal>
        <Reveal as="p" className="pl__intro lead" delay={150}>
          Pick what you want to make and tick the features. Watch it come together, then send me the brief.
        </Reveal>
      </div>

      <div className="pl__app">
        <div className="pl__controls">
          <p className="pl__step label">
            <span>1</span> What are you building?
          </p>
          <div className="pl__types" role="radiogroup" aria-label="Type of project">
            {TYPES.map((t) => (
              <button key={t.id} type="button" role="radio" aria-checked={t.id === typeId} className={cx('pl__type', t.id === typeId && 'is-on')} onClick={() => pickType(t)}>
                <span aria-hidden="true">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          <p className="pl__step label">
            <span>2</span> What should it do?
          </p>
          <div className="pl__features">
            {FEATURES.map((f) => (
              <label key={f.id} className={cx('pl__feat', on.has(f.id) && 'is-on')}>
                <input type="checkbox" checked={on.has(f.id)} onChange={() => toggle(f.id)} />
                <span className="pl__check" aria-hidden="true" />
                {f.label}
              </label>
            ))}
          </div>

          <p className="pl__step label">
            <span>3</span> Give it a name <small>(optional)</small>
          </p>
          <input className="pl__name" value={name} maxLength={28} placeholder={type.name} onChange={(e) => setName(e.target.value)} aria-label="Project name" />
        </div>

        <div className="pl__preview">
          <Mockup type={type} on={on} name={name} />
          <div className="pl__summary">
            <div>
              <p className="label">How I’d build it</p>
              <ol className="pl__plan">
                {steps.map((s, i) => (
                  <li key={s} style={{ '--i': i }}>
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="label">With</p>
              <div className="pl__stack">
                {stack.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
              <button ref={sendBtn} type="button" className="btn btn--solid pl__send" onClick={send}>
                {sent ? 'Opening your email… ✓' : `Send this brief to ${site.name} →`}
              </button>
              <p className="pl__note label">Opens your email with everything filled in.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
