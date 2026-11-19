import { gsap } from '../../lib/gsap'

/*
  The 8-second ad cut, built into a stage element as plain DOM and run by one GSAP timeline on the
  same 120 bpm grid as its music (lib/cutScore.js). It follows the pattern of the full product ads:
  a slit of light, the name landing on a hit, three words on three beats, a product shot, a tagline,
  an end card. Sizes are in container units so the same cut plays on the home page and in the
  studio's monitor.
*/

export const CUT_LENGTH = 8.6

const COPY = {
  food: { words: ['Fresh.', 'Fast.', 'Yours.'], line: 'Taste the difference.', tag: 'Food & drink', accent: '#e2552b' },
  fashion: { words: ['Cut.', 'Fit.', 'Finish.'], line: 'Wear it like you mean it.', tag: 'Fashion', accent: '#d9b38c' },
  tech: { words: ['Smarter.', 'Faster.', 'Simpler.'], line: 'Built to just work.', tag: 'Tech', accent: '#5b8cff' },
  fitness: { words: ['Train.', 'Track.', 'Transform.'], line: 'Your best rep starts here.', tag: 'Fitness', accent: '#f2c14e' },
}
export const copyFor = (vibe) => COPY[vibe] ?? COPY.food

const slug = (name) => name.toLowerCase().normalize('NFKD').replace(/[^\w]+/g, '') || 'yourbrand'

const el = (parent, cls, html) => {
  const n = document.createElement('div')
  n.className = cls
  if (html != null) n.innerHTML = html
  parent.appendChild(n)
  return n
}
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const chars = (parent, text) => [...text].map((c) => el(parent, 'ct-ch', c === ' ' ? '&nbsp;' : esc(c)))

// Long names get a smaller size so they always fit on one line.
const heroSize = (name) => Math.min(12, 150 / Math.max(6, name.length))

/*
  Build the cut into `stage` (cleared first). Returns a paused timeline; `onTime` gets the timecode
  as it plays.
*/
export function buildCut(stage, { name, vibe }, onTime) {
  const c = copyFor(vibe)
  const label = name.trim() || 'Your brand'
  stage.replaceChildren()
  stage.style.setProperty('--ct-accent', c.accent)
  const tl = gsap.timeline({ paused: true })

  // Overlay: who it's for, a running timecode, a progress line.
  const top = el(stage, 'ct-top')
  el(top, 'ct-mono', `${esc(label)} — a film by Akeem`)
  const tc = el(top, 'ct-mono ct-tc', '00:00:00')
  const prog = el(el(stage, 'ct-prog'), 'ct-prog-fill')
  tl.fromTo(prog, { scaleX: 0 }, { scaleX: 1, duration: 8, ease: 'none' }, 0)
  const clock = { t: 0 }
  tl.to(clock, {
    t: 8,
    duration: 8,
    ease: 'none',
    onUpdate: () => {
      const f = Math.floor(clock.t * 24)
      tc.textContent = `00:${String(Math.floor(f / 24)).padStart(2, '0')}:${String(f % 24).padStart(2, '0')}`
      onTime?.(clock.t)
    },
  }, 0)

  // 0–1s: a slit of light opens across the dark.
  const slit = el(stage, 'ct-slit')
  const pre = el(stage, 'ct-mono ct-pre', 'Presenting')
  tl.fromTo(slit, { scaleX: 0 }, { scaleX: 1, duration: 0.85, ease: 'power3.inOut' }, 0.1)
  tl.fromTo(pre, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4 }, 0.35)
  tl.to([slit, pre], { opacity: 0, duration: 0.15 }, 0.98)

  // 1s: the name lands on the hit.
  const flash = el(stage, 'ct-flash')
  const hero = el(stage, 'ct-hero')
  hero.style.fontSize = `${heroSize(label)}cqw`
  const heroChars = chars(hero, label)
  tl.fromTo(flash, { opacity: 0.9 }, { opacity: 0, duration: 0.5, ease: 'power2.out', immediateRender: false }, 1)
  tl.fromTo(heroChars, { yPercent: 110 }, { yPercent: 0, duration: 0.7, stagger: 0.025, ease: 'expo.out' }, 1)
  tl.to(hero, { scale: 0.92, opacity: 0, duration: 0.25, ease: 'power3.in' }, 1.82)

  // 2s: three words on three beats, hard cuts.
  c.words.forEach((w, i) => {
    const n = el(stage, `ct-word${i === 2 ? ' is-last' : ''}`, esc(w))
    const at = 2 + i * 0.5
    tl.fromTo(n, { opacity: 1, scale: 1.12 }, { scale: 1, duration: 0.45, ease: 'power2.out', immediateRender: false }, at)
    tl.set(n, { opacity: 0 }, 0)
    tl.set(n, { opacity: 1 }, at)
    tl.set(n, { opacity: 0 }, i < 2 ? at + 0.5 : 3.55)
  })
  const wipe = el(stage, 'ct-wipe')
  tl.fromTo(wipe, { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: 'power4.inOut', transformOrigin: 'left' }, 3)
  tl.to(wipe, { scaleX: 0, duration: 0.3, ease: 'power4.inOut', transformOrigin: 'right' }, 3.45)

  // 3.6–5.6s: the product shot. The name as a package turning in the light, with the name again,
  // outlined, drifting behind it.
  const shot = el(stage, 'ct-shot')
  for (let r = 0; r < 3; r++) {
    const row = el(shot, 'ct-row', Array(6).fill(`<span>${esc(label)}</span>`).join(''))
    row.style.top = `${18 + r * 26}%`
    tl.fromTo(row, { xPercent: r % 2 ? -30 : 0 }, { xPercent: r % 2 ? 0 : -30, duration: 2.6, ease: 'none' }, 3.5)
  }
  const pack = el(shot, 'ct-pack')
  el(pack, 'ct-pack-tag ct-mono', 'New')
  const pn = el(pack, 'ct-pack-name', esc(label))
  pn.style.fontSize = `${Math.min(4.2, 40 / Math.max(6, label.length))}cqw`
  el(pack, 'ct-pack-cat ct-mono', esc(c.tag))
  tl.set(shot, { opacity: 0 }, 0)
  tl.set(shot, { opacity: 1 }, 3.55)
  tl.fromTo(pack, { rotationY: -38, rotationX: 8, y: '18cqw', opacity: 0 }, { rotationY: 14, rotationX: 0, y: 0, opacity: 1, duration: 2, ease: 'power3.out' }, 3.55)
  tl.to(shot, { opacity: 0, duration: 0.2 }, 5.55)

  // 5.8s: the tagline.
  const line = el(stage, 'ct-line')
  const lineChars = chars(line, c.line)
  tl.fromTo(lineChars, { yPercent: 110 }, { yPercent: 0, duration: 0.7, stagger: 0.018, ease: 'expo.out' }, 5.8)
  tl.to(lineChars, { yPercent: -110, duration: 0.3, stagger: 0.005, ease: 'power3.in' }, 6.75)

  // 7s: the end card.
  const end = el(stage, 'ct-end')
  const endName = el(end, 'ct-end-name', esc(label))
  endName.style.fontSize = `${Math.min(7.5, 70 / Math.max(6, label.length))}cqw`
  const cta = el(end, 'ct-cta', 'Available now&nbsp;&nbsp;→')
  const url = el(end, 'ct-mono ct-url', `${slug(label)}.com`)
  tl.set(end, { opacity: 0 }, 0)
  tl.set(end, { opacity: 1 }, 7)
  tl.fromTo(flash, { opacity: 0.6 }, { opacity: 0, duration: 0.45, immediateRender: false }, 7)
  tl.fromTo(endName, { y: '3cqw', opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out' }, 7.05)
  tl.fromTo(cta, { y: '2cqw', opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out' }, 7.3)
  tl.fromTo(url, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 7.5)
  tl.to({}, { duration: CUT_LENGTH - 8 }, 8)
  return tl
}

/* The matching 9:16 flyer: same name, tagline and colour, laid out as a poster. */
export function buildFlyer(box, { name, vibe }) {
  const c = copyFor(vibe)
  const label = name.trim() || 'Your brand'
  box.replaceChildren()
  box.style.setProperty('--ct-accent', c.accent)
  // The box is the size container; the sheet inside lays out against it.
  const sheet = el(box, 'fy-in')
  el(sheet, 'fy-tag ct-mono', `${esc(c.tag)} · New`)
  const n = el(sheet, 'fy-name', esc(label))
  n.style.fontSize = `${Math.min(19, 150 / Math.max(5, label.length))}cqw`
  el(sheet, 'fy-words', c.words.map(esc).join('<br>'))
  el(sheet, 'fy-line', esc(c.line))
  el(sheet, 'fy-cta', 'Available now →')
  el(sheet, 'fy-url ct-mono', `${slug(label)}.com`)
}
