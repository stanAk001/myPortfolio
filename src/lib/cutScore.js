/*
  Music for the 8-second ad cut, played live with Web Audio. An original cue on the same timing as
  the video (120 bpm, four bars): a rising sweep into a hit when the name lands, a groove under the
  beat words, the filter opening up for the product shot, and a held chord under the end card.
  Each vibe has its own key and chords. Nothing is created until someone asks for a cut with sound.
*/
let ctx = null
let bus = null
let room = null

const B = 0.5 // one beat at 120 bpm
const hz = (m) => 440 * 2 ** ((m - 69) / 12)

// Root (MIDI) and chord tones for each of the four bars.
export const VIBES = {
  food: { label: 'Food', bars: [[50, [62, 66, 69]], [47, [59, 62, 66]], [43, [59, 62, 67]], [45, [61, 64, 69]]] }, // D Bm G A
  fashion: { label: 'Fashion', bars: [[45, [60, 64, 69]], [41, [60, 65, 69]], [48, [60, 64, 67]], [43, [59, 62, 67]]] }, // Am F C G
  tech: { label: 'Tech', bars: [[40, [59, 64, 67]], [48, [60, 64, 67]], [43, [59, 62, 67]], [50, [62, 66, 69]]] }, // Em C G D
  fitness: { label: 'Fitness', bars: [[42, [61, 66, 69]], [50, [62, 66, 69]], [45, [61, 64, 69]], [40, [59, 64, 68]]] }, // F#m D A E
}

function noiseBuffer(seconds) {
  const len = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  return buf
}

function setup() {
  ctx = new (window.AudioContext || window.webkitAudioContext)()
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -16
  comp.ratio.value = 4
  comp.connect(ctx.destination)
  bus = ctx.createGain()
  bus.connect(comp)
  // A small reverb room so the hits have somewhere to land.
  room = ctx.createConvolver()
  const len = Math.floor(ctx.sampleRate * 1.8)
  const ir = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
  }
  room.buffer = ir
  const wet = ctx.createGain()
  wet.gain.value = 0.32
  room.connect(wet).connect(bus)
}

/* Everything routes through `out`, so stopping or muting is a single gain change. */
function perform(vibe, out, t0) {
  const send = (node, amount) => {
    node.connect(out)
    if (amount) {
      const g = ctx.createGain()
      g.gain.value = amount
      node.connect(g).connect(room)
    }
  }
  const env = (at, peak, attack, decay) => {
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(peak, at + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay)
    return g
  }
  const noise = (at, dur, type, f0, f1, peak, attack, space = 0.2) => {
    const s = ctx.createBufferSource()
    s.buffer = noiseBuffer(dur + 0.05)
    const f = ctx.createBiquadFilter()
    f.type = type
    f.Q.value = 1.2
    f.frequency.setValueAtTime(f0, at)
    f.frequency.exponentialRampToValueAtTime(f1, at + dur)
    const g = env(at, peak, attack, dur - attack)
    s.connect(f).connect(g)
    send(g, space)
    s.start(at)
    s.stop(at + dur + 0.05)
  }
  const tone = (at, midi, dur, type, peak, attack, space = 0.25, cutoff) => {
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.value = hz(midi)
    let node = o
    if (cutoff) {
      const f = ctx.createBiquadFilter()
      f.type = 'lowpass'
      f.frequency.value = cutoff
      node = o.connect(f)
    }
    const g = env(at, peak, attack, dur)
    node.connect(g)
    send(g, space)
    o.start(at)
    o.stop(at + attack + dur + 0.05)
  }

  const kick = (at, peak = 0.9) => {
    const o = ctx.createOscillator()
    o.frequency.setValueAtTime(150, at)
    o.frequency.exponentialRampToValueAtTime(46, at + 0.12)
    const g = env(at, peak, 0.002, 0.32)
    o.connect(g)
    send(g, 0.02)
    o.start(at)
    o.stop(at + 0.4)
  }
  const clap = (at) => [0, 0.011, 0.022].forEach((d, i) => noise(at + d, 0.16 - d, 'bandpass', 1500, 1300, i === 2 ? 0.32 : 0.18, 0.002, 0.4))
  const hat = (at, peak) => noise(at, 0.05, 'highpass', 7500, 9000, peak, 0.001, 0.1)
  const impact = (at, peak = 0.8) => {
    const o = ctx.createOscillator()
    o.frequency.setValueAtTime(110, at)
    o.frequency.exponentialRampToValueAtTime(34, at + 0.6)
    const g = env(at, peak, 0.003, 1.3)
    o.connect(g)
    send(g, 0.5)
    o.start(at)
    o.stop(at + 1.4)
    noise(at, 0.5, 'lowpass', 3000, 300, 0.35, 0.002, 0.6)
  }
  const pad = (at, notes, dur, cutoff, peak = 0.06) => {
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = cutoff
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, at)
    g.gain.linearRampToValueAtTime(peak, at + 0.3)
    g.gain.setValueAtTime(peak, at + dur - 0.3)
    g.gain.linearRampToValueAtTime(0.0001, at + dur)
    f.connect(g)
    send(g, 0.6)
    notes.forEach((m) =>
      [-7, 7].forEach((cents) => {
        const o = ctx.createOscillator()
        o.type = 'sawtooth'
        o.frequency.value = hz(m)
        o.detune.value = cents
        o.connect(f)
        o.start(at)
        o.stop(at + dur + 0.05)
      }),
    )
    return f
  }
  const pluck = (at, midi, peak) => tone(at, midi, 0.28, 'triangle', peak, 0.003, 0.35)
  const hit = (at, midi) => {
    tone(at, midi, 0.9, 'triangle', 0.22, 0.003, 0.45)
    tone(at, midi + 12, 0.5, 'sine', 0.1, 0.003, 0.45)
    noise(at, 0.08, 'highpass', 3000, 5000, 0.12, 0.001, 0.2)
  }

  const bars = VIBES[vibe].bars
  // 0–1s: sweep up into the name, ticking faster.
  noise(t0, 1.0, 'bandpass', 300, 6000, 0.22, 0.9, 0.5)
  pad(t0, bars[0][1].map((m) => m - 12), 1.1, 500, 0.05)
  for (let i = 0; i < 8; i++) hat(t0 + i * (B / 4) * 2, 0.04 + i * 0.012)
  impact(t0 + 1)

  // 1–7s: three bars of groove, the last one opening up.
  for (let bar = 0; bar < 3; bar++) {
    const t = t0 + 1 + bar * 4 * B
    const [root, chord] = bars[bar + 1]
    const f = pad(t, chord, 4 * B + 0.1, bar === 1 ? 900 : 1400)
    if (bar === 1) f.frequency.exponentialRampToValueAtTime(3200, t + 4 * B) // the product shot opens up
    for (let b = 0; b < 4; b++) {
      const at = t + b * B
      kick(at, bar === 2 ? 0.7 : 0.9)
      hat(at + B / 2, 0.09)
      tone(at, root - 12, B * 0.8, 'sawtooth', 0.16, 0.004, 0.02, 320)
      if (b % 2) clap(at)
    }
    const arp = [...chord, chord[0] + 12]
    for (let s = 0; s < 16; s++) if (s % 2 === 0 || bar === 1) pluck(t + s * (B / 4), arp[s % 4] + 12, s % 4 ? 0.035 : 0.06)
  }
  // The three beat words.
  ;[0, 1, 2].forEach((i) => hit(t0 + 2 + i * B, bars[1][1][i] + 12))
  // 5.75s: a breath before the line.
  noise(t0 + 5.5, 0.5, 'bandpass', 800, 5000, 0.14, 0.45, 0.4)

  // 7s: end card. A hit, then the home chord left ringing.
  impact(t0 + 7, 0.7)
  pad(t0 + 7, [...bars[0][1], bars[0][1][0] + 12], 2.6, 2400, 0.07)
  pluck(t0 + 7, bars[0][1][2] + 12, 0.12)
  pluck(t0 + 7.25, bars[0][1][0] + 24, 0.08)
}

/*
  Start the cue. Returns `mute(on)`, which fades it in or out without losing its place, and
  `stop()`, which cuts it with a short fade so there's no click.
*/
export function playCut(vibe, { muted = false } = {}) {
  if (!ctx) setup()
  ctx.resume()
  const out = ctx.createGain()
  out.gain.value = muted ? 0 : 1
  out.connect(bus)
  perform(VIBES[vibe] ? vibe : 'food', out, ctx.currentTime + 0.05)
  return {
    mute(on) {
      out.gain.setTargetAtTime(on ? 0 : 1, ctx.currentTime, 0.04)
    },
    stop() {
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.03)
      setTimeout(() => out.disconnect(), 400)
    },
  }
}
