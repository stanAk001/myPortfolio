import { useLayoutEffect } from 'react'
import { Link } from '../router'
import { site } from '../data/site'

export default function NotFound() {
  useLayoutEffect(() => {
    document.title = `Not found — ${site.name}`
    window.scrollTo(0, 0)
  }, [])

  return (
    <section className="section theme-dark" style={{ minHeight: '100svh', display: 'grid', alignContent: 'center', gap: 32 }}>
      <p className="label">404</p>
      <h1 className="display" style={{ fontSize: 'var(--fs-xl)', maxWidth: '12ch' }}>
        This page was never <em>built.</em>
      </h1>
      <Link to="/work" className="arrow-link" style={{ justifySelf: 'start' }}>
        Back to the work <span aria-hidden="true">→</span>
      </Link>
    </section>
  )
}
