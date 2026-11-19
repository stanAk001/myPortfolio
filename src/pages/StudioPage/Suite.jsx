import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from '../../sections/Gallery/LiveView'
import { lockScroll } from '../../lib/smooth'
import { useMediaQuery, useReducedMotion, saveData } from '../../hooks/useMedia'
import { playCut } from '../../lib/cutScore'
import { buildCut, CUT_LENGTH } from '../../sections/Studio/cut'
import { REEL, TRACKS, VERTICAL } from './reel'
import { cx } from '../../utils'

/*
  The edit suite. One monitor, and under it the reel laid out like an editor sees a launch: a track
  per layer, each layer a service. The playhead runs across all of them and lights up whatever clip
  it's on. The audio tracks are real stems, so muting the score or soloing the voice is exactly what
  you hear. If the visitor cut their own ad on the work page, it's first in the reel.
*/

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const pad = (n) => String(n).padStart(2, '0')

// The visitor's cut as a clip: motion and score only, rendered in the browser.
const cutClip = (cut) => ({
  id: 'cut',
  kind: 'Your cut · 16:9',
  title: `Your cut — ${cut.name}`,
  note: 'Made on the work page a moment ago: kinetic type and an original score, cut live in your browser.',
  dur: CUT_LENGTH,
  cut,
  stems: null,
  layers: { ui: [], motion: [[0, 8]], social: [], score: [[0, CUT_LENGTH, 'Live score']], voice: [] },
})

// `jump` ({ id }) cues a film from outside, e.g. a monitor clicked in the intro.
export default function Suite({ cut, jump, onFlyers, onService, selected, onSelect }) {
  const root = useRef(null)
  const video = useRef(null)
  const stage = useRef(null)
  const audio = { score: useRef(null), voice: useRef(null) }
  const head = useRef(null)
  const lanes = useRef(null)
  const cutTl = useRef(null)
  const cutScore = useRef(null)
  const local = useRef(0) // seconds into the current clip
  const pending = useRef(null) // where to start a clip that is still loading
  const reduced = useReducedMotion()
  const narrow = useMediaQuery('(max-width: 760px)')
  const [, seen] = useInView(root)

  const reel = useMemo(() => {
    const list = cut ? [cutClip(cut), ...REEL] : REEL
    let at = 0
    return list.map((c) => {
      const out = { ...c, start: at }
      at += c.dur
      return out
    })
  }, [cut])
  const total = reel.at(-1).start + reel.at(-1).dur

  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [sound, setSound] = useState(false)
  const [mute, setMute] = useState({ score: false, voice: false })
  const [solo, setSolo] = useState(null)
  const [tick, setTick] = useState(0) // a slow clock for the lights and timecode
  const [vertical, setVertical] = useState(false)
  const clip = reel[idx]
  const auto = !reduced && !saveData()

  const audible = useCallback((track) => sound && (solo ? solo === track : !mute[track]), [sound, solo, mute])

  // How much timeline is visible: the whole reel, or just the current clip on a phone.
  const view = narrow ? [clip.start, clip.start + clip.dur] : [0, total]
  const span = view[1] - view[0]
  const pct = (t) => `${((t - view[0]) / span) * 100}%`

  /* ---------- Playback ---------- */

  const stems = () => [audio.score.current, audio.voice.current].filter((a) => a?.src)

  const syncAudio = useCallback((force) => {
    for (const a of stems()) {
      if (force || Math.abs(a.currentTime - local.current) > 0.15) a.currentTime = Math.min(local.current, (a.duration || 1e9) - 0.05)
    }
  }, [])

  const go = useCallback(
    (i, at = 0) => {
      const n = (i + reel.length) % reel.length
      cutScore.current?.stop()
      cutScore.current = null
      local.current = at
      if (n === idx) {
        if (video.current) video.current.currentTime = at
        cutTl.current?.seek(at)
        syncAudio(true)
      } else {
        pending.current = at
        setIdx(n)
      }
    },
    [idx, reel.length, syncAudio],
  )

  const seek = useCallback(
    (t) => {
      const x = Math.max(0, Math.min(total - 0.05, t))
      const i = reel.findIndex((c) => x < c.start + c.dur)
      go(i, x - reel[i].start)
    },
    [go, reel, total],
  )

  useEffect(() => {
    if (!jump) return
    const i = reel.findIndex((c) => c.id === jump.id)
    if (i >= 0) {
      go(i)
      setPlaying(true)
    }
    // Only a new request should move the playhead, not every re-render of `go`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jump])

  // Play or pause everything that belongs to the current clip.
  useEffect(() => {
    const v = video.current
    if (playing) {
      v?.play().catch(() => setPlaying(false))
      for (const a of stems()) a.play().catch(() => {})
    } else {
      v?.pause()
      for (const a of stems()) a.pause()
    }
  }, [playing, idx])

  // Starts muted when it scrolls into view and stops when it leaves.
  useEffect(() => {
    if (seen && auto) setPlaying(true)
    if (!seen) {
      setPlaying(false)
      setSound(false)
    }
  }, [seen, auto])

  // Which tracks are audible.
  useEffect(() => {
    if (audio.score.current) audio.score.current.muted = !audible('score')
    if (audio.voice.current) audio.voice.current.muted = !audible('voice')
    // A film without stems has its music baked into its own soundtrack.
    if (video.current) video.current.muted = clip.stems ? true : !audible('score')
    cutScore.current?.mute(!audible('score'))
  }, [audible, clip, idx])

  // The visitor's cut runs on its own timeline, not from a video file.
  useEffect(() => {
    if (!clip.cut || !stage.current) return
    const t = buildCut(stage.current, clip.cut)
    cutTl.current = t
    t.seek(local.current)
    pending.current = null
    return () => {
      t.kill()
      cutTl.current = null
      cutScore.current?.stop()
      cutScore.current = null
    }
  }, [clip])

  // One clock for everything: read the time, move the playhead, keep the stems in sync.
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let lastTick = 0
    const frame = (now) => {
      const dt = (now - last) / 1000
      last = now
      const v = video.current
      if (clip.cut) {
        if (playing) {
          if (local.current < 0.05 && !cutScore.current) cutScore.current = playCut(clip.cut.vibe, { muted: !audible('score') })
          local.current += dt
          cutTl.current?.seek(Math.min(local.current, clip.dur))
          if (local.current >= clip.dur) go(idx + 1)
        }
      } else if (v && v.readyState > 0) {
        local.current = v.currentTime
        if (playing) syncAudio(false)
      }
      if (head.current) head.current.style.left = pct(clip.start + local.current)
      if (now - lastTick > 120) {
        lastTick = now
        setTick((n) => n + 1)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  })

  const loaded = () => {
    const v = video.current
    if (pending.current != null && v) {
      v.currentTime = pending.current
      local.current = pending.current
    }
    pending.current = null
    syncAudio(true)
    if (playing) {
      v?.play().catch(() => {})
      for (const a of stems()) a.play().catch(() => {})
    }
  }

  const soundOn = () => {
    setSound(true)
    if (!playing) setPlaying(true)
  }
  const toggleMute = (id) => {
    soundOn()
    setMute((m) => ({ ...m, [id]: !m[id] }))
  }
  const toggleSolo = (id) => {
    soundOn()
    setSolo((s) => (s === id ? null : id))
  }

  // Drag along the tracks to scrub.
  const scrub = (e) => {
    const box = lanes.current.getBoundingClientRect()
    if (e.target.closest('button') || e.clientX < box.left) return
    const to = (x) => seek(view[0] + ((x - box.left) / box.width) * span)
    to(e.clientX)
    const move = (ev) => to(ev.clientX)
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const onKey = (e) => {
    if (e.key === 'ArrowRight') seek(clip.start + local.current + 5)
    else if (e.key === 'ArrowLeft') seek(clip.start + local.current - 5)
    else return
    e.preventDefault()
  }

  const openSocial = (target) => {
    if (target === 'tff-v') setVertical(true)
    else onFlyers?.(target)
  }

  useEffect(() => {
    if (!vertical) return
    lockScroll(true)
    const k = (e) => e.key === 'Escape' && setVertical(false)
    window.addEventListener('keydown', k)
    return () => {
      lockScroll(false)
      window.removeEventListener('keydown', k)
    }
  }, [vertical])

  /* ---------- What's under the playhead ---------- */
  void tick
  const now = local.current
  const live = (track) => clip.layers[track].find(([a, l]) => now >= a && now < a + l)
  const line = live('voice')
  const track = TRACKS.find((t) => t.id === selected)

  return (
    <div ref={root} className="su">
      <div className="su__monitor">
        <div className="su__screen" style={{ viewTransitionName: 'studio-monitor' }}>
          {clip.cut ? (
            <div ref={stage} className="ct" aria-label={clip.title} />
          ) : (
            <video
              key={clip.id}
              ref={video}
              src={clip.src}
              poster={clip.poster}
              muted
              playsInline
              preload="auto"
              onLoadedMetadata={loaded}
              onEnded={() => go(idx + 1)}
              onClick={() => setPlaying((p) => !p)}
              aria-label={clip.title}
            />
          )}
          {line && <p className="su__caption">{line[2]}</p>}
        </div>

        <aside className="su__info">
          <p className="label">
            <span className="su__rec" aria-hidden="true" /> Now playing · {pad(idx + 1)}/{pad(reel.length)}
          </p>
          <h3 key={clip.id} className="su__title">
            {clip.title}
          </h3>
          {track ? (
            <div className="su__service" key={track.id}>
              <p className="label">
                {track.lane} · {track.service}
              </p>
              <ul>
                {track.gets.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
              <div className="su__service-btns">
                <button type="button" className="g-btn g-btn--solid" onClick={() => onService?.(track.id)}>
                  Add to my launch kit
                </button>
                <button type="button" className="g-btn" onClick={() => onSelect(null)}>
                  Back
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="su__note">{clip.note}</p>
              <ul className="su__live" aria-label="Layers playing now">
                {TRACKS.map((t) => {
                  const on = !!live(t.id)
                  const heard = t.audio && on && audible(t.id)
                  return (
                    <li key={t.id} className={cx(on && 'is-on', t.audio && on && !heard && 'is-silent')}>
                      <i aria-hidden="true" />
                      <span className="label">{t.lane}</span> {t.name}
                      {t.audio && on && !heard && <em> · muted</em>}
                    </li>
                  )
                })}
              </ul>
            </>
          )}
          <p className="su__tc">
            {fmt(now)} <span>/ {fmt(clip.dur)}</span>
          </p>
          <div className="su__btns">
            <button type="button" className="g-btn" onClick={() => setPlaying((p) => !p)}>
              {playing ? 'Pause' : 'Play'}
            </button>
            <button type="button" className={cx('g-btn', sound && 'g-btn--solid')} onClick={() => (sound ? setSound(false) : soundOn())} aria-pressed={sound}>
              {sound ? 'Sound on' : 'Sound off'}
            </button>
          </div>
        </aside>
      </div>

      {/* Timeline: films on top, then one track per launch layer. */}
      <div className="su__timeline" tabIndex={0} onKeyDown={onKey} aria-label="Timeline: arrow keys move five seconds">
        <div className="su__row su__row--reel">
          <span className="su__lane-head label">Reel</span>
          <div className="su__lane">
            {reel.map((c, i) =>
              c.start + c.dur <= view[0] || c.start >= view[1] ? null : (
                <button
                  key={c.id}
                  type="button"
                  className={cx('su__film', i === idx && 'is-on', c.cut && 'is-cut')}
                  style={{ left: pct(Math.max(c.start, view[0])), width: `${((Math.min(c.start + c.dur, view[1]) - Math.max(c.start, view[0])) / span) * 100}%` }}
                  onClick={() => go(i)}
                >
                  {c.poster && <img src={c.poster} alt="" loading="lazy" decoding="async" />}
                  <span>{c.title}</span>
                </button>
              ),
            )}
          </div>
        </div>

        <div className="su__tracks">
          <div className="su__lanes" onPointerDown={scrub}>
            {TRACKS.map((t) => (
              <div key={t.id} className={cx('su__row', t.audio && 'is-audio', selected === t.id && 'is-picked')}>
                <div className="su__lane-head">
                  <button type="button" className="su__name" onClick={() => onSelect(selected === t.id ? null : t.id)} aria-pressed={selected === t.id} title={`${t.service}: what you get`}>
                    <span className="label">{t.lane}</span> {t.name}
                  </button>
                  {t.audio && (
                    <span className="su__ms">
                      <button type="button" className={cx(mute[t.id] && 'is-on')} onClick={() => toggleMute(t.id)} aria-pressed={mute[t.id]} title={`Mute the ${t.name.toLowerCase()}`}>
                        M
                      </button>
                      <button type="button" className={cx(solo === t.id && 'is-on')} onClick={() => toggleSolo(t.id)} aria-pressed={solo === t.id} title={`Solo the ${t.name.toLowerCase()}`}>
                        S
                      </button>
                    </span>
                  )}
                </div>
                <div className="su__lane">
                  {reel.flatMap((c) =>
                    c.layers[t.id].map(([a, l, text, target, inFilm], k) => {
                      const s = c.start + a
                      if (s + l <= view[0] || s >= view[1]) return null
                      const isOn = c.id === clip.id && now >= a && now < a + l
                      const social = t.id === 'social'
                      return (
                        <button
                          key={`${c.id}-${k}`}
                          type="button"
                          className={cx('su__seg', isOn && 'is-on', social && !inFilm && 'is-extra', t.audio && !audible(t.id) && 'is-quiet')}
                          style={{ left: pct(Math.max(s, view[0])), width: `${((Math.min(s + l, view[1]) - Math.max(s, view[0])) / span) * 100}%` }}
                          onClick={() => (social ? openSocial(target) : seek(s))}
                          title={text ?? `${t.name} — ${c.title}`}
                        >
                          {text && <span>{text}</span>}
                        </button>
                      )
                    }),
                  )}
                </div>
              </div>
            ))}
            <div ref={lanes} className="su__headwrap" aria-hidden="true">
              <i ref={head} className="su__head" />
            </div>
          </div>
        </div>

        <div className="su__ruler" aria-hidden="true">
          {Array.from({ length: Math.floor(span / (narrow ? 5 : 15)) + 1 }, (_, i) => {
            const t = view[0] + i * (narrow ? 5 : 15)
            return (
              <span key={i} style={{ left: pct(t) }}>
                {fmt(t - (narrow ? view[0] : 0))}
              </span>
            )
          })}
        </div>
        {narrow && (
          <div className="su__clipnav">
            <button type="button" className="g-btn" onClick={() => go(idx - 1)}>
              ← Previous film
            </button>
            <button type="button" className="g-btn" onClick={() => go(idx + 1)}>
              Next film →
            </button>
          </div>
        )}
      </div>

      {clip.stems && (
        <>
          <audio ref={audio.score} key={`${clip.id}-s`} src={clip.stems.score} preload="auto" muted />
          <audio ref={audio.voice} key={`${clip.id}-v`} src={clip.stems.voice} preload="auto" muted />
        </>
      )}

      {vertical && (
        <div className="lb" role="dialog" aria-modal="true" aria-label={VERTICAL.title} onClick={(e) => e.target === e.currentTarget && setVertical(false)}>
          <figure className="lb__fig">
            <video src={VERTICAL.src} poster={VERTICAL.poster} controls autoPlay playsInline className="su__vertical" />
            <figcaption>
              <span className="label">{VERTICAL.kind}</span>
              <b>{VERTICAL.title}</b>
            </figcaption>
          </figure>
          <button type="button" className="lb__close" onClick={() => setVertical(false)} autoFocus>
            Close ✕
          </button>
        </div>
      )}
    </div>
  )
}
