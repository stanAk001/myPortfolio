import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from '../../router'
import { Reveal } from '../../components/Motion/Reveal'
import { useInView } from '../Gallery/LiveView'
import { useReducedMotion } from '../../hooks/useMedia'
import { scrollToEl } from '../../lib/smooth'
import { playCut, VIBES } from '../../lib/cutScore'
import { buildCut, buildFlyer } from './cut'
import { CLIPS, FLYERS } from './Studio'
import { cx } from '../../utils'
import Projector from './Projector'
import './cut.css'
import './QuickCut.css'

/*
  The studio teaser on the work page. The claim first (I don't just build it, I launch it), the proof
  in numbers, and one big button. Next to it, proof you can try: a monitor with a control deck. Type
  a product name, pick a vibe, and an 8-second ad gets cut on the spot, picture and original music,
  in the browser. Until then a sample plays silently. The visitor's cut follows them to the studio
  page and shows up on its timeline.
*/

const SAMPLES = [
  ['Mama’s Kitchen', 'food'],
  ['Northline', 'fashion'],
  ['Pocketly', 'tech'],
  ['Ironside Gym', 'fitness'],
]
export const CUT_KEY = 'studio:cut'

export default function QuickCut() {
  const { navigate } = useRouter()
  const root = useRef(null)
  const stage = useRef(null)
  const flyer = useRef(null)
  const input = useRef(null)
  const tl = useRef(null)
  const score = useRef(null)
  const reduced = useReducedMotion()
  const [, seen] = useInView(root)
  const [name, setName] = useState('')
  const [vibe, setVibe] = useState('food')
  const [sound, setSound] = useState(true)
  const [phase, setPhase] = useState('demo') // demo → playing → done
  const [sample, setSample] = useState(0)
  const [made, setMade] = useState(false) // the visitor has cut their own
  const ads = CLIPS.filter((c) => c.kind.startsWith('Ad')).length
  const edits = CLIPS.length - ads

  const stopScore = () => {
    score.current?.stop()
    score.current = null
  }

  // The silent sample, cycling through a few made-up brands while nobody's typed anything.
  useEffect(() => {
    if (phase !== 'demo' || !stage.current) return
    const [n, v] = SAMPLES[sample]
    const t = buildCut(stage.current, { name: n, vibe: v })
    tl.current = t
    if (reduced || !seen) {
      t.progress(1)
      return () => t.kill()
    }
    t.eventCallback('onComplete', () => setTimeout(() => setSample((s) => (s + 1) % SAMPLES.length), 1400))
    t.play(0)
    return () => t.kill()
  }, [phase, sample, seen, reduced])

  const cut = useCallback(
    (e) => {
      e?.preventDefault()
      const label = name.trim() || SAMPLES[0][0]
      stopScore()
      tl.current?.kill()
      const t = buildCut(stage.current, { name: label, vibe })
      tl.current = t
      buildFlyer(flyer.current, { name: label, vibe })
      t.eventCallback('onComplete', () => setPhase('done'))
      setPhase('playing')
      setMade(true)
      score.current = playCut(vibe, { muted: !sound })
      t.play(0)
      // Stacked layout: the monitor is below the form, so scroll it into view for the show.
      if (window.matchMedia('(max-width: 960px)').matches) scrollToEl(stage.current.parentElement)
    },
    [name, vibe, sound],
  )

  // Sound can be toggled mid-cut without losing the beat.
  useEffect(() => {
    score.current?.mute(!sound)
  }, [sound])

  // Scrolled away mid-cut: stop it instead of playing to an empty room.
  useEffect(() => {
    if (seen || phase !== 'playing') return
    tl.current?.pause()
    stopScore()
    setPhase('done')
  }, [seen, phase])

  useEffect(() => () => stopScore(), [])

  const enter = () => {
    stopScore()
    try {
      sessionStorage.setItem(CUT_KEY, JSON.stringify({ name: name.trim() || SAMPLES[0][0], vibe }))
    } catch {
      // Storage blocked: the studio opens without the visitor's cut on the timeline.
    }
    navigate('/studio')
  }

  const edit = () => {
    setPhase('demo')
    input.current?.focus()
  }

  // The link carries the visitor's cut along, if they made one.
  const toStudio = () => (made ? enter() : navigate('/studio'))

  return (
    <section ref={root} id="studio" className="qc tone-night" aria-labelledby="qc-title">
      <span className="bgword" aria-hidden="true">DESIGN</span>
      <Projector cutting={phase === 'playing'} vibe={vibe} />
      <div className="qc__copy">
        <p className="qc__kicker label">
          Beyond code — the studio
        </p>
        <Reveal as="h2" lines id="qc-title" className="qc__title">
          <span className="line">
            <span>I don’t just build it.</span>
          </span>
          <span className="line">
            <span className="qc__thin">
              I <em>launch it.</em>
            </span>
          </span>
        </Reveal>
        <p className="qc__intro">
          The ad film, the original score, the voice, the flyers — made by the same person who wrote the code. Don’t take my word for it: give me your product’s name and I’ll cut you an ad, right now.
        </p>

        <dl className="qc__proof">
          <div>
            <dt>{String(ads).padStart(2, '0')}</dt>
            <dd>ad films</dd>
          </div>
          <div>
            <dt>{FLYERS.length}</dt>
            <dd>flyers</dd>
          </div>
          <div>
            <dt>{String(edits).padStart(2, '0')}</dt>
            <dd>client edits</dd>
          </div>
        </dl>

        <div className="qc__enter">
          <button type="button" className="qc__door" onClick={toStudio}>
            <span>
              <small className="label">Every film, flyer and edit</small>
              Enter the studio
            </span>
            <i aria-hidden="true">→</i>
          </button>
        </div>
      </div>

      <div className="qc__screen">
        <div className="qc__rig">
          <div className="qc__frame" style={{ viewTransitionName: 'studio-monitor' }}>
            <div ref={stage} className="ct" aria-hidden="true" />
            {phase === 'demo' && (
              <span className="qc__badge label" aria-hidden="true">
                Sample · type your brand below
              </span>
            )}
            {phase === 'done' && (
              <div className="qc__outro" role="status">
                <p className="qc__took">
                  That took 8 seconds.
                  <span>Imagine what I do with a week.</span>
                </p>
                <div className="qc__outro-btns">
                  <button type="button" className="g-btn g-btn--solid" onClick={enter}>
                    Take it into the studio →
                  </button>
                  <button type="button" className="g-btn" onClick={cut}>
                    Replay
                  </button>
                  <button type="button" className="g-btn" onClick={edit}>
                    Change the name
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* The monitor's control deck, where the brief goes in. */}
          <form className="qc__deck" onSubmit={cut}>
            <p className="qc__deck-title label">
              <span>Try me</span> — your brand, cut in 8 seconds
            </p>
            <div className="qc__deck-row">
              <label className="qc__field">
                <span className="sr-only">Your product’s name</span>
                <input
                  ref={input}
                  value={name}
                  maxLength={28}
                  placeholder="Your product’s name"
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <button type="submit" className="qc__go">
                <span className="qc__rec" aria-hidden="true" />
                {phase === 'playing' ? 'Cutting…' : 'Cut my ad'}
              </button>
            </div>
            <div className="qc__deck-row qc__deck-row--sub">
              <div className="qc__vibes" role="radiogroup" aria-label="Vibe">
                {Object.entries(VIBES).map(([id, v]) => (
                  <button key={id} type="button" role="radio" aria-checked={vibe === id} onClick={() => setVibe(id)}>
                    {v.label}
                  </button>
                ))}
              </div>
              <button type="button" className={cx('qc__sound', sound && 'is-on')} onClick={() => setSound((s) => !s)} aria-pressed={sound}>
                <span className="qc__bars" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                {sound ? 'Sound on' : 'Sound off'}
              </button>
            </div>
          </form>
        </div>
        <div ref={flyer} className={cx('fy qc__flyer', phase === 'done' && 'is-in')} aria-hidden="true" />
      </div>
    </section>
  )
}
