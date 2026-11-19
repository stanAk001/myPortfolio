/*
  A figure of Akeem that can actually turn, rather than swapping between drawings. Every part sits
  at an angle around the body (placket at the front, embroidery either side, shoulders and ears at
  the sides), and as he turns each part moves round and foreshortens like on a real person: the far
  embroidery slides out of view, the near lens and its arm swing round to the ear, the nose goes
  into profile, the far arm passes behind him. The head has its own yaw so it can lead the body.

  Drawn in a 260 × 360 box. Body yaw `Y` and head yaw `H` go from 0 (facing you) to 1 (profile,
  facing the stage on the right). Arm angles are screen angles: 0 hangs straight down, negative
  swings the hand toward the stage.
*/

export const POSES = {
  rest: { L1: 6, L2: 2, R1: -6, R2: -2, tilt: 0, lean: 0 },
  // Facing you, right hand up, finger raised: "look at this".
  impulse: { L1: 8, L2: 2, R1: -38, R2: -105, tilt: 4, lean: 0 },
  wave: { L1: 6, L2: 2, R1: -150, R2: -22, tilt: -3, lean: 0 },
  // Arms loose while he turns so it reads as the whole body moving.
  hang: { L1: 3, L2: 2, R1: -3, R2: -2, tilt: 0, lean: 0 },
  // Both hands out toward the stage, palms open: "here it is".
  present: { L1: -64, L2: -16, R1: -76, R2: -20, tilt: 2, lean: 3 },
  // Hand to chest: thank you.
  thanks: { L1: -22, L2: -118, R1: -6, R2: -2, tilt: 0, lean: 0 },
}

export const START = { ...POSES.rest, Y: 0, H: 0, bx: 0, dip: 0, nod: 0, bob: 0 }

const Q = Math.PI / 2
const f = (n) => n.toFixed(2)
const clamp01 = (v) => Math.max(0, Math.min(1, v))

// A point at angle `phi` on an elliptical cross-section (half-width a, half-depth b), rotated by yaw.
const proj = (phi, a, b, y) => ({
  x: a * Math.sin(phi) * Math.cos(y) + b * Math.cos(phi) * Math.sin(y),
  z: -a * Math.sin(phi) * Math.sin(y) + b * Math.cos(phi) * Math.cos(y),
})
// How wide that cross-section looks from the front at this yaw.
const half = (a, b, y) => Math.hypot(a * Math.cos(y), b * Math.sin(y))
// The torso gets slightly wider from shoulders to hem.
const torso = (y) => {
  const t = clamp01((y - 128) / 168)
  return [52 + 3 * t, 25 + 4 * t]
}
// Head: half-width, half-depth, and where its centre is.
const HW = 21
const HD = 23
const HY = 77

const MOTIFS = [
  [-0.5, 170, 'h'],
  [-0.5, 214, 's'],
  [-0.5, 258, 'h'],
  [0.5, 170, 'h'],
  [0.5, 214, 's'],
  [0.5, 258, 'h'],
]
const BUTTONS = [166, 198, 230, 262]

function Motif({ kind, part, i }) {
  return (
    <g ref={part(`m${i}`)} className="pr__motif">
      {kind === 's' ? (
        <>
          <path d="M0 -12 L10 0 L0 12 L-10 0 Z" />
          <path d="M0 -7 Q1.4 -1.4 7 0 Q1.4 1.4 0 7 Q-1.4 1.4 -7 0 Q-1.4 -1.4 0 -7 Z" />
        </>
      ) : (
        <>
          <path d="M0 -17 L12 0 L0 17 L-12 0 Z" />
          <path d="M-6 -8.5 L6 -8.5 M-9 -3 L9 -3 M-9 3 L9 3 M-6 8.5 L6 8.5" />
        </>
      )}
    </g>
  )
}

// One arm: a short draping sleeve, a tapered upper arm, a forearm and a proper hand (palm, closed
// fingers, thumb). Every piece has a hairline edge so it reads against the shirt.
function Arm({ side, part }) {
  return (
    <g ref={part(`${side}`)}>
      <g ref={part(`${side}1`)}>
        <path className="pr__limb" d="M-9.5 40 C-10.5 50 -10 58 -9 66 L9 66 C10 58 10.5 50 9.5 40 Z" />
        <path className="pr__shirt pr__limb" d="M-17 -10 C-21 8 -21.5 30 -20.5 51 Q0 55 20.5 51 C21.5 30 21 8 17 -10 Z" />
        <g ref={part(`${side}2`)}>
          <path className="pr__limb" d="M-9.2 -4 C-10.4 16 -9.4 38 -7.4 56 L7.4 56 C9.4 38 10.4 16 9.2 -4 Z" />
          {side === 'L' && <rect x="-8.6" y="43" width="17.2" height="7" rx="2.2" className="pr__watch" />}
          <g transform="translate(0 54)">
            <path className="pr__limb" d="M-7.4 0 C-8.6 9 -8.4 16 -6.4 22 C-5 27 -2.4 30 0.6 30 C3.8 30 6.4 26.6 7.2 21 C8.4 14 8.4 7 7.4 0 Z" />
            <path className="pr__limb" d="M-6.6 4 C-11.6 7 -13 13 -10.6 17 C-8.6 15.6 -7.2 12 -5.6 9.4 Z" />
          </g>
        </g>
      </g>
    </g>
  )
}

export function Rig({ part }) {
  return (
    <svg className="pr__fig" viewBox="0 0 260 360" aria-hidden="true">
      <g ref={part('root')}>
        <g ref={part('body')}>
          <g ref={part('back')} />
          <path ref={part('legL')} d="M0 0 L31 0 C30.5 26 29.6 50 28.6 76 L3 76 C2 50 0.8 26 0 0 Z" className="pr__trousers pr__limb" />
          <path ref={part('legR')} d="M0 0 L31 0 C30.5 26 29.6 50 28.6 76 L3 76 C2 50 0.8 26 0 0 Z" className="pr__trousers pr__limb" />
          <rect ref={part('neck')} y="96" height="38" rx="7" />
          <path ref={part('shirt')} className="pr__shirt" />
          <path ref={part('collar')} className="pr__seam" />
          <path ref={part('placket')} className="pr__seam" />
          {BUTTONS.map((y, i) => (
            <circle key={y} ref={part(`b${i}`)} cy={y} r="1.6" className="pr__button" />
          ))}
          {MOTIFS.map(([, , kind], i) => (
            <Motif key={i} kind={kind} part={part} i={i} />
          ))}

          <g ref={part('head')}>
            <ellipse ref={part('earL')} cy="79" rx="4" ry="7" />
            <ellipse ref={part('earR')} cy="79" rx="4" ry="7" />
            {/* A head, not an egg: rounded crown, jaw narrowing to the chin. */}
            <path ref={part('skull')} d="M-21 -6 C-21 -20 -12 -27 0 -27 C12 -27 21 -20 21 -6 C21 6 18 15 12 21 C8 25 4 27 0 27 C-4 27 -8 25 -12 21 C-18 15 -21 6 -21 -6 Z" />
            <path ref={part('hair')} d="M-21.6 -4 C-23 -21 -14 -29.5 0 -29.5 C14 -29.5 23 -21 21.6 -4 C18 -11 12 -15.5 0 -16 C-12 -15.5 -18 -11 -21.6 -4 Z" className="pr__hair" />
            <path ref={part('nose')} />
            <path ref={part('templeL')} className="pr__frame" />
            <path ref={part('templeR')} className="pr__frame" />
            <path ref={part('lensL')} className="pr__lens" d="M-8 -5 H8 V1.5 Q8 6.5 2.5 6.5 H-2.5 Q-8 6.5 -8 1.5 Z" />
            <path ref={part('lensR')} className="pr__lens" d="M-8 -5 H8 V1.5 Q8 6.5 2.5 6.5 H-2.5 Q-8 6.5 -8 1.5 Z" />
            <path ref={part('bridge')} className="pr__frame" />
            <g ref={part('budL')} className="pr__bud">
              <circle r="3.4" />
              <rect x="-1.4" width="2.8" height="9" rx="1.4" />
            </g>
            <g ref={part('budR')} className="pr__bud">
              <circle r="3.4" />
              <rect x="-1.4" width="2.8" height="9" rx="1.4" />
            </g>
            <path ref={part('glint')} className="pr__glint" d="M3 -6 L-1 6" />
          </g>
          {/* Arms start in front. draw() moves each one behind the body when it goes round. */}
          <g ref={part('front')}>
            <Arm side="L" part={part} />
            <Arm side="R" part={part} />
          </g>
        </g>
      </g>
    </svg>
  )
}

/*
  Draw the figure for a pose. Called every frame by the tweens, writes attributes directly and never
  goes through React. Arms switch between the layer behind the body and the one in front as they
  pass round.
*/
export function draw(P, p) {
  if (!P.root) return
  const Y = p.Y * Q
  const H = p.H * Q
  const C = 130 + p.bx

  P.root.setAttribute('transform', `translate(0 ${f(p.bob)})`)
  P.body.setAttribute('transform', `translate(0 ${f(p.dip)}) rotate(${f(p.lean)} ${f(C)} 296)`)

  // Shirt outline: neckline, sloping shoulder, boxy body falling straight, soft hem.
  const wN = half(13, 10, Y)
  const wS = half(53, 25, Y)
  const wH = half(55, 29, Y)
  P.shirt.setAttribute(
    'd',
    `M${f(C - wN)} 108 C${f(C - wN - 18)} 110 ${f(C - wS + 3)} 114 ${f(C - wS)} 131 Q${f(C - wS - 2)} 214 ${f(C - wH)} 296 Q${f(C)} 301 ${f(C + wH)} 296 Q${f(C + wS + 2)} 214 ${f(C + wS)} 131 C${f(C + wS - 3)} 114 ${f(C + wN + 18)} 110 ${f(C + wN)} 108 Z`,
  )

  // Shirt front: collar, placket and buttons follow the centre line round.
  const front = (y) => {
    const [a, b] = torso(y)
    return C + proj(0, a, b, Y).x
  }
  const faceOn = clamp01(Math.cos(Y) * 4)
  const side = (phi, a, b) => C + proj(phi, a, b, Y).x
  P.collar.setAttribute('d', `M${f(side(-0.32, 13, 10))} 108 Q${f(side(-0.7, 36, 20))} 118 ${f(side(-0.62, 40, 22))} 131 L${f(front(144))} 144 L${f(side(0.62, 40, 22))} 131 Q${f(side(0.7, 36, 20))} 118 ${f(side(0.32, 13, 10))} 108`)
  P.placket.setAttribute('d', `M${f(front(144))} 144 L${f(front(298))} 298`)
  P.collar.style.opacity = faceOn
  P.placket.style.opacity = faceOn
  BUTTONS.forEach((y, i) => {
    P[`b${i}`].setAttribute('cx', f(front(y)))
    P[`b${i}`].style.opacity = faceOn
  })

  // Embroidery: each motif moves with the fabric and narrows as it turns away.
  MOTIFS.forEach(([phi, y], i) => {
    const [a, b] = torso(y)
    const pt = proj(phi * 0.92, a, b, Y)
    const sx = Math.max(0.04, Math.cos(phi + Y))
    P[`m${i}`].setAttribute('transform', `translate(${f(C + pt.x)} ${y}) scale(${f(0.64 * sx)} 0.64)`)
    P[`m${i}`].style.opacity = clamp01(pt.z / 6) * 0.92
  })

  // Legs and neck.
  const legL = proj(-0.45, 42, 24, Y)
  const legR = proj(0.45, 42, 24, Y)
  P.legL.setAttribute('transform', `translate(${f(C + legL.x - 15.5)} 288)`)
  P.legR.setAttribute('transform', `translate(${f(C + legR.x - 15.5)} 288)`)
  const nw = half(10, 9, Y)
  const hx = C + 3 * Math.sin(H)
  P.neck.setAttribute('x', f(hx - nw))
  P.neck.setAttribute('width', f(nw * 2))

  // Head, turning on its own yaw.
  P.head.setAttribute('transform', `translate(0 ${f(p.nod)}) rotate(${f(p.tilt)} ${f(hx)} 104)`)
  const rx = half(HW, HD, H)
  P.skull.setAttribute('transform', `translate(${f(hx)} ${HY}) scale(${f(rx / HW)} 1)`)
  P.hair.setAttribute('transform', `translate(${f(hx)} ${HY}) scale(${f(rx / HW)} 1)`)
  const nb = hx + proj(0, HW, HD, H).x
  const out = 5.5 * Math.sin(H)
  P.nose.setAttribute('d', `M${f(nb - 1)} 72 C${f(nb + out * 0.6)} 78 ${f(nb + out)} 82 ${f(nb + out * 0.6)} 85 L${f(nb - 1)} 86 Z`)

  const ears = {
    L: proj(-Q, HW, HD, H),
    R: proj(Q, HW, HD, H),
  }
  P.earL.setAttribute('cx', f(hx + ears.L.x * 0.98))
  P.earR.setAttribute('cx', f(hx + ears.R.x * 0.98))
  for (const k of ['L', 'R']) {
    P[`bud${k}`].setAttribute('transform', `translate(${f(hx + ears[k].x)} 82) scale(0.8)`)
    P[`bud${k}`].style.opacity = clamp01((ears[k].z + 6) / 6)
  }

  // Glasses: two lenses on the face, the bridge, and the arms back to the ears.
  const GY = HY - 1
  const lens = {}
  for (const [k, phi] of [
    ['L', -0.42],
    ['R', 0.42],
  ]) {
    const pt = proj(phi, HW, HD, H)
    const sx = Math.max(0.04, Math.cos(phi + H))
    lens[k] = { x: hx + pt.x, sx, on: clamp01(pt.z / 5) }
    P[`lens${k}`].setAttribute('transform', `translate(${f(lens[k].x)} ${GY}) scale(${f(sx)} 1)`)
    P[`lens${k}`].style.opacity = lens[k].on
  }
  P.bridge.setAttribute('d', `M${f(lens.L.x + 8 * lens.L.sx)} ${GY - 4} Q${f((lens.L.x + lens.R.x) / 2)} ${GY - 6} ${f(lens.R.x - 8 * lens.R.sx)} ${GY - 4}`)
  P.bridge.style.opacity = Math.min(lens.L.on, lens.R.on)
  P.templeL.setAttribute('d', `M${f(lens.L.x - 8 * lens.L.sx)} ${GY - 4} L${f(hx + ears.L.x)} ${GY - 1}`)
  P.templeR.setAttribute('d', `M${f(lens.R.x + 8 * lens.R.sx)} ${GY - 4} L${f(hx + ears.R.x)} ${GY - 1}`)
  P.templeL.style.opacity = Math.min(lens.L.on, clamp01((ears.L.z + 8) / 8))
  P.templeR.style.opacity = Math.min(lens.R.on, clamp01((ears.R.z + 8) / 8))
  const near = lens.L.on >= lens.R.on ? lens.L : lens.R
  P.glint.setAttribute('transform', `translate(${f(near.x)} ${GY}) scale(${f(near.sx * 0.8)} 0.8)`)

  // Arms hang from the shoulders, which move round the body; they go behind him once past the side.
  for (const [k, phi] of [
    ['L', -Q],
    ['R', Q],
  ]) {
    const s = proj(phi, 47, 22, Y)
    P[k].setAttribute('transform', `translate(${f(C + s.x)} 134)`)
    P[`${k}1`].setAttribute('transform', `rotate(${f(p[`${k}1`])})`)
    P[`${k}2`].setAttribute('transform', `translate(0 62) rotate(${f(p[`${k}2`])})`)
    const layer = s.z < -4 ? P.back : P.front
    if (P[k].parentNode !== layer) layer.appendChild(P[k])
  }
}
