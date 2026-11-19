/*
  The five projects form one chord: each is a note of D major 9 (D, F#, A, C#, E). Moving to a
  project plays its note softly, like a key press, and reaching the last one rolls the whole chord
  so the reel resolves. The tone is a sine with a quiet octave above, quick attack, long decay,
  through a small reverb. Nothing is created until someone turns sound on.
*/
let ctx = null
let out = null
let room = null

const NOTES = [62, 66, 69, 73, 76] // D4 F#4 A4 C#5 E5
const hz = (m) => 440 * 2 ** ((m - 69) / 12)

function setup() {
  ctx = new (window.AudioContext || window.webkitAudioContext)()
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -18
  comp.ratio.value = 3
  comp.connect(ctx.destination)
  out = ctx.createGain()
  out.gain.value = 0.5
  out.connect(comp)
  room = ctx.createConvolver()
  const len = Math.floor(ctx.sampleRate * 2.2)
  const ir = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3.2
  }
  room.buffer = ir
  const wet = ctx.createGain()
  wet.gain.value = 0.38
  room.connect(wet).connect(out)
}

function key(midi, at, peak = 0.22, decay = 2.2) {
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(peak, at + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, at + decay)
  const f = ctx.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.setValueAtTime(3200, at)
  f.frequency.exponentialRampToValueAtTime(900, at + decay)
  g.connect(f)
  f.connect(out)
  const send = ctx.createGain()
  send.gain.value = 0.6
  f.connect(send).connect(room)
  for (const [mult, level, type] of [[1, 1, 'sine'], [2, 0.18, 'sine'], [1, 0.08, 'triangle']]) {
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.value = hz(midi) * mult
    const lv = ctx.createGain()
    lv.gain.value = level
    o.connect(lv).connect(g)
    o.start(at)
    o.stop(at + decay + 0.05)
  }
}

function ready() {
  if (!ctx) setup()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx.currentTime + 0.02
}

/* The note for project i. */
export function playNote(i) {
  const t = ready()
  key(NOTES[i % NOTES.length], t)
}

/* The full chord rolled up from the bottom, with the root an octave lower underneath. */
export function playChord() {
  const t = ready()
  key(NOTES[0] - 12, t, 0.16, 3.6)
  NOTES.forEach((m, k) => key(m, t + 0.07 * k, 0.15, 3.4))
}
