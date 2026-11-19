/*
  The "before" pictures: each shows the frustration a project was built to fix. They read scroll
  progress from a ref (`meter`) so the problem visibly grows.
*/
import { useMemo } from 'react'
import { seeded } from '../../utils'

const TAB_TITLES = [
  'Top 10 tools (Sponsored)',
  'Best PM software 2026 — Ad',
  'Review: is it worth it?',
  'Compare plans | Pricing',
  'Reddit — which one?',
  '“Honest” review (affiliate)',
  'Alternatives to…',
  'Free trial — sign up',
  'Top picks this year',
  'Forum: anyone tried…',
]

export function Tabs({ meter }) {
  return (
    <div className="pv-tabs">
      <div className="pv-tabs__strip">
        {Array.from({ length: 24 }, (_, i) => (
          <span key={i} className="pv-tabs__tab" style={{ '--i': i }}>
            <i />
            {TAB_TITLES[i % TAB_TITLES.length]}
          </span>
        ))}
      </div>
      <div className="pv-tabs__page">
        <p className="pv-tabs__h">Top 10 Project Management Tools of 2026</p>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="pv-tabs__card">
            <span className="pv-tabs__logo" />
            <div>
              <b />
              <em />
              <em className="short" />
            </div>
            <span className="pv-tabs__ad">{i % 2 ? 'Affiliate link' : 'Sponsored'}</span>
          </div>
        ))}
      </div>
      <p className="pv-tabs__counter">
        Tabs open: <b ref={meter}>1</b>
      </p>
    </div>
  )
}

const JARGON = ['P/E', 'EBITDA', 'ROE', 'beta', 'P/B', 'yield', 'market cap', 'ETF', 'margin', 'EPS', 'bid/ask', 'volatility', 'float', 'RSI', 'MACD', 'liquidity', 'short', 'dividend']

export function Jargon({ meter }) {
  const words = useMemo(() => {
    const r = seeded('jargon')
    return JARGON.map((w) => ({ w, x: 6 + r() * 78, y: 8 + r() * 52, s: 0.8 + r() * 1.3, d: r() * 4 }))
  }, [])
  return (
    <div className="pv-jargon">
      {words.map(({ w, x, y, s, d }) => (
        <span key={w} className="pv-jargon__w" style={{ left: `${x}%`, top: `${y}%`, '--s': s, '--d': `${d}s` }}>
          {w}
        </span>
      ))}
      <span className="pv-jargon__q">?</span>
      <div className="pv-jargon__chart">
        <svg viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true">
          <path pathLength="1" d="M0 18 L40 22 L70 14 L100 30 L130 26 L160 44 L190 40 L220 58 L250 54 L300 74" />
        </svg>
        <span>Learning with real money</span>
        <b ref={meter}>−0%</b>
      </div>
      <div className="pv-jargon__tags">
        <span>English only</span>
        <span>US stocks only</span>
      </div>
    </div>
  )
}

export function Scroll({ meter }) {
  const items = useMemo(() => {
    const r = seeded('scroll')
    return Array.from({ length: 24 }, () => ({ h: 50 + r() * 30, c: `hsl(${20 + r() * 30} ${8 + r() * 10}% ${80 + r() * 8}%)` }))
  }, [])
  return (
    <div className="pv-scroll">
      <div className="pv-scroll__grid">
        {[0, 1].map((copy) => (
          <div key={copy} className="pv-scroll__set">
            {items.map((it, i) => (
              <div key={i} className="pv-scroll__item">
                <span style={{ background: it.c, height: `${it.h}%` }} />
                <b />
                <em />
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="pv-scroll__q">Is this for me?</p>
      <p className="pv-scroll__counter">
        Products seen: <b ref={meter}>0</b>
      </p>
    </div>
  )
}

const DMS = ['hi, are you free on the 14th?', 'how much for a wedding?', 'do you have videos of you working?', 'send your rate pls', 'who have you worked with?', 'are you available in Lagos?', 'can I see a recent show?', 'hello?? 👀']

export function Dms({ meter }) {
  return (
    <div className="pv-dms">
      <div className="pv-dms__head">
        <span className="pv-dms__avatar">H</span>
        <div>
          <b>Messages</b>
          <small>
            <span ref={meter}>0</span> unread
          </small>
        </div>
      </div>
      <div className="pv-dms__list">
        {DMS.map((m, i) => (
          <p key={m} className="pv-dms__msg" style={{ '--i': i }}>
            {m}
          </p>
        ))}
      </div>
    </div>
  )
}

export const VISUALS = { tabs: Tabs, jargon: Jargon, scroll: Scroll, dms: Dms }

// What each meter shows as the problem grows (p = 0 → 1).
export const METERS = {
  tabs: (p) => String(1 + Math.round(p * 36)),
  jargon: (p) => `−${Math.round(p * 38)}%`,
  scroll: (p) => Math.round(p * 1284).toLocaleString('en'),
  dms: (p) => String(Math.round(p * 23)),
}
