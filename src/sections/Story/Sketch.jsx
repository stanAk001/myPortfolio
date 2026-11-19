/*
  A pencil wireframe drawn over the exact layout of KeemStore's real home page (1440×900), so when the
  design wipes in, every sketched box turns into the real thing in the same spot. pathLength=1 lets
  the parent animate every stroke from 0 to 1 with one CSS variable.
*/
const BOXES = [
  [637, 156, 406, 404],
  [1053, 156, 287, 301],
  [1053, 467, 287, 300],
  [637, 571, 227, 196],
  [874, 571, 169, 196],
]

export default function Sketch() {
  const line = (d, i) => <path key={i} d={d} pathLength="1" className="sk__stroke" style={{ '--i': i }} />
  let i = 0
  return (
    <svg className="sk" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <filter id="sk-pencil">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="5" />
        </filter>
      </defs>
      <g filter="url(#sk-pencil)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Nav */}
        {line('M100 70 C140 62 170 78 205 66', i++)}
        {[232, 312, 396, 463, 542, 617, 694, 767].map((x) => line(`M${x} 72 H${x + 50}`, i++))}
        {line('M1262 72 H1330', i++)}
        {/* Headline + copy */}
        {line('M100 300 C220 285 380 310 500 292', i++)}
        {line('M100 400 C190 392 260 408 330 398', i++)}
        {line('M100 505 C200 498 300 512 390 500', i++)}
        {line('M100 610 H535', i++)}
        {line('M100 640 H500', i++)}
        {line('M100 668 H340', i++)}
        {/* Buttons */}
        {line('M100 708 H337 V760 H100 Z', i++)}
        {line('M349 708 H562 V760 H349 Z', i++)}
        {/* Image boxes with the classic "picture goes here" cross */}
        {BOXES.flatMap(([x, y, w, h]) => [
          line(`M${x} ${y} H${x + w} V${y + h} H${x} Z`, i++),
          line(`M${x} ${y} L${x + w} ${y + h} M${x + w} ${y} L${x} ${y + h}`, i++),
        ])}
        {/* Trending strip */}
        {line('M40 865 C400 858 900 872 1400 862', i++)}
      </g>
      {/* Margin notes in the designer's handwriting */}
      <g className="sk__notes">
        <text x="560" y="250" transform="rotate(-6 560 250)">big, friendly headline</text>
        <text x="1080" y="135" transform="rotate(3 1080 135)">real photos, not stock</text>
        <text x="120" y="820">one clear next step →</text>
      </g>
    </svg>
  )
}
