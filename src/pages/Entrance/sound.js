/*
  The welcome's score, played live with Web Audio: no files to download, and nothing is created
  until the visitor turns sound on, so nothing can play before they ask for it.

  It is music, not sound effects. One slow pad in D carries the story and changes chord with it:
  open and unresolved in the dark, a minor colour when the light comes on, warm on recognition,
  and fully resolved as the door swings wide. Over it a soft electric-piano voice plays the
  moments: the guest's glad steps in, a short phrase for "you're next", a run up through the
  doorway. The only literal sounds are the ones the scene shows: knuckles on wood, a light
  switch, the door meeting its frame, and keys clicking as each line of dialogue is typed.
*/
let ctx = null
let master = null
let verb = null
let pad = null
let current = 'arrival'
let lastHover = 0

const hz = (midi) => 440 * 2 ** ((midi - 69) / 12)
const now = () => ctx.currentTime

// Each chord in MIDI notes, with how open its filter is: darker chords are kept duller.
const CHORDS = {
  arrival: { notes: [38, 45, 52, 57], cutoff: 420 }, // Dsus2, low and open: something is about to happen
  light: { notes: [35, 42, 50, 54], cutoff: 640 }, // Bm: the lamp comes on, still a question
  recognise: { notes: [31, 43, 50, 54, 59], cutoff: 900 }, // Gmaj7: they know each other
  open: { notes: [38, 45, 54, 57, 64], cutoff: 1700 }, // D add9: the door is open, everything resolves
}

// A hall's worth of reverb, made from a burst of decaying noise.
function hall(seconds, decay) {
  const len = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay
  }
  return buf
}

function setup() {
  ctx = new (window.AudioContext || window.webkitAudioContext)()
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -20
  comp.ratio.value = 3
  master = ctx.createGain()
  master.gain.value = 0
  master.connect(comp).connect(ctx.destination)
  verb = ctx.createConvolver()
  verb.buffer = hall(3.4, 2.6)
  const wet = ctx.createGain()
  wet.gain.value = 0.55
  verb.connect(wet).connect(master)
}

// Send a voice to the speakers, with `space` of it also going into the hall.
function out(node, space) {
  node.connect(master)
  const send = ctx.createGain()
  send.gain.value = space
  node.connect(send).connect(verb)
}

function startPad(name) {
  const c = CHORDS[name]
  const t = now()
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.Q.value = 0.5
  filter.frequency.setValueAtTime(c.cutoff * 0.5, t)
  filter.frequency.linearRampToValueAtTime(c.cutoff, t + 3)
  const env = ctx.createGain()
  env.gain.setValueAtTime(0, t)
  env.gain.linearRampToValueAtTime(1, t + 2.4)
  filter.connect(env)
  out(env, 0.7)
  // The filter breathes, very slowly, so a held chord never sits dead still.
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.08
  const sway = ctx.createGain()
  sway.gain.value = c.cutoff * 0.22
  lfo.connect(sway).connect(filter.frequency)
  const oscs = [lfo]
  for (const m of c.notes) {
    for (const cents of [-6, 6]) {
      const o = ctx.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = hz(m)
      o.detune.value = cents
      const g = ctx.createGain()
      g.gain.value = 0.14 / c.notes.length
      o.connect(g).connect(filter)
      oscs.push(o)
    }
  }
  oscs.forEach((o) => o.start(t))
  return { name, env, filter, oscs }
}

function stopPad(p, release = 2.6) {
  const t = now()
  p.env.gain.cancelScheduledValues(t)
  p.env.gain.setValueAtTime(p.env.gain.value, t)
  p.env.gain.linearRampToValueAtTime(0, t + release)
  p.oscs.forEach((o) => o.stop(t + release + 0.1))
}

function chord(name) {
  if (pad?.name === name) return
  if (pad) stopPad(pad)
  pad = startPad(name)
}

// A soft electric-piano note: a sine and a few quiet overtones, struck and left to ring.
function keys(midi, at = now(), vel = 0.2, ring = 2.6) {
  ;[
    [1, 1],
    [2, 0.32],
    [3, 0.1],
    [4.1, 0.04],
  ].forEach(([ratio, level], i) => {
    const o = ctx.createOscillator()
    o.frequency.value = hz(midi) * ratio
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(vel * level, at + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, at + ring / (1 + i * 0.8))
    o.connect(g)
    out(g, 0.6)
    o.start(at)
    o.stop(at + ring + 0.1)
  })
}

// Struck wood: a few inharmonic partials that die almost at once.
function wood(partials, gain, at = now()) {
  for (const [f, level, decay] of partials) {
    const o = ctx.createOscillator()
    o.frequency.setValueAtTime(f * 1.04, at)
    o.frequency.exponentialRampToValueAtTime(f, at + 0.02)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(gain * level, at + 0.003)
    g.gain.exponentialRampToValueAtTime(0.0001, at + decay)
    o.connect(g)
    out(g, 0.25)
    o.start(at)
    o.stop(at + decay + 0.05)
  }
}

function tick(freq, gain, length, at = now()) {
  const o = ctx.createOscillator()
  o.type = 'square'
  o.frequency.value = freq
  const f = ctx.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = 1000
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, at)
  g.gain.exponentialRampToValueAtTime(0.0001, at + length)
  o.connect(f).connect(g)
  out(g, 0.15)
  o.start(at)
  o.stop(at + length + 0.02)
}

// The moments, each a short phrase over the pad.
const PHRASES = {
  // The guest's glad steps in: up through the D chord.
  walk: () => [62, 66, 69, 74].forEach((m, i) => keys(m, now() + i * 0.2, 0.16)),
  // "You're next": a question that lands softly at home.
  you: () => [69, 74, 78, 76].forEach((m, i) => keys(m, now() + i * 0.32, 0.17, i === 3 ? 4 : 2.6)),
}

export const sound = {
  on: false,

  enable() {
    if (!ctx) setup()
    ctx.resume()
    this.on = true
    master.gain.cancelScheduledValues(now())
    master.gain.setTargetAtTime(0.9, now(), 0.3)
    chord(CHORDS[current] ? current : 'open')
    keys(74, now() + 0.05, 0.12)
  },

  disable() {
    this.on = false
    if (!ctx) return
    master.gain.setTargetAtTime(0, now(), 0.15)
    if (pad) {
      stopPad(pad, 0.8)
      pad = null
    }
  },

  // The score's place in the story. Remembered even with sound off, so turning it on mid-scene
  // starts on the right chord.
  cue(name) {
    if (CHORDS[name]) current = name
    if (!this.on) return
    if (CHORDS[name]) chord(name)
    else PHRASES[name]?.()
  },

  knock() {
    if (!this.on) return
    wood([[190, 1, 0.16], [415, 0.45, 0.09], [770, 0.2, 0.05]], 0.6)
  },

  // A wall switch: a stiff click and its release.
  flick() {
    if (!this.on) return
    tick(2300, 0.06, 0.006)
    tick(1700, 0.04, 0.006, now() + 0.055)
  },

  // One key of a keyboard as a line of dialogue is typed.
  key() {
    if (!this.on) return
    tick(1500 + Math.random() * 600, 0.025, 0.01)
    wood([[150 + Math.random() * 30, 1, 0.025]], 0.05)
  },

  shut() {
    if (!this.on) return
    wood([[72, 1, 0.35], [160, 0.5, 0.15], [330, 0.2, 0.06]], 0.7)
  },

  hover() {
    if (!this.on || now() - lastHover < 0.4) return
    lastHover = now()
    keys(81, now(), 0.06, 1.6)
  },

  // Through the door: a run up the chord as the filter opens to everything, then the room lets go.
  through() {
    if (!this.on) return
    chord('open')
    const t = now()
    pad.filter.frequency.cancelScheduledValues(t)
    pad.filter.frequency.setValueAtTime(pad.filter.frequency.value, t)
    pad.filter.frequency.exponentialRampToValueAtTime(5200, t + 1.4)
    ;[62, 69, 74, 78, 81, 86].forEach((m, i) => keys(m, t + i * 0.09, 0.13, 3.2))
    master.gain.setTargetAtTime(0, t + 2.2, 0.9)
    // Once it is silent, stop the audio thread rather than run a muted pad under the portfolio.
    setTimeout(() => {
      if (master.gain.value > 0.01) return
      if (pad) stopPad(pad, 0.1)
      pad = null
      current = 'arrival'
      ctx.suspend()
    }, 6500)
  },
}
