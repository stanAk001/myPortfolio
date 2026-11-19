import { useEffect, useReducer, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useMedia'
import { site } from '../../data/site'
import { cx } from '../../utils'
import Bug from './Bug'
import { collapse, rebuildWrong, repair } from './breakPage'
import { BEATS, DARK, FLOW, K_GONE, LIVE, MOOD, ON_PERCH, REPAIR, REPLY, TAUNT, TOAST } from './script'
import './Egg.css'

/*
  The easter egg. The bug behind the footer rule steals the k from "Akeem" and dares you not to
  press a button. Press it and the page falls off the screen, you and the bug try to fix it, it
  comes back wrong, then Akeem turns up. It all sits on top of the page: nothing is scanned,
  stored or sent, scrolling still works, and Close, Escape or scrolling away resets everything.
*/
const reduce = (s, event) => {
  const phase = FLOW[s.phase]?.[event]
  if (!phase) return s
  return { phase, run: event === 'REPLAY' ? s.run + 1 : s.run }
}

/* The repair log, typed out. Its timers get cleaned up with it, so closing never leaves text typing. */
function RepairLog({ reduced, onDone }) {
  const [at, setAt] = useState(reduced ? [REPAIR.length, 0] : [0, 0])
  const [line, ch] = at
  const finished = line >= REPAIR.length

  useEffect(() => {
    if (finished) {
      const id = setTimeout(onDone, reduced ? 2800 : 900)
      return () => clearTimeout(id)
    }
    const end = ch >= REPAIR[line].text.length
    const id = setTimeout(() => setAt(end ? [line + 1, 0] : [line, ch + 1]), end ? 260 : 14)
    return () => clearTimeout(id)
  }, [line, ch, finished, reduced, onDone])

  return (
    <div className="egg__term">
      <ul className="sr-only" role="log" aria-live="polite">
        {REPAIR.slice(0, line).map((l) => (
          <li key={l.text}>{l.text}</li>
        ))}
      </ul>
      <div aria-hidden="true">
        {REPAIR.map((l, i) =>
          i > line ? null : (
            <p key={l.text} className={cx(l.found && 'is-found', l.bad && 'is-bad')}>
              {i === line ? l.text.slice(0, ch) : l.text}
              {i === line && <b className="egg__caret" />}
            </p>
          ),
        )}
      </div>
      <button type="button" className="egg__link" onClick={onDone}>
        Hurry up →
      </button>
    </div>
  )
}

/* Dialogue lines a beat apart. The choices only show once the punchline has landed. */
function Beats({ lines, reduced, gap = 1350, children }) {
  const [n, setN] = useState(reduced ? lines.length : 1)
  useEffect(() => {
    if (n >= lines.length) return
    const id = setTimeout(() => setN(n + 1), gap)
    return () => clearTimeout(id)
  }, [n, lines.length, gap])
  return (
    <div className="egg__beats">
      <div aria-live="polite">
        {lines.slice(0, n).map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>
      <div className="egg__choices">{n >= lines.length && children}</div>
    </div>
  )
}

/* Akeem arrives. The page snaps back the moment he does, and the bug tries to look innocent. */
function Caught({ reduced, onReveal }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const steps = [setTimeout(() => setN(1), 1300), setTimeout(() => (repair(), setN(2)), 2800), setTimeout(onReveal, reduced ? 4200 : 5600)]
    return () => steps.forEach(clearTimeout)
  }, [reduced, onReveal])
  return (
    <>
      <p className="egg__whisper" aria-live="assertive">
        {['Yes. It always did.', 'Wait. Do you hear footsteps?', 'Act natural.'][n]}
      </p>
      {n === 2 && (
        <span className="egg__akeem">
          <img src={site.photo.src} alt={`${site.name}, staring at you`} />
        </span>
      )}
    </>
  )
}

export default function Egg() {
  const [{ phase, run }, send] = useReducer(reduce, { phase: 'hidden', run: 0 })
  const root = useRef(null)
  const stage = useRef(null)
  const kGone = useRef(false)
  const reduced = useReducedMotion()
  const [near, setNear] = useState(false)
  const [second, setSecond] = useState(false)
  const onPerch = ON_PERCH.includes(phase)
  const live = LIVE.includes(phase)
  const toast = TOAST[phase]
  const fixed = useRef(() => send('DONE'))
  const revealIt = useRef(() => send('REVEAL'))

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      setNear(e.isIntersecting)
      if (!e.isIntersecting) send('LEFT')
    })
    io.observe(root.current.closest('footer'))
    return () => {
      io.disconnect()
      repair()
    }
  }, [])

  // Only triggers for someone who stuck around and actually scrolled down here.
  useEffect(() => {
    if (!near || phase !== 'hidden') return
    const id = setTimeout(() => window.scrollY > 300 && send('NOTICE'), 1100)
    return () => clearTimeout(id)
  }, [near, phase])

  // Hide the k from the name while the bug has it (it flies over on the way).
  const gone = K_GONE.includes(phase)
  useEffect(() => {
    const k = root.current.closest('footer').querySelector('.footer__k')
    if (!k) return
    if (gone && !kGone.current && !reduced && phase === 'intro') {
      const from = k.getBoundingClientRect()
      const to = root.current.querySelector('.egg__hole').getBoundingClientRect()
      const f = getComputedStyle(k)
      const fly = document.createElement('span')
      fly.className = 'egg__fly'
      fly.textContent = k.textContent
      Object.assign(fly.style, { left: `${from.left}px`, top: `${from.top}px`, fontFamily: f.fontFamily, fontSize: f.fontSize, fontWeight: f.fontWeight, fontStretch: f.fontStretch, lineHeight: f.lineHeight })
      document.body.appendChild(fly)
      const dx = to.left - from.left
      const dy = to.top - from.top
      fly.animate(
        [
          { transform: 'none', color: 'var(--warm-white)' },
          { transform: `translate(${dx * 0.5}px, ${dy - 90}px) rotate(200deg) scale(0.7)`, offset: 0.55, color: 'var(--warm-white)' },
          { transform: `translate(${dx}px, ${dy}px) rotate(360deg) scale(0.25)`, color: 'var(--vermilion)' },
        ],
        { duration: 950, easing: 'ease-in-out' },
      ).onfinish = () => fly.remove()
    }
    k.classList.toggle('is-stolen', gone)
    // Set it on the name too: the footer re-renders the letters (hover, lighting up) and would wipe
    // a class on the letter itself, but it never touches the name's own class.
    k.closest('.footer__name')?.classList.toggle('is-k-stolen', gone)
    kGone.current = gone
  }, [gone, reduced, phase])

  // What the page looks like in each scene. Anything not listed means it's intact.
  useEffect(() => {
    if (phase === 'falling') {
      collapse(reduced)
      const id = setTimeout(() => send('FELL'), reduced ? 500 : 1900)
      return () => clearTimeout(id)
    }
    if (phase === 'void' || phase === 'blamed' || phase === 'fixing') repair()
    else if (phase === 'wrong') rebuildWrong(reduced)
    else if (phase !== 'caught') repair()
  }, [phase, reduced])

  useEffect(() => {
    if (phase !== 'reveal') return
    setSecond(reduced)
    const id = setTimeout(() => setSecond(true), 1300)
    return () => clearTimeout(id)
  }, [phase, run, reduced])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => send('END'), 3800)
    return () => clearTimeout(id)
  }, [toast])

  // Escape always works, wherever focus is.
  useEffect(() => {
    if (!live && !onPerch) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      send('CLOSE')
      send('DISMISS')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [live, onPerch])

  // Keyboard and screen-reader users follow along as the scene changes, then get focus back after.
  const wasLive = useRef(false)
  useEffect(() => {
    if (live) stage.current?.focus({ preventScroll: true })
    else if (wasLive.current) root.current.closest('footer').querySelector('.footer__top')?.focus({ preventScroll: true })
    wasLive.current = live
  }, [phase, live])

  const Press = (
    <button type="button" className={cx('egg__red', phase === 'refused' && 'is-bigger')} onClick={() => send('PRESS')}>
      DO NOT PRESS
    </button>
  )

  return (
    <div ref={root} className="egg__perch" data-component="Egg">
      <div className="egg__hole">
        {phase === 'perched' ? (
          <button type="button" className="egg__peek is-up" onClick={() => send('OPEN')} aria-label="Something is peeking out of the footer. Investigate.">
            <Bug mood="curious" />
          </button>
        ) : (
          <span className={cx('egg__peek', onPerch && 'is-up')} aria-hidden="true">
            <Bug mood={MOOD[phase]} />
            {gone && <b className="egg__loot">k</b>}
          </span>
        )}
      </div>

      {['intro', 'whose', 'back'].includes(phase) && (
        <div className="egg__bubble" role="group" aria-label="Something in the footer wants a word">
          <button type="button" className="egg__x" onClick={() => send('DISMISS')} aria-label="Ignore it">
            ✕
          </button>
          {phase === 'intro' ? (
            <>
              <p aria-live="polite">Psst. Don’t tell him.</p>
              <div className="egg__choices">
                <button type="button" className="egg__btn" onClick={() => send('WHOSE')}>
                  Is that his k?
                </button>
                <button type="button" className="egg__btn" onClick={() => send('BACK')}>
                  Put that back.
                </button>
              </div>
            </>
          ) : (
            <>
              <p aria-live="polite">{REPLY[phase]}</p>
              <div className="egg__choices">
                <button type="button" className="egg__btn is-main" onClick={() => send('BUTTON')}>
                  Look at what?
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* The black screen once the page has fallen away. */}
      <div className={cx('egg__void', DARK.includes(phase) && 'is-on', phase === 'reveal' && 'is-dim')} aria-hidden="true" />

      {live && (
        <div ref={stage} className={cx('egg__stage', `is-${phase}`)} role="dialog" aria-label="You found something" tabIndex={-1} data-lenis-prevent>
          <button type="button" className="egg__close" onClick={() => send('CLOSE')}>
            Make it stop ✕
          </button>

          {(phase === 'taunt' || phase === 'refused') && (
            <div className="egg__scene egg__scene--dare" key={phase}>
              <Bug mood={MOOD[phase]} className="egg__actor" />
              <p className="egg__line" aria-live="polite">
                {TAUNT[phase]}
              </p>
              {Press}
              <button type="button" className="egg__link" onClick={() => send('REFUSE')}>
                {phase === 'taunt' ? 'I won’t.' : 'Still no.'}
              </button>
            </div>
          )}

          {phase === 'void' && (
            <div className="egg__scene">
              <Bug mood="embarrassed" className="egg__actor egg__actor--walk" />
              <Beats lines={BEATS.void} reduced={reduced}>
                <button type="button" className="egg__btn is-main" onClick={() => send('FIX')}>
                  Fix it. FIX IT.
                </button>
                <button type="button" className="egg__btn" onClick={() => send('BLAME')}>
                  This is your fault.
                </button>
              </Beats>
            </div>
          )}

          {phase === 'blamed' && (
            <div className="egg__scene">
              <Bug mood="suspicious" className="egg__actor" />
              <Beats lines={BEATS.blamed} reduced={reduced}>
                <button type="button" className="egg__btn is-main" onClick={() => send('FIX')}>
                  Fix it. FIX IT.
                </button>
              </Beats>
            </div>
          )}

          {phase === 'fixing' && (
            <div className="egg__scene egg__scene--log">
              <Bug mood="surprised" className="egg__actor egg__actor--small" />
              <RepairLog reduced={reduced} onDone={fixed.current} />
            </div>
          )}

          {phase === 'wrong' && (
            <div className="egg__corner">
              <Bug mood="bye" />
              <div>
                <p aria-live="polite">Done. Good as new. Nobody will notice.</p>
                <div className="egg__choices">
                  <button type="button" className="egg__btn is-main" onClick={() => send('NOTICED')}>
                    It all says “Hire Akeem”.
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === 'caught' && (
            <div className="egg__corner">
              <Bug mood="surprised" />
              <Caught reduced={reduced} onReveal={revealIt.current} />
            </div>
          )}

          {phase === 'reveal' && (
            <div className="egg__scene egg__reveal" key={run}>
              <div className="egg__sign" aria-live="polite">
                <p>I WROTE ALL THAT CODE...</p>
                <p className={cx('egg__punch', second && 'is-on')}>{second ? 'JUST TO MAKE YOU LAUGH.' : ' '}</p>
              </div>
              <div className="egg__cast">
                <span className="egg__face">
                  <img src={site.photo.src} alt={site.name} />
                </span>
                <Bug mood="bye" />
              </div>
              <p className="egg__sig">— Akeem, probably avoiding a real bug somewhere.</p>
              <div className="egg__choices">
                <button type="button" className="egg__btn is-main" onClick={() => send('BACKTO')}>
                  Back to the portfolio
                </button>
                <button type="button" className="egg__btn" onClick={() => send('REPLAY')}>
                  Replay the prank
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className="egg__toast" role="status">
          <Bug mood={MOOD[phase]} />
          <p>{toast}</p>
        </div>
      )}
    </div>
  )
}
