import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from '../../router'
import { scrollToEl, scrollToY } from '../../lib/smooth'
import { site } from '../../data/site'
import { useReducedMotion } from '../../hooks/useMedia'
import { PinWall, FLYERS } from '../../sections/Studio/Studio'
import { CUT_KEY } from '../../sections/Studio/QuickCut'
import OnAir from './OnAir'
import Suite from './Suite'
import LaunchKit from './LaunchKit'
import { THEBOX } from '../TheBox/TheBox'
import '../TheBox/TheBox.css'
import '../../sections/Studio/cut.css'
import './StudioPage.css'

/*
  The studio: what I make besides code, laid out as one launch. A clapperboard at the top, the edit
  suite (every part of a launch on one timeline, each part a service), the flyer wall, and an
  export dialog that turns the parts someone wants into a brief.
*/

const readCut = () => {
  try {
    return JSON.parse(sessionStorage.getItem(CUT_KEY))
  } catch {
    return null
  }
}

/* The clapperboard: production, scene, take. Claps once, then gets out of the way. */
function Slate() {
  const reduced = useReducedMotion()
  const [gone, setGone] = useState(reduced)
  const [take] = useState(() => {
    try {
      const n = Number(localStorage.getItem('studio:take') || 0) + 1
      localStorage.setItem('studio:take', String(n))
      return n
    } catch {
      return 1
    }
  })
  useEffect(() => {
    if (gone) return
    const id = setTimeout(() => setGone(true), 1250)
    return () => clearTimeout(id)
  }, [gone])
  if (gone) return null
  return (
    <div className="sl" role="presentation" onClick={() => setGone(true)}>
      <div className="sl__board">
        <div className="sl__sticks">
          <i className="sl__top" />
          <i className="sl__bottom" />
        </div>
        <dl className="sl__grid">
          <div className="sl__prod">
            <dt>Production</dt>
            <dd>Studio — beyond code</dd>
          </div>
          <div>
            <dt>Scene</dt>
            <dd>01</dd>
          </div>
          <div>
            <dt>Take</dt>
            <dd>{String(take).padStart(2, '0')}</dd>
          </div>
          <div>
            <dt>Roll</dt>
            <dd>A</dd>
          </div>
          <div>
            <dt>Director</dt>
            <dd>{site.name}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

export default function StudioPage() {
  const [cut] = useState(readCut)
  const [selected, setSelected] = useState(null)
  const [wall, setWall] = useState(null)
  const [wanted, setWanted] = useState(null)
  const [jump, setJump] = useState(null)
  const suiteRef = useRef(null)
  const wallRef = useRef(null)
  const kitRef = useRef(null)

  useLayoutEffect(() => {
    document.title = `Studio — ${site.name}`
    scrollToY(0, { immediate: true })
  }, [])

  // A monitor clicked in the intro: that film, cued up in the suite.
  const openFilm = (id) => {
    setJump({ id })
    scrollToEl(suiteRef.current)
  }
  const showFlyers = (brand) => {
    setWall({ brand })
    scrollToEl(wallRef.current)
  }
  const addToKit = (track) => {
    setWanted({ track })
    scrollToEl(kitRef.current)
  }

  return (
    <div className="st tone-night">
      <Slate />

      <p className="st__crumbs label">
        <Link to="/work" className="st__back">
          ← The work
        </Link>
        <span aria-hidden="true">/</span> Studio
      </p>
      <OnAir onOpen={openFilm} onReel={() => scrollToEl(suiteRef.current)} onKit={() => scrollToEl(kitRef.current)} />

      {/* A case study: the system, plus the films I made so people would actually use it. */}
      <section className="tbx" aria-labelledby="tbx-title">
        <Link to={THEBOX.path} className="tbx__shot" tabIndex={-1} aria-hidden="true">
          <img src={`https://i.ytimg.com/vi/${THEBOX.engine}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" />
          <span className="lite__play" />
        </Link>
        <div className="tbx__copy">
          <p className="label">Case study · {THEBOX.title}</p>
          <h2 id="tbx-title" className="tbx__title">
            <Link to={THEBOX.path}>{THEBOX.headline}</Link>
          </h2>
          <p className="tbx__hook">{THEBOX.hook} I built the system that fixed it, then made the films that taught people to use it.</p>
          <Link to={THEBOX.path} className="g-btn g-btn--solid">
            Read the story <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section ref={suiteRef} className="sd__part" aria-labelledby="st-suite">
        <div className="sd__part-head">
          <p id="st-suite" className="label">
            01 · The edit suite
          </p>
          <p className="sd__part-note">
            {cut ? `Your cut for ${cut.name} is at the head of the reel. ` : ''}Every layer of a launch on one timeline. Click a track to see what you’d get; mute the score or solo the voice — they’re the real stems.
          </p>
        </div>
        <Suite cut={cut} jump={jump} selected={selected} onSelect={setSelected} onFlyers={showFlyers} onService={addToKit} />
      </section>

      <section ref={wallRef} className="sd__part" aria-labelledby="st-wall">
        <div className="sd__part-head">
          <p id="st-wall" className="label">
            02 · The pin wall
          </p>
          <p className="sd__part-note">{FLYERS.length} flyers I designed for KeemStore and Toolhaven’s Pinterest campaigns, hung to dry. Scroll to walk the line, or grab it and throw; click a print to open it.</p>
        </div>
        <PinWall show={wall} onEnd={() => scrollToEl(kitRef.current)} />
      </section>

      <section ref={kitRef} className="sd__part" aria-labelledby="st-kit">
        <div className="sd__part-head">
          <p id="st-kit" className="label">
            03 · Render your launch kit
          </p>
          <p className="sd__part-note">Tick the layers you need. It renders straight to my inbox as a brief, and I’ll reply with a plan.</p>
        </div>
        <LaunchKit cut={cut} wanted={wanted} />
      </section>
    </div>
  )
}
