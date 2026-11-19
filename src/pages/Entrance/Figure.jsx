/*
  The person inside the room. They stand in front of the light, so we only ever see them backlit:
  a silhouette. Drawn in a 100-unit-tall space with the feet at the origin, proportioned like a
  real adult (head about 1/7.5 of the height, shoulders about a quarter), and jointed at the
  hips, neck, shoulders, elbows and wrists so it can actually perform rather than slide about.
*/

// A resting pose. Arm angles are degrees raised outward from hanging straight down.
export const REST_POSE = {
  x: 0,
  y: 0,
  k: 1,
  alpha: 0,
  lean: 0,
  tilt: 0,
  nod: 0,
  bob: 0,
  breathe: 1,
  l1: 4,
  l2: 6,
  l3: 0,
  r1: 4,
  r2: 6,
  r3: 0,
  // How far each foot is lifted off the floor, for walking.
  lh: 0,
  rh: 0,
}

const SHOULDER = [11.8, -75]
const HIPS = -45

function Arm({ side, parts }) {
  const id = side
  return (
    <g ref={(el) => (parts[`${id}1`] = el)}>
      <path d="M-2 0 C-2.15 6 -1.85 11 -1.6 15.4 L1.6 15.4 C1.85 11 2.15 6 2 0 Z" />
      <circle r="2.15" />
      <g ref={(el) => (parts[`${id}2`] = el)}>
        <circle r="1.65" />
        <path d="M-1.65 0 C-1.6 5 -1.35 10 -1.15 14.2 L1.15 14.2 C1.35 10 1.6 5 1.65 0 Z" />
        <g ref={(el) => (parts[`${id}3`] = el)}>
          <rect x="-1.75" y="-0.4" width="3.5" height="4.8" rx="1.5" />
          <rect x="-1.45" y="3.2" width="2.9" height="4.3" rx="1.3" />
          <ellipse cx="1.9" cy="2.2" rx="0.9" ry="2.1" transform="rotate(-24 1.9 2.2)" />
        </g>
      </g>
    </g>
  )
}

export function Figure({ parts, className = 'w__figure' }) {
  return (
    <g ref={(el) => (parts.root = el)} className={className}>
      <g ref={(el) => (parts.lh = el)}>
        <path d="M-9 -45 L-0.7 -45 L-1.2 -1.4 L-5.9 -1.4 C-6.7 -12 -8.6 -28 -9 -45 Z" />
        <ellipse cx="-3.7" cy="-0.9" rx="3.7" ry="1.3" />
      </g>
      <g ref={(el) => (parts.rh = el)}>
        <path d="M9 -45 L0.7 -45 L1.2 -1.4 L5.9 -1.4 C6.7 -12 8.6 -28 9 -45 Z" />
        <ellipse cx="3.7" cy="-0.9" rx="3.7" ry="1.3" />
      </g>
      <g ref={(el) => (parts.body = el)}>
        <path d="M-3 -80.5 C-6.5 -79.5 -10.5 -78.3 -12.4 -75.6 C-13.3 -74 -12.6 -69 -11.7 -65.5 C-10.6 -59 -9.4 -54 -9.3 -49.5 L-9.9 -44 L9.9 -44 L9.3 -49.5 C9.4 -54 10.6 -59 11.7 -65.5 C12.6 -69 13.3 -74 12.4 -75.6 C10.5 -78.3 6.5 -79.5 3 -80.5 Z" />
        <path d="M-2.4 -83.4 L2.4 -83.4 L2.95 -79.6 L-2.95 -79.6 Z" />
        <g ref={(el) => (parts.head = el)}>
          <ellipse cx="0" cy="-88.4" rx="5.5" ry="6.8" />
          <ellipse cx="0" cy="-91.1" rx="5.85" ry="4.8" />
          <circle cx="-5.5" cy="-88" r="1.15" />
          <circle cx="5.5" cy="-88" r="1.15" />
        </g>
        <g transform={`translate(${SHOULDER[0]} ${SHOULDER[1]})`}>
          <Arm side="l" parts={parts} />
        </g>
        <g transform={`translate(${-SHOULDER[0]} ${SHOULDER[1]}) scale(-1 1)`}>
          <Arm side="r" parts={parts} />
        </g>
      </g>
    </g>
  )
}

const f = (n) => n.toFixed(2)

// Write a pose straight onto the SVG. Called every frame; no React involved.
export function applyPose(parts, p) {
  if (!parts.root) return
  parts.root.setAttribute('transform', `translate(${f(p.x)} ${f(p.y + p.bob)}) scale(${f(p.k)})`)
  parts.root.style.opacity = p.alpha
  parts.body.setAttribute('transform', `translate(0 ${HIPS}) rotate(${f(p.lean)}) scale(1 ${f(p.breathe)}) translate(0 ${-HIPS})`)
  parts.head.setAttribute('transform', `translate(0 ${f(p.nod)}) rotate(${f(p.tilt)} 0 -82)`)
  // Positive angles raise each arm outward, away from the body, on either side.
  parts.l1.setAttribute('transform', `rotate(${f(-p.l1)})`)
  parts.l2.setAttribute('transform', `translate(0 15) rotate(${f(-p.l2)})`)
  parts.l3.setAttribute('transform', `translate(0 14) rotate(${f(-p.l3)})`)
  parts.r1.setAttribute('transform', `rotate(${f(-p.r1)})`)
  parts.r2.setAttribute('transform', `translate(0 15) rotate(${f(-p.r2)})`)
  parts.r3.setAttribute('transform', `translate(0 14) rotate(${f(-p.r3)})`)
  // A lifted foot rises and tucks in a little under the hips, as it does seen from behind.
  parts.lh.setAttribute('transform', `translate(0 ${f(-p.lh)}) rotate(${f(-p.lh * 1.5)} -4.8 -45)`)
  parts.rh.setAttribute('transform', `translate(0 ${f(-p.rh)}) rotate(${f(p.rh * 1.5)} 4.8 -45)`)
}
