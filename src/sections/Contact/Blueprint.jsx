import { cx } from '../../utils'
import './Blueprint.css'

/*
  "Good ideas deserve to be built", so the visitor watches theirs get drawn while they describe it.
  The brief on the right drives the blueprint on the left: product type picks the layout (site, app,
  store), their name becomes the brand, and what they type becomes the headline, letter by letter.
  Sending "builds" it: lines go solid, blocks fill, the address bar goes live. It's a sketch of their
  idea, not a promise, and the label says so.
*/
const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 18)

function headline(message) {
  const m = message.trim()
  if (!m) return null
  const first = m.split(/(?<=[.!?])\s/)[0]
  return first.length > 64 ? `${first.slice(0, 62).trim()}…` : first
}

const Bars = ({ n, from = 0, w = [] }) =>
  Array.from({ length: n }, (_, k) => <i key={k} className="bp__bar bp__el" style={{ '--i': from + k, '--w': w[k] ?? `${70 - k * 14}%` }} />)

function Layout({ kind, brand, title, focus }) {
  const Title = (
    <p className={cx('bp__title bp__el', focus === 'message' && 'is-live', !title && 'is-empty')} style={{ '--i': 4 }}>
      {title ?? 'Your idea, here.'}
      {focus === 'message' && <span className="bp__caret" />}
    </p>
  )
  const Brand = (
    <span className={cx('bp__brand bp__el', focus === 'name' && 'is-live')} style={{ '--i': 1 }}>
      {brand}
      {focus === 'name' && <span className="bp__caret" />}
    </span>
  )
  if (kind === 'Web app')
    return (
      <div className="bp__page is-app">
        <aside className="bp__side bp__el" style={{ '--i': 0 }}>
          {Brand}
          <Bars n={5} from={2} w={['80%', '64%', '72%', '56%', '68%']} />
        </aside>
        <div className="bp__main">
          <div className="bp__top bp__el" style={{ '--i': 3 }}>
            <i className="bp__search" />
            <i className="bp__avatar" />
          </div>
          {Title}
          <div className="bp__stats">
            {[0, 1, 2].map((k) => (
              <div key={k} className="bp__card bp__el" style={{ '--i': 5 + k }}>
                <i className="bp__bar" style={{ '--w': '40%' }} />
                <b />
              </div>
            ))}
          </div>
          <svg className="bp__chart bp__el" style={{ '--i': 8 }} viewBox="0 0 300 70" preserveAspectRatio="none">
            <path d="M0 58 L30 50 L60 54 L90 38 L120 42 L150 26 L180 32 L210 18 L240 22 L270 10 L300 14" />
          </svg>
        </div>
      </div>
    )
  if (kind === 'Online store')
    return (
      <div className="bp__page is-store">
        <nav className="bp__nav bp__el" style={{ '--i': 0 }}>
          {Brand}
          <span className="bp__links">
            <Bars n={3} from={2} w={['34px', '28px', '38px']} />
            <i className="bp__cart" />
          </span>
        </nav>
        {Title}
        <div className="bp__grid">
          {Array.from({ length: 8 }, (_, k) => (
            <div key={k} className="bp__product bp__el" style={{ '--i': 5 + k }}>
              <i className="bp__img" />
              <i className="bp__bar" style={{ '--w': '80%' }} />
              <i className="bp__bar is-price" style={{ '--w': '36%' }} />
            </div>
          ))}
        </div>
      </div>
    )
  // Website, and anything that isn't an app or a store.
  return (
    <div className={cx('bp__page', kind === 'Something else' ? 'is-open' : 'is-site')}>
      <nav className="bp__nav bp__el" style={{ '--i': 0 }}>
        {Brand}
        <span className="bp__links">
          <Bars n={4} from={2} w={['30px', '38px', '26px', '34px']} />
        </span>
      </nav>
      <div className="bp__hero">
        {Title}
        <Bars n={2} from={5} w={['72%', '54%']} />
        <span className="bp__ctas bp__el" style={{ '--i': 7 }}>
          <i />
          <i />
        </span>
      </div>
      <div className="bp__row">
        {[0, 1, 2].map((k) => (
          <div key={k} className="bp__card bp__el" style={{ '--i': 8 + k }}>
            <i className="bp__img" />
            <i className="bp__bar" style={{ '--w': '70%' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Blueprint({ form, focus, done }) {
  const brand = form.name.trim().split(/\s+/)[0] || 'Your brand'
  const host = `${slug(form.name) || 'your-idea'}.com`
  const title = headline(form.message)
  return (
    <figure className={cx('bp', done && 'is-built', focus && 'is-drafting')} aria-label="A sketch of your idea, drawn from the brief">
      <div className="bp__screen">
        <div className="bp__bar-top">
          <span className="bp__dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="bp__host">
            {done && <i className="bp__live" aria-hidden="true" />}
            {host}
          </span>
          <span className="bp__state">{done ? 'Built · live' : 'Drafting'}</span>
        </div>
        <div key={form.kind} className="bp__canvas">
          <Layout kind={form.kind} brand={brand} title={title} focus={focus} />
        </div>
      </div>
      <figcaption className="bp__cap">
        <span>{done ? 'Next: the real one.' : 'Your idea, sketched live from the brief'}</span>
        <span>{form.kind}</span>
      </figcaption>
    </figure>
  )
}
