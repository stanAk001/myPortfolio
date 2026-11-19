import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'
import { markReady } from '../../lib/loaded'
import { site } from '../../data/site'
import { liveProjects, projects } from '../../data/projects'
import { saveData, useFinePointer, useReducedMotion } from '../../hooks/useMedia'
import { cast, interior, leaf, onLeaf, room, spill } from './door'
import { Figure, REST_POSE, applyPose } from './Figure'
import { doorAt, filmed } from './performance'
import { sound } from './sound'
import './Entrance.css'

const pts = (list) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
const rad = (d) => (d * Math.PI) / 180
const deg = (r) => (r * 180) / Math.PI
const mix = (a, b, t) => a + (b - a) * t
const clamp01 = (v) => Math.max(0, Math.min(1, v))
const tone = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(' ')})`

// The figure's scale (px per unit of a 100-unit person) and where it stands: a few steps inside the
// room, so it reads smaller than the doorway and its feet sit up on the room's floor. It starts
// hidden behind the right-hand wall and ends beside the door it is holding open (see draw).
const scaleOf = (r) => r.H * 0.0068
const feetY = (r) => r.eye + (r.B - r.eye) * 0.8
const hiddenX = (r) => r.R + scaleOf(r) * 12
// On a phone the name sits higher on the floor, leaving the bottom of the screen for the way in.
const nameY = (r) => r.h * (r.portrait ? 0.86 : 0.965)

// Where the lamp stands inside the room; it decides which way the light falls on the floor.
const lampHome = (r) => (r.portrait ? r.R - r.W * 0.25 : r.R + r.W * 0.15)

// The dim the room starts at, before anyone has put the light on.
const DARK = 0.55

// The guest's route, as points on the floor: walking up from behind the camera, waiting beside the
// door, stepping over the threshold, then turning off behind the right-hand wall. Their size comes
// from how far down the floor their feet are, so they shrink with distance like everything else.
const guestRoute = (r) => [
  [r.R + r.W * 1.1, r.h * 1.3],
  [r.R + r.W * 0.45, r.B + (r.h - r.B) * 0.1],
  [r.cx + r.W * 0.12, r.B - (r.B - feetY(r)) * 0.3],
  [r.R + scaleOf(r) * 16, feetY(r)],
]
function guestAt(r, at) {
  const route = guestRoute(r)
  const i = Math.max(0, Math.min(2, Math.floor(at)))
  const u = clamp01(at - i)
  const x = mix(route[i][0], route[i + 1][0], u)
  const y = mix(route[i][1], route[i + 1][1], u)
  // A head shorter than the host: they read as a visitor, not a giant beside the door.
  return { x, y, k: (scaleOf(r) / (feetY(r) - r.eye)) * (y - r.eye) * 0.86 }
}

// The end of the welcome: door wide, the person standing aside, hand open towards the way in.
const INVITED = { theta: 78, reach: 1, lit: 1, dim: 0 }
// A host's pose: one hand still on the door, the other open towards the room. After you.
const GESTURE = { side: 1, alpha: 1, ik: 1, lean: 1.5, tilt: 5, l1: 22, l2: 26, l3: -18 }

// What gets said, and the acts the slate in the corner calls out as they play.
const LINES = { knock: 'Knock, knock.', host: 'Oh — it’s you. Come in!', guest: 'Don’t mind if I do.', you: 'You’re next. Come in.' }
// The screen on the far wall of the room plays the real work: the lighter recordings, one after another.
const REEL = projects.filter((p) => p.video?.mobile || p.video?.mp4)

// The film's opening credits: who you are, rolled one line at a time. "Now showing" names whatever
// is playing on the screen in the room at that moment.
const credits = (showing) =>
  [
    ['Directed & built by', `${site.name} — ${site.role}`],
    ['Starring', 'React, Node, Express & PostgreSQL'],
    ['Now showing', showing && `${showing.title} — ${showing.url}`],
    ['On the record', liveProjects.length > 1 && `${liveProjects.length} products, live on the internet`],
    ['The promise', 'Ships fast. Scales cleanly. Feels effortless.'],
  ].filter(([, value]) => value)
const CREDIT_COUNT = credits(REEL[0]).length

const SCENES = ['01 — Arrival', '02 — The knock', '03 — Recognition', '04 — Invitation', '05 — Your turn', '06 — Lights out']

// Solve the figure's arm on the viewer's left so its hand lands on a point: two bones, elbow down.
function reachFor(p, k, tx, ty) {
  const lean = rad(p.lean)
  const lx = -11.8
  const ly = -30 // the shoulder, relative to the hips
  const sx = p.x + (lx * Math.cos(lean) - ly * Math.sin(lean)) * k
  const sy = p.y + (lx * Math.sin(lean) + ly * Math.cos(lean) - 45) * k
  const ux = (tx - sx) / k
  const uy = (ty - sy) / k
  const vx = ux * Math.cos(-lean) - uy * Math.sin(-lean)
  const vy = ux * Math.sin(-lean) + uy * Math.cos(-lean)
  const a = 15
  const b = 17
  const d = Math.min(Math.hypot(vx, vy), a + b - 0.5)
  const phi = Math.atan2(-vx, vy)
  const beta = Math.acos((a * a + d * d - b * b) / (2 * a * d))
  const delta = Math.acos((b * b + d * d - a * a) / (2 * b * d))
  const upper = phi - beta
  return { r1: deg(upper), r2: deg(phi + delta - upper) }
}

// Where a figure's hand on the viewer's left ends up, near enough: shoulder, elbow, knuckles.
function leftHand(q) {
  const a1 = rad(q.r1)
  const a2 = rad(q.r1 + q.r2)
  const x = -11.8 - 15 * Math.sin(a1) - 15 * Math.sin(a2)
  const y = -75 + 15 * Math.cos(a1) + 15 * Math.cos(a2)
  return [q.x + x * q.k, q.y + q.bob + y * q.k]
}

// Dust hanging in the light: pale where it crosses the beam on the floor, dark against the lit room.
const MOTES = Array.from({ length: 90 }, () => ({ u: Math.random(), v: Math.random(), s: 0.6 + Math.random() * 1.4, sp: 0.25 + Math.random() * 0.75, ph: Math.random() * Math.PI * 2 }))
function drawMotes(ctx, r, t, dx, layers) {
  ctx.clearRect(0, 0, r.w, r.h)
  const x0 = r.L - r.W * 2 + dx
  const span = r.W * 5
  const hy = r.h - r.T
  const count = r.portrait ? 45 : MOTES.length
  for (const [poly, color, a] of layers) {
    if (a < 0.01) continue
    ctx.save()
    ctx.beginPath()
    poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.closePath()
    ctx.clip()
    ctx.fillStyle = color
    for (let i = 0; i < count; i++) {
      const m = MOTES[i]
      const x = x0 + m.u * span + Math.sin(t * m.sp * 0.6 + m.ph) * r.W * 0.12
      const y = r.T + ((((m.v * hy - t * m.sp * 12) % hy) + hy) % hy)
      ctx.globalAlpha = a * (0.3 + 0.7 * Math.abs(Math.sin(t * m.sp + m.ph)))
      ctx.fillRect(x, y, m.s, m.s)
    }
    ctx.restore()
  }
}

// One tile of film grain, made once and shared.
let grainTile = null
function grain() {
  if (grainTile) return grainTile
  const c = document.createElement('canvas')
  c.width = c.height = 160
  const ctx = c.getContext('2d')
  const img = ctx.createImageData(160, 160)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() < 0.5 ? 0 : 255
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = Math.random() * 34
  }
  ctx.putImageData(img, 0, 0)
  grainTile = `url(${c.toDataURL('image/png')})`
  return grainTile
}

const sfx =
  (name, ...args) =>
  () =>
    sound[name](...args)

/*
  The welcome, as a short film. A dark wall, a door left ajar, a dim room behind it. Somebody walks
  up from behind the camera and knocks; the light inside comes on, a person leans out, knows them,
  and shows them in. Then they turn to you. Your name is written on the floor in their light.

  The camera is ours: move the pointer and it moves, so the floor and the name in front of the
  door slide one way and the room behind it the other, by how far each is from the wall.
  Going through the door takes you into the portfolio; nothing from the portfolio is shown here.
*/
export default function Entrance({ exiting = false, onEnter, onGone }) {
  const root = useRef(null)
  const stage = useRef(null)
  const back = useRef({})
  const front = useRef({})
  const fig = useRef({})
  const guest = useRef({})
  const say = useRef({})
  const hud = useRef({})
  const word = useRef(null)
  const cta = useRef(null)
  const motes = useRef(null)
  const screen = useRef(null)
  const credit = useRef(null)
  const showing = useRef(0)
  const video = useRef(null)
  const timeline = useRef(null)
  const beckon = useRef(null)
  const leaving = useRef(false)
  const closing = useRef(false)
  const finished = useRef(false)
  const reduced = useReducedMotion()
  const fine = useFinePointer()
  const [useFilm, setUseFilm] = useState(() => !!filmed.src && !reduced)
  const [done, setDone] = useState(reduced)
  const [audible, setAudible] = useState(sound.on)
  const [onScreen, setOnScreen] = useState(0)
  const stills = reduced || saveData()
  showing.current = onScreen

  // Everything that moves lives in these objects and is drawn straight to the SVG each frame.
  const s = useRef({ theta: 1.5, reach: 0, lit: 0, dim: DARK, rattle: 0, ring: 0, cam: 0, camTarget: 0, lamp: null, lampTarget: null, drift: 0, look: 0, eager: 0, ...(reduced ? INVITED : {}) })
  const p = useRef({ ...REST_POSE, side: 0, ik: 0, ...(reduced ? GESTURE : {}) })
  // The guest: where they are along their route, how hard they are walking, and their pose.
  const g = useRef({ at: 0, stride: 0, phase: 0, cadence: 1, spring: 1, inside: false })
  const gp = useRef({ ...REST_POSE })
  const geo = useRef(null)

  const finish = useCallback((value) => {
    finished.current = value
    setDone(value)
  }, [])

  const draw = useCallback(() => {
    const r = geo.current
    if (!r) return
    const st = s.current
    const B = back.current
    const F = front.current
    // Parallax from the camera: nothing on the wall moves, nearer things move more, further less.
    const shift = (y) => st.cam * ((y - r.eye) / (r.B - r.eye) - 1)
    const floor = (list) => list.map(([x, y]) => [x + shift(y), y])
    const deep = ([x, y]) => [x - st.cam * 0.4, y]
    const e0 = leaf(r, st.theta + st.rattle)
    const e = { ...e0, x: e0.x + st.cam * ((e0.top - r.eye) / (r.T - r.eye) - 1) }
    const lamp = st.lamp ?? lampHome(r)
    const wedge = floor(spill(r, e.x, lamp, st.reach))

    // How much light is coming out: the lamp being on, and the door being open to let it out.
    const on = clamp01(1 - st.dim / DARK)
    const open = clamp01(st.theta / INVITED.theta)
    const light = on * (0.25 + 0.75 * open)

    // The room behind the doorway, further away than the wall, so it slides the other way.
    const i = interior(r)
    B.farWall.setAttribute('points', pts([i.tl, i.tr, i.br, i.bl].map(deep)))
    B.ceiling.setAttribute('points', pts([[r.L, r.T], [r.R, r.T], deep(i.tr), deep(i.tl)]))
    B.sideWall.setAttribute('points', pts([[r.R, r.T], deep(i.tr), deep(i.br), [r.R, r.B]]))
    B.roomFloor.setAttribute('points', pts([[r.L, r.B], [r.R, r.B], deep(i.br), deep(i.bl)]))
    // The screen hangs on the far wall, so it travels with it.
    if (screen.current) {
      const [x, y] = deep(i.tl)
      const fw = i.tr[0] - i.tl[0]
      screen.current.style.transform = `translate(${(x + fw * 0.1).toFixed(1)}px, ${(y + (i.bl[1] - i.tl[1]) * 0.15).toFixed(1)}px)`
    }
    B.dim.style.opacity = st.dim
    // Light coming out lifts the paint around the door a shade. Flat, never a glow.
    B.wall.style.fill = tone([13, 12, 10], [23, 21, 17], light)
    B.casing.style.fill = tone([21, 19, 15], [36, 32, 26], light)

    // The door: its face turning towards the lamp as it swings, two sunk panels, the handle, the edge.
    F.leaf.setAttribute('points', pts([[r.L, r.T], [e.x, e.top], [e.x, e.bottom], [r.L, r.B]]))
    F.leaf.style.fill = tone([21, 19, 15], [58, 51, 41], on * open)
    const panel = (v0, v1) => pts([onLeaf(r, e, 0.17, v0), onLeaf(r, e, 0.83, v0), onLeaf(r, e, 0.83, v1), onLeaf(r, e, 0.17, v1)])
    F.panelA.setAttribute('points', panel(0.07, 0.45))
    F.panelB.setAttribute('points', panel(0.52, 0.93))
    F.panelA.style.fill = F.panelB.style.fill = tone([25, 22, 18], [66, 58, 47], on * open)
    const [kx, ky] = onLeaf(r, e, 0.9, 0.53)
    F.knob.setAttribute('cx', kx.toFixed(1))
    F.knob.setAttribute('cy', ky.toFixed(1))
    F.knob.setAttribute('r', (r.W * 0.03 * ((e.bottom - e.top) / r.H)).toFixed(2))
    for (const [a, v] of [['x1', e.x], ['x2', e.x], ['y1', e.top], ['y2', e.bottom]]) F.edge.setAttribute(a, v.toFixed(1))

    F.spill.setAttribute('points', pts(wedge))
    F.spillClip.setAttribute('points', pts(wedge))
    F.spill.style.opacity = 0.1 * (1 - st.dim * 0.85)
    const nx = (r.cx + shift(nameY(r))).toFixed(1)
    for (const t of [F.nameDim, F.nameLit, F.nameShade, F.nameGShade]) t.setAttribute('x', nx)

    if (!useFilm) {
      const pose = p.current
      const k = scaleOf(r)
      // Once they have hold of the door they walk with it, keeping beside its edge.
      const q = { ...pose, k, y: feetY(r), x: mix(hiddenX(r) + shift(feetY(r)), e.x + k * 10, pose.side) }
      if (!leaving.current && !reduced) {
        // Once they have seen you, their eyes follow you; getting near the way in makes them eager.
        q.tilt += st.look * 4 * Math.min(1, pose.side + 0.4)
        q.l1 += st.eager * 9
        q.lean += Math.sin(st.drift * 0.6) * 0.5 * pose.side
        q.breathe = 1 + Math.sin(st.drift * 1.7) * 0.004
      }
      if (q.ik > 0) {
        const hand = reachFor(q, k, kx, ky)
        q.r1 = mix(q.r1, hand.r1, q.ik)
        q.r2 = mix(q.r2, hand.r2, q.ik)
        q.r3 = mix(q.r3, -12, q.ik)
      }
      applyPose(fig.current, q)
      // Their shadow, thrown through the doorway and across the light on the floor.
      const half = 8.5 * k
      const shadow = pts(floor([[q.x - half, r.B], [q.x + half, r.B], cast(r, q.x + half, lamp, st.reach), cast(r, q.x - half, lamp, st.reach)]))
      F.shadow.setAttribute('points', shadow)
      F.shadowClip.setAttribute('points', shadow)
      F.shade.style.opacity = clamp01((pose.side - 0.35) / 0.4) * pose.alpha
      say.current.host.style.transform = `translate(${q.x.toFixed(1)}px, ${(q.y - k * 100 - 14).toFixed(1)}px) translate(-50%, -100%)`

      // The guest. Walking is a lifted foot, a sway and a bob; walking gladly bobs higher.
      const gs = g.current
      const at = guestAt(r, gs.at)
      const gq = { ...gp.current, ...at, x: at.x + shift(at.y) }
      const sw = Math.sin(gs.phase)
      gq.lh += Math.max(0, sw) * 5 * gs.stride
      gq.rh += Math.max(0, -sw) * 5 * gs.stride
      gq.bob += -Math.abs(sw) * 1.8 * gs.spring * gs.stride * gq.k
      gq.lean += sw * 2.4 * gs.stride
      gq.r1 += -sw * 9 * gs.stride
      gq.l1 += sw * 9 * gs.stride
      applyPose(guest.current, gq)
      // Over the threshold they are in the room, and the door frame hides what it should.
      const inside = gq.y < r.B
      if (inside !== gs.inside) {
        gs.inside = inside
        if (inside) F.guestWrap.setAttribute('clip-path', 'url(#w-open)')
        else F.guestWrap.removeAttribute('clip-path')
      }
      // Standing in the doorway's light they throw a long shadow towards us, over the name.
      const gh = 8.5 * gq.k
      const [tx] = cast(r, at.x, lamp, st.reach)
      const far = r.h * 1.4
      const fx = at.x + (tx - at.x) * ((far - at.y) / Math.max(1, r.h - at.y))
      const gshadow = pts(floor([[at.x - gh, at.y], [at.x + gh, at.y], [fx + gh * 2.4, far], [fx - gh * 2.4, far]]))
      F.gshadow.setAttribute('points', gshadow)
      F.gshadowClip.setAttribute('points', gshadow)
      F.gshade.style.opacity = gq.alpha * clamp01((gq.y - r.B) / (r.h * 0.03))
      say.current.guest.style.transform = `translate(${gq.x.toFixed(1)}px, ${(gq.y + gq.bob - gq.k * 100 - 14).toFixed(1)}px) translate(-50%, -100%)`

      // Knuckles on wood: a ring goes out from where the hand meets the door.
      const [hx, hy] = leftHand(gq)
      F.ring.setAttribute('cx', hx.toFixed(1))
      F.ring.setAttribute('cy', hy.toFixed(1))
      F.ring.setAttribute('r', ((3 + st.ring * 16) * gq.k).toFixed(1))
      F.ring.style.opacity = st.ring > 0 && st.ring < 1 ? (1 - st.ring) * 0.7 : 0
    }

    const ctx = motes.current?.getContext('2d')
    if (ctx) {
      const gap = [[e.x, e.top], [r.R, r.T], [r.R, r.B], [e.x, e.bottom]]
      drawMotes(ctx, r, st.drift, st.cam * 0.5, [
        [wedge, '#dcd6c9', 0.6 * st.reach * on],
        [gap, '#17130e', 0.35 * on],
      ])
    }

    // "Expected." is lit by the same lamp as the room: it flickers on with it, and goes out with it.
    if (word.current) word.current.style.opacity = on
    B.lintelLit.style.opacity = st.lit
  }, [reduced, useFilm])

  const measure = useCallback(() => {
    const r = room(innerWidth, innerHeight)
    geo.current = r
    const B = back.current
    const F = front.current
    for (const svg of [B.svg, F.svg]) svg.setAttribute('viewBox', `0 0 ${r.w} ${r.h}`)
    const c = r.casing
    const set = (el, o) => Object.entries(o).forEach(([k, v]) => el.setAttribute(k, typeof v === 'number' ? v.toFixed(1) : v))
    set(B.wall, { x: 0, y: 0, width: r.w, height: r.B })
    set(B.floor, { x: 0, y: r.B, width: r.w, height: r.h - r.B })
    set(B.casing, { x: r.L - c, y: r.T - c, width: r.W + c * 2, height: r.H + c })
    set(B.opening, { x: r.L, y: r.T, width: r.W, height: r.H })
    set(B.dim, { x: r.L, y: r.T, width: r.W, height: r.H })
    set(B.threshold, { x: r.L - c * 1.3, y: r.B - 1, width: r.W + c * 2.6, height: Math.max(3, r.H * 0.009) })
    for (const t of [B.lintel, B.lintelLit]) set(t, { x: r.cx, y: r.T - c - Math.max(16, r.H * 0.05) })
    set(F.openClip, { x: r.L, y: r.T, width: r.W, height: r.H })
    const size = r.portrait ? Math.min(r.w * 0.28, r.h * 0.13) : Math.min(r.h * 0.29, r.w * 0.19)
    for (const t of [F.nameDim, F.nameLit, F.nameShade, F.nameGShade]) set(t, { y: nameY(r), 'font-size': size })
    if (motes.current) {
      const dpr = Math.min(2, devicePixelRatio || 1)
      motes.current.width = r.w * dpr
      motes.current.height = r.h * dpr
      motes.current.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    if (screen.current) {
      const i = interior(r)
      const sw = (i.tr[0] - i.tl[0]) * 0.8
      Object.assign(screen.current.style, { width: `${sw.toFixed(1)}px`, height: `${(sw * 0.625).toFixed(1)}px` })
    }
    if (video.current) Object.assign(video.current.style, { left: `${r.L}px`, top: `${r.T}px`, width: `${r.W}px`, height: `${r.H}px` })
    Object.assign(root.current.querySelector('.w__door').style, { left: `${r.L}px`, top: `${r.T}px`, width: `${r.W}px`, height: `${r.H}px` })
    if (s.current.lamp === null) s.current.lamp = s.current.lampTarget = lampHome(r)
    draw()
  }, [draw])

  useEffect(() => {
    const prev = document.title
    document.title = `${site.name} — ${site.role}`
    document.documentElement.classList.add('at-door')
    root.current.style.setProperty('--w-grain', grain())
    // Sound was turned on earlier in this visit: carry on with it.
    if (sound.on) sound.enable()
    return () => {
      document.title = prev
      document.documentElement.classList.remove('at-door')
    }
  }, [])

  // One ticker drives the whole scene, and the slate's timecode with it.
  useLayoutEffect(() => {
    measure()
    let raf = 0
    let frame = -1
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }
    window.addEventListener('resize', onResize)
    document.fonts?.ready.then(() => geo.current && measure())
    const tick = (_, dt) => {
      const st = s.current
      const r = geo.current
      if (!r) return
      const sec = Math.min(dt, 100) / 1000
      if (!reduced) {
        st.drift += sec
        g.current.phase += sec * Math.PI * 1.9 * g.current.cadence
        // Without a pointer, the camera and the lamp drift on their own, slowly, so the scene still breathes.
        if (!fine && !leaving.current) {
          st.lampTarget = lampHome(r) + Math.sin(st.drift * 0.4) * r.W * 0.4
          st.camTarget = Math.sin(st.drift * 0.23) * r.W * 0.05
        }
        const ease = 1 - Math.pow(0.03, sec)
        st.lamp += (st.lampTarget - st.lamp) * ease
        st.cam += (st.camTarget - st.cam) * ease
      }
      // A filmed welcome: the door follows the clip, so it moves when the hand on screen moves it.
      if (useFilm && video.current && !leaving.current) {
        const t = video.current.currentTime
        st.theta = doorAt(t)
        st.reach = Math.min(1, 0.3 + st.theta / 45)
        if (t >= filmed.invite && st.lit === 0) gsap.to(st, { lit: 1, duration: 0.8 })
      }
      const t = useFilm ? video.current?.currentTime ?? 0 : timeline.current?.time() ?? 0
      const f = Math.floor(t * 24)
      if (f !== frame && hud.current.time) {
        frame = f
        const two = (n) => String(n).padStart(2, '0')
        hud.current.time.textContent = `00:${two(Math.floor(f / 1440))}:${two(Math.floor(f / 24) % 60)}:${two(f % 24)}`
      }
      draw()
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
    }
  }, [measure, draw, reduced, fine, useFilm])

  const scene = (n) => {
    if (hud.current.scene) hud.current.scene.textContent = SCENES[n]
  }

  // Still at the door after the invitation? Every so often the host beckons again: the hand curls
  // twice, the head tips towards the room. Never while you are already reaching for the way in.
  const waitForYou = useCallback(() => {
    beckon.current?.kill()
    const again = () => {
      if (leaving.current || closing.current) return
      if (!s.current.eager) {
        gsap
          .timeline()
          .to(p.current, { l2: 72, l3: -55, duration: 0.24, ease: 'power2.inOut', yoyo: true, repeat: 3 }, 0)
          .to(p.current, { tilt: 8, duration: 0.45, ease: 'power2.inOut', yoyo: true, repeat: 1 }, 0)
      }
      beckon.current = gsap.delayedCall(7, again)
    }
    beckon.current = gsap.delayedCall(5, again)
  }, [])

  // The performance, as one continuous piece: arrival, the knock, recognition, invitation, you.
  const perform = useCallback(
    (first) => {
      timeline.current?.kill()
      beckon.current?.kill()
      closing.current = false
      const st = s.current
      const pose = p.current
      const gs = g.current
      const guestPose = gp.current
      gsap.killTweensOf([st, pose, gs, guestPose])
      Object.assign(st, { theta: 1.5, reach: first ? 0 : 0.3, lit: 0, dim: DARK, rattle: 0, ring: 0 })
      Object.assign(pose, { ...REST_POSE, side: 0, ik: 0 })
      Object.assign(guestPose, { ...REST_POSE })
      Object.assign(gs, { at: 0, stride: 0, cadence: 1, spring: 1 })
      for (const el of [say.current.guest, say.current.host]) {
        el.textContent = ''
        el.style.opacity = 0
      }
      cta.current?.classList.remove('is-called')
      scene(0)
      finish(false)
      if (useFilm) {
        const v = video.current
        if (v) {
          v.currentTime = 0
          v.play().catch(() => setUseFilm(false))
        }
        return
      }
      sound.cue('arrival')
      const tl = gsap.timeline({
        onComplete: () => {
          finish(true)
          waitForYou()
        },
      })
      // A line of dialogue, typed out over whoever says it, a key click per letter, and taken away
      // again after `hold`.
      const line = (el, text, at, hold) => {
        const c = { n: 0 }
        let shown = 0
        const type = () => {
          const n = Math.round(c.n)
          if (n === shown) return
          if (n > shown && text[n - 1] !== ' ') sound.key()
          shown = n
          el.textContent = text.slice(0, n)
        }
        tl.set(el, { opacity: 1 }, at).to(c, { n: text.length, duration: Math.min(0.9, text.length * 0.04), ease: 'none', onUpdate: type }, at)
        if (hold) tl.to(el, { opacity: 0, duration: 0.35 }, at + hold)
      }
      if (first) {
        // Arrival: the room comes up out of the dark; the door is shut but not latched.
        tl.from('.w__scene', { opacity: 0, duration: 1.2, ease: 'power1.out' }, 0)
        tl.from('.w__rise', { yPercent: 110, duration: 1.3, stagger: 0.1, ease: 'expo.out' }, 0.6)
        tl.from('.w__in', { opacity: 0, y: 14, duration: 1.1, stagger: 0.1, ease: 'expo.out' }, 0.8)
      }
      tl.to(st, { reach: 0.3, duration: 1.2, ease: 'power2.out' }, 0.2)
        // Somebody walks up from behind us and stops beside the door.
        .to(guestPose, { alpha: 1, duration: 0.5 }, 0.1)
        .to(gs, { stride: 1, duration: 0.3 }, 0.1)
        .to(gs, { at: 1, duration: 2.4, ease: 'power2.out' }, 0.1)
        .to(gs, { stride: 0, duration: 0.5, ease: 'power1.out' }, 2.0)
        // The knock: a look up at the door, a raised hand, three raps that rattle it in its frame.
        .call(scene, [1], 2.4)
        .to(guestPose, { tilt: -4, lean: -2, duration: 0.4, ease: 'power2.inOut' }, 2.4)
        .to(guestPose, { r1: 40, r2: 95, r3: -25, duration: 0.35, ease: 'power2.out' }, 2.7)
      for (const at of [3.1, 3.38, 3.66]) {
        tl.to(guestPose, { r2: 112, r1: 36, duration: 0.08, yoyo: true, repeat: 1, ease: 'power2.in' }, at)
          .call(sfx('knock'), null, at + 0.07)
          .to(st, { rattle: 1.4, duration: 0.05, yoyo: true, repeat: 1, ease: 'power1.out' }, at + 0.08)
          .fromTo(st, { ring: 0 }, { ring: 1, duration: 0.3, ease: 'power2.out', immediateRender: false }, at + 0.08)
      }
      line(say.current.guest, LINES.knock, 3.1, 1.5)
      tl.to(guestPose, { r1: 4, r2: 6, r3: 0, tilt: 0, lean: 0, duration: 0.55, ease: 'power2.inOut' }, 4.0)
        // A pause. Then inside, somebody puts the light on. It catches on the second try.
        .call(sfx('flick'), null, 4.4)
        .call(sfx('cue', 'light'), null, 4.45)
        .to(st, { dim: 0.2, duration: 0.05 }, 4.4)
        .to(st, { dim: 0.5, duration: 0.08 }, 4.47)
        .to(st, { dim: 0.08, duration: 0.05 }, 4.62)
        .to(st, { dim: 0.32, duration: 0.1 }, 4.7)
        .to(st, { dim: 0, duration: 0.35, ease: 'power2.out' }, 4.85)
        // Anticipation: something on the other side moves the door, then lets it settle.
        .to(st, { theta: 16, reach: 0.55, duration: 0.55, ease: 'power2.out' }, 5.1)
        .to(st, { theta: 13, duration: 0.55, ease: 'power2.inOut' }, 5.65)
        // Recognition: a head and shoulder lean out from behind the frame, and stop.
        .call(scene, [2], 5.9)
        .set(pose, { alpha: 1 }, 5.9)
        .to(pose, { lean: -17, tilt: -6, duration: 1.0, ease: 'power2.inOut' }, 6.0)
        .call(sfx('cue', 'recognise'), null, 6.6)
        // They look at their guest, start, look again, and nod. The guest waves back.
        .to(pose, { tilt: 3, duration: 0.45, ease: 'power2.inOut' }, 7.1)
        .to(pose, { lean: -13, duration: 0.12, ease: 'power2.out' }, 7.45)
        .to(pose, { lean: -18, duration: 0.3, ease: 'power2.inOut' }, 7.6)
        .to(pose, { nod: 1.2, duration: 0.2, ease: 'power1.inOut', yoyo: true, repeat: 1 }, 7.9)
        .to(guestPose, { l1: 145, l2: 25, duration: 0.35, ease: 'back.out(2)' }, 7.95)
        .to(guestPose, { l2: -12, duration: 0.15, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 8.3)
        .to(guestPose, { l1: 4, l2: 6, duration: 0.5, ease: 'power2.inOut' }, 8.9)
        // Invitation: they take the handle, ease the door back a touch, then draw it wide...
        .call(scene, [3], 8.2)
      line(say.current.host, LINES.host, 8.2, 2.1)
      tl.to(pose, { lean: -6, tilt: 0, duration: 0.5, ease: 'power2.inOut' }, 8.3)
        .to(pose, { ik: 1, duration: 0.45, ease: 'power2.out' }, 8.45)
        .to(st, { theta: 11, duration: 0.25, ease: 'power1.inOut' }, 8.8)
        .call(sfx('cue', 'open'), null, 9.05)
        .to(st, { theta: INVITED.theta + 3, reach: 1, duration: 1.4, ease: 'power3.inOut' }, 9.05)
        .to(st, { theta: INVITED.theta, duration: 0.5, ease: 'sine.inOut' }, 10.45)
        .to(pose, { side: 1, lean: -1, duration: 1.4, ease: 'power2.inOut' }, 9.05)
        .to(pose, { bob: -2.2, duration: 0.25, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 9.15)
        // ...and open the other hand towards the room.
        .to(pose, { ...GESTURE, duration: 1.0, ease: 'power3.out' }, 10.4)
        // The guest is delighted: a little hop, and in they go with a spring in every step.
        .to(guestPose, { bob: -24, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' }, 10.2)
      line(say.current.guest, LINES.guest, 10.3, 2.1)
      tl.set(gs, { cadence: 1.3, spring: 2 }, 10.6)
        .call(sfx('cue', 'walk'), null, 10.6)
        .to(gs, { stride: 1, duration: 0.3 }, 10.6)
        .to(gs, { at: 3, duration: 3.0, ease: 'sine.inOut' }, 10.6)
        .to(gs, { stride: 0, duration: 0.3 }, 13.3)
        // And then they turn to you. The sign over the door comes on; the way in is offered.
        .call(scene, [4], 13.5)
        .to(pose, { tilt: 2, duration: 0.6, ease: 'power2.inOut' }, 13.5)
        .to(st, { lit: 1, duration: 0.9, ease: 'power2.out' }, 13.6)
        .call(sfx('cue', 'you'), null, 13.7)
        .call(() => cta.current?.classList.add('is-called'), null, 14.0)
      line(say.current.host, LINES.you, 13.6)
      timeline.current = tl
    },
    [useFilm, finish, waitForYou],
  )

  // Lights out before an encore: the host walks the door shut behind them, it meets the frame, the
  // lamp goes off, a beat of dark, and the scene starts again from exactly where it began.
  const replay = useCallback(() => {
    if (leaving.current || closing.current) return
    if (useFilm) return perform(false)
    closing.current = true
    beckon.current?.kill()
    timeline.current?.kill()
    const st = s.current
    const pose = p.current
    gsap.killTweensOf([st, pose, g.current, gp.current])
    finish(false)
    cta.current?.classList.remove('is-called')
    scene(5)
    timeline.current = gsap
      .timeline({ onComplete: () => perform(false) })
      .to([say.current.guest, say.current.host], { opacity: 0, duration: 0.3 }, 0)
      .to(pose, { l1: 4, l2: 6, l3: 0, lean: -3, tilt: 0, ik: 1, side: 1, alpha: 1, duration: 0.5, ease: 'power2.inOut' }, 0)
      .to(st, { lit: 0, duration: 0.4 }, 0.1)
      .to(st, { theta: 1.5, reach: 0.3, duration: 1.15, ease: 'power2.in' }, 0.4)
      .to(pose, { alpha: 0, duration: 0.2 }, 1.4)
      .call(sfx('shut'), null, 1.55)
      .to(st, { rattle: 1.2, duration: 0.05, yoyo: true, repeat: 1 }, 1.55)
      .call(sfx('flick'), null, 1.95)
      .call(sfx('cue', 'arrival'), null, 1.95)
      .to(st, { dim: DARK, duration: 0.08 }, 1.95)
      .set({}, {}, 2.5)
  }, [useFilm, perform, finish])

  useLayoutEffect(() => {
    if (reduced) {
      scene(4)
      say.current.host.textContent = LINES.you
      say.current.host.style.opacity = 1
      return
    }
    const ctx = gsap.context(() => perform(true), root)
    return () => {
      timeline.current?.kill()
      beckon.current?.kill()
      ctx.revert()
    }
  }, [reduced, perform])

  // The visitor's presence: the camera moves with them, the lamp and the person's eyes follow them.
  useEffect(() => {
    if (!fine || reduced) return
    const move = (e) => {
      const r = geo.current
      if (!r || leaving.current) return
      const nx = e.clientX / r.w - 0.5
      s.current.lampTarget = lampHome(r) - nx * r.W * 1.4
      s.current.camTarget = -nx * r.W * 0.3
      gsap.to(s.current, { look: Math.max(-1, Math.min(1, (e.clientX - r.cx) / (r.w * 0.35))), duration: 0.8, ease: 'power2.out', overwrite: 'auto' })
      gsap.to(stage.current, { y: -(e.clientY / r.h - 0.5) * 6, duration: 1.2, ease: 'power3.out', overwrite: 'auto' })
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [fine, reduced])

  // The opening credits roll on their own, one line at a time. Each line flows in letter by letter
  // from under its own baseline, holds, and flows out upwards as the next one comes. With reduced
  // motion the lines simply change.
  useEffect(() => {
    const el = credit.current
    if (!el) return
    const label = el.querySelector('.w__credit-label')
    const value = el.querySelector('.w__credit-value')
    const ticks = el.querySelectorAll('.w__credit-ticks i')
    let i = 0
    let wait = null
    const next = () => {
      i = (i + 1) % CREDIT_COUNT
      show()
    }
    const show = () => {
      const list = credits(REEL[showing.current])
      const [l, v] = list[i % list.length]
      label.textContent = l
      // Real spaces between the words, so a long credit can wrap on a narrow screen.
      value.replaceChildren(
        ...v.split(' ').flatMap((word, n) => {
          const w = document.createElement('span')
          w.className = 'w__word'
          for (const ch of word) {
            const c = document.createElement('span')
            c.className = 'w__ch'
            c.textContent = ch
            w.append(c)
          }
          return n ? [' ', w] : [w]
        }),
      )
      ticks.forEach((t, k) => t.classList.toggle('is-on', k === i))
      const chars = value.querySelectorAll('.w__ch')
      if (reduced) {
        wait = gsap.delayedCall(4, next)
        return
      }
      gsap.fromTo(label, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
      gsap.fromTo(chars, { yPercent: 115 }, { yPercent: 0, duration: 0.85, stagger: 0.016, ease: 'expo.out' })
      wait = gsap.delayedCall(3.8, () => {
        gsap.to(label, { opacity: 0, duration: 0.3 })
        gsap.to(chars, { yPercent: -115, duration: 0.45, stagger: 0.008, ease: 'power2.in', onComplete: next })
      })
    }
    const start = gsap.delayedCall(reduced ? 0 : 1.5, show)
    return () => {
      start.kill()
      wait?.kill()
      gsap.killTweensOf([label, ...value.querySelectorAll('.w__ch')])
    }
  }, [reduced])

  // Reaching for the way in: the gesture warms, and once the welcome is over the door gives a little more.
  const eager = (on) => () => {
    if (leaving.current || reduced || closing.current) return
    if (on) sound.hover()
    gsap.to(s.current, { eager: on ? 1 : 0, duration: 0.7, ease: 'power3.out', overwrite: 'auto' })
    if (finished.current && !useFilm) gsap.to(s.current, { theta: INVITED.theta + (on ? 6 : 0), duration: 0.9, ease: 'power3.out' })
  }

  const toggleSound = () => {
    if (sound.on) sound.disable()
    else sound.enable()
    setAudible(sound.on)
  }

  // Through the door. The real portfolio is mounted underneath at once, and the doorway becomes a
  // window onto it: the host steps aside, the door swings back, the room's light gives way to the
  // work, and the camera flies through the frame until the frame is the whole screen.
  const enter = useCallback(() => {
    if (leaving.current) return
    leaving.current = true
    closing.current = false
    beckon.current?.kill()
    onEnter()
    if (reduced) return
    timeline.current?.kill()
    video.current?.pause()
    sound.through()
    const r = geo.current
    const st = s.current
    const pose = p.current
    const el = root.current
    gsap.killTweensOf([st, pose, g.current, gp.current])
    st.camTarget = 0
    // Fly at the middle of the doorway, far enough that its edges pass the edges of the screen.
    const ox = r.cx
    const oy = (r.T + r.B) / 2
    const far = Math.max((2 * ox) / r.W, (2 * (r.w - ox)) / r.W, (2 * oy) / r.H, (2 * (r.h - oy)) / r.H) * 1.04
    const portal = { open: 0, scale: 1 }
    const paint = () => {
      const k = portal.scale
      gsap.set(stage.current, { scale: k, x: 0, y: 0 })
      el.style.setProperty('--hole-x', `${(ox + (r.L - ox) * k).toFixed(1)}px`)
      el.style.setProperty('--hole-y', `${(oy + (r.T - oy) * k).toFixed(1)}px`)
      el.style.setProperty('--hole-w', `${(r.W * k).toFixed(1)}px`)
      el.style.setProperty('--hole-h', `${(r.H * k).toFixed(1)}px`)
      el.style.setProperty('--hole-a', portal.open.toFixed(3))
    }
    gsap
      .timeline({ onComplete: onGone })
      .to('.w__in, .w__hello, .w__replay, .w__top, .w__say, .w__credits', { opacity: 0, duration: 0.35, ease: 'power2.in', overwrite: 'auto' }, 0)
      .to(gp.current, { alpha: 0, duration: 0.3 }, 0)
      .to(pose, { lean: 5, l1: 4, l2: 6, duration: 0.5, ease: 'power2.in' }, 0)
      .to(pose, { alpha: 0, duration: 0.4 }, 0.25)
      .to(st, { theta: 88, reach: 1, lit: 1, dim: 0, rattle: 0, lamp: ox, lampTarget: ox, duration: 0.8, ease: 'power2.inOut' }, 0)
      .set(stage.current, { transformOrigin: `${ox}px ${oy}px` }, 0)
      .call(() => (paint(), el.classList.add('is-portal')), null, 0.2)
      .to(portal, { open: 1, duration: 0.75, ease: 'power1.inOut', onUpdate: paint }, 0.25)
      .to(portal, { scale: far, duration: 1.35, ease: 'power3.inOut', onUpdate: paint }, 0.55)
      // The portfolio starts its own entrance as the doorway opens onto it, so we fly into it arriving.
      .call(markReady, null, 0.25)
      .to(el, { opacity: 0, duration: 0.2 }, 1.8)
  }, [onEnter, onGone, reduced])

  // The portfolio is underneath now. With reduced motion the scene simply fades; otherwise the
  // portal does the work, and this only makes sure the curtain can never hang over the portfolio.
  useEffect(() => {
    if (!exiting) return
    let tween
    const raf = requestAnimationFrame(() => {
      if (!reduced) return
      markReady()
      tween = gsap.to(root.current, { opacity: 0, duration: 0.35, ease: 'power2.out', onComplete: onGone })
    })
    const safety = setTimeout(() => {
      markReady()
      onGone()
    }, 3500)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(safety)
      tween?.kill()
    }
  }, [exiting, reduced, onGone])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Enter' || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target.closest?.('button, a, input, textarea')) return
      e.preventDefault()
      enter()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enter])

  const b = (k) => (el) => (back.current[k] = el)
  const fr = (k) => (el) => (front.current[k] = el)

  return (
    <div ref={root} className="w" inert={exiting || undefined}>
      <div ref={stage} className="w__stage">
        <div className="w__scene">
          <svg ref={b('svg')} className="w__layer" aria-hidden="true" preserveAspectRatio="none">
            <rect ref={b('wall')} className="w__wall" />
            <rect ref={b('floor')} className="w__floor" />
            <rect ref={b('casing')} className="w__casing" />
            <rect ref={b('opening')} className="w__far" />
            <polygon ref={b('ceiling')} className="w__ceiling" />
            <polygon ref={b('sideWall')} className="w__side" />
            <polygon ref={b('roomFloor')} className="w__roomfloor" />
            <polygon ref={b('farWall')} className="w__far" />
            <rect ref={b('dim')} className="w__dim" />
            <rect ref={b('threshold')} className="w__threshold" />
            <text ref={b('lintel')} className="w__lintel" textAnchor="middle">
              Open for work
            </text>
            <text ref={b('lintelLit')} className="w__lintel is-lit" textAnchor="middle">
              Open for work
            </text>
          </svg>

          {/* The screen in the room: the real work, playing, before you've even been let in. */}
          {!useFilm && REEL.length > 0 && (
            <div ref={screen} className="w__screen" aria-hidden="true">
              {stills ? (
                <img src={REEL[onScreen].image?.src} alt="" />
              ) : (
                <video
                  key={onScreen}
                  src={REEL[onScreen].video.mobile ?? REEL[onScreen].video.mp4}
                  poster={REEL[onScreen].image?.src}
                  muted
                  autoPlay
                  playsInline
                  preload="auto"
                  loop={REEL.length === 1}
                  onEnded={() => setOnScreen((n) => (n + 1) % REEL.length)}
                />
              )}
            </div>
          )}

          {useFilm && (
            <video
              ref={video}
              className="w__film"
              src={filmed.src}
              poster={filmed.poster ?? undefined}
              muted
              playsInline
              preload="auto"
              onEnded={() => finish(true)}
              onError={() => setUseFilm(false)}
            />
          )}

          <svg ref={fr('svg')} className="w__layer" aria-hidden="true" preserveAspectRatio="none">
            <defs>
              <clipPath id="w-open">
                <rect ref={fr('openClip')} />
              </clipPath>
              <clipPath id="w-light">
                <polygon ref={fr('spillClip')} />
              </clipPath>
              <clipPath id="w-shadow">
                <polygon ref={fr('shadowClip')} />
              </clipPath>
              <clipPath id="w-gshadow">
                <polygon ref={fr('gshadowClip')} />
              </clipPath>
            </defs>

            {!useFilm && (
              <g clipPath="url(#w-open)">
                <Figure parts={fig.current} />
              </g>
            )}

            <polygon ref={fr('leaf')} className="w__leaf" />
            <polygon ref={fr('panelA')} className="w__panel" />
            <polygon ref={fr('panelB')} className="w__panel" />
            <circle ref={fr('knob')} className="w__knob" />
            <line ref={fr('edge')} className="w__edge" />
            <circle ref={fr('ring')} className="w__ring" />

            {/* The name on the floor: dark, lit where the light falls, dark again inside the shadows. */}
            <text ref={fr('nameDim')} className="w__name" textAnchor="middle">
              {site.name}
            </text>
            <polygon ref={fr('spill')} className="w__spill" />
            <g clipPath="url(#w-light)">
              <text ref={fr('nameLit')} className="w__name is-lit" textAnchor="middle">
                {site.name}
              </text>
              <g ref={fr('shade')} style={{ opacity: 0 }}>
                <polygon ref={fr('shadow')} className="w__shadow" />
                <g clipPath="url(#w-shadow)">
                  <text ref={fr('nameShade')} className="w__name" textAnchor="middle">
                    {site.name}
                  </text>
                </g>
              </g>
              <g ref={fr('gshade')} style={{ opacity: 0 }}>
                <polygon ref={fr('gshadow')} className="w__shadow" />
                <g clipPath="url(#w-gshadow)">
                  <text ref={fr('nameGShade')} className="w__name" textAnchor="middle">
                    {site.name}
                  </text>
                </g>
              </g>
            </g>

            {!useFilm && (
              <g ref={fr('guestWrap')}>
                <Figure parts={guest.current} className="w__guest" />
              </g>
            )}
          </svg>

          <canvas ref={motes} className="w__motes" aria-hidden="true" />

          <div className="w__says" aria-hidden="true">
            <p ref={(el) => (say.current.guest = el)} className="w__say is-guest" />
            <p ref={(el) => (say.current.host = el)} className="w__say is-host" />
          </div>
        </div>
      </div>

      <div className="w__grain" aria-hidden="true" />

      <h1 className="sr-only">
        {site.name} — {site.role}
      </h1>

      <div className="w__words">
        <p className="w__eyebrow w__in">
          <span className="w__dot" aria-hidden="true" />
          {site.role}
        </p>
        <p className="w__hello">
          <span className="w__line">
            <span className="w__rise">You’re</span>
          </span>
          <span className="w__line">
            <em className="w__rise w__expected">
              expected.
              <span ref={word} className="w__lamp" aria-hidden="true">
                expected.
              </span>
            </em>
          </span>
        </p>
        <div ref={credit} className="w__credits w__in" aria-hidden="true">
          <span className="w__credit-label" />
          <span className="w__credit-value" />
          <span className="w__credit-ticks">
            {Array.from({ length: CREDIT_COUNT }, (_, k) => (
              <i key={k} />
            ))}
          </span>
        </div>
        <ul className="sr-only">
          {credits(REEL[0]).map(([l, v]) => (
            <li key={l}>
              {l}: {v}
            </li>
          ))}
        </ul>
        <p className="w__about w__in">
          I’m {site.name}. I design and engineer full-stack products that ship fast, scale cleanly and feel effortless to use. The work is right through this door.
        </p>
        <div className="w__actions w__in">
          <button
            ref={cta}
            type="button"
            className="w__enter"
            onClick={enter}
            onPointerEnter={eager(true)}
            onPointerLeave={eager(false)}
            onFocus={eager(true)}
            onBlur={eager(false)}
          >
            <span>Step inside</span>
            <i aria-hidden="true">→</i>
          </button>
          <span className="w__key" aria-hidden="true">
            or press Enter ↵
          </span>
          {!reduced && (
            <>
              <span className="w__break" />
              <button type="button" className={`w__replay${done ? ' is-on' : ''}`} onClick={replay} tabIndex={done ? 0 : -1} aria-hidden={!done}>
                <span className="w__replay-icon" aria-hidden="true">
                  ↻
                </span>
                <span className="w__replay-label">Replay the scene</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="w__top">
        <div className="w__hud" aria-hidden="true">
          <span className={`w__rec${done ? '' : ' is-on'}`} />
          <span ref={(el) => (hud.current.scene = el)}>{SCENES[0]}</span>
          <span ref={(el) => (hud.current.time = el)} className="w__time">
            00:00:00:00
          </span>
        </div>
        {!reduced && (
          <button type="button" className={`w__sound${audible ? ' is-on' : ''}`} onClick={toggleSound} aria-pressed={audible}>
            <span className="w__bars" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="w__sound-label">Sound {audible ? 'on' : 'off'}</span>
          </button>
        )}
      </div>

      <button type="button" className="w__door" aria-label="Step inside — open the portfolio" onClick={enter} onPointerEnter={eager(true)} onPointerLeave={eager(false)} tabIndex={-1} />
    </div>
  )
}
