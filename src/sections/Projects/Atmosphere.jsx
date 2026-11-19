/*
  A quiet line drawing behind each project's stage, based on what the product is: a rating scale
  for the review site, a price chart for the stock school, stacked note cards for the shopping guide,
  a day's arc for the leisure complex, a crowd of sound for the hypeman.
*/
const BARS = [28, 54, 36, 80, 120, 66, 150, 96, 42, 130, 190, 110, 70, 160, 88, 48, 124, 76, 34, 58, 100, 44, 26, 62]

const DRAWINGS = {
  toolhaven: (
    <>
      <line x1="0" x2="640" y1="720" y2="720" />
      {Array.from({ length: 33 }, (_, i) => (
        <line key={i} x1={i * 20} x2={i * 20} y1="720" y2={i % 5 ? 708 : 692} />
      ))}
    </>
  ),
  stockacademia: (
    <>
      <polyline pathLength="1" className="air-draw" points="0,760 110,720 190,744 300,650 390,684 500,590 590,622 700,500 800,540 930,420 1040,470 1170,340 1280,380 1420,240 1600,180" />
      {Array.from({ length: 16 }, (_, i) => (
        <line key={i} x1={i * 107} x2={i * 107} y1="880" y2="900" />
      ))}
    </>
  ),
  keemstore: (
    <>
      <rect x="-40" y="560" width="420" height="300" rx="10" transform="rotate(-6 170 710)" />
      <rect x="40" y="600" width="420" height="300" rx="10" transform="rotate(-1 250 750)" />
      <rect x="120" y="640" width="420" height="300" rx="10" transform="rotate(4 330 790)" />
    </>
  ),
  primetime: (
    <>
      <path pathLength="1" className="air-draw" d="M-40 900 A 720 720 0 0 1 1400 900" />
      {[
        [130, 590],
        [445, 268],
        [720, 180],
        [995, 268],
      ].map(([cx, cy]) => (
        <circle key={cx} cx={cx} cy={cy} r="7" />
      ))}
    </>
  ),
  hadex: (
    <>
      {BARS.map((h, i) => (
        <line key={i} x1={i * 28 + 14} x2={i * 28 + 14} y1="900" y2={900 - h * 1.6} />
      ))}
    </>
  ),
}

export default function Atmosphere({ id }) {
  const drawing = DRAWINGS[id]
  if (!drawing) return null
  return (
    <svg className="pj__air" viewBox="0 0 1600 900" preserveAspectRatio="xMinYMax slice" aria-hidden="true" focusable="false">
      {drawing}
    </svg>
  )
}
