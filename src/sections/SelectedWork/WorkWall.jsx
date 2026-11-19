import { featuredProjects as projects } from '../../data/projects'
import { pad } from '../../utils'

/*
  Real screenshots of every project on one tilted plane. SelectedWork's timeline flies the camera into
  the centre tile (the first project's poster) until it sits exactly where that project's screen is
  in the first scene, then hands over without a cut.
*/
export const WALL_COLS = 5
export const WALL_ROWS = 3

function tiles() {
  const first = projects[0]
  const pool = projects.flatMap((p) => [
    ...(p === first ? [] : [{ src: p.image.src, p }]),
    ...p.gallery.map((g) => ({ src: g.src, p, tall: g.height > g.width })),
  ])
  const total = WALL_COLS * WALL_ROWS
  const centre = Math.floor(total / 2)
  // Mix the projects up so neighbouring tiles are different.
  const sorted = [...pool].sort((a, b) => projects.indexOf(a.p) - projects.indexOf(b.p))
  const mixed = []
  for (let i = 0; mixed.length < sorted.length; i++) {
    const p = projects[i % projects.length]
    const next = sorted.find((t) => t.p === p && !mixed.includes(t))
    if (next) mixed.push(next)
    if (i > sorted.length * projects.length) break
  }
  const out = []
  for (let i = 0; i < total; i++) out.push(i === centre ? { src: first.image.src, p: first, centre: true } : mixed[(i > centre ? i - 1 : i) % mixed.length])
  return out
}

export default function WorkWall() {
  return (
    <div className="wall" aria-hidden="true">
      <div className="wall__plane">
        {tiles().map((t, i) => (
          <div key={i} className={`wall__tile${t.centre ? ' wall__tile--centre' : ''}${t.tall ? ' wall__tile--tall' : ''}`}>
            <img src={t.src} alt="" decoding="async" loading={t.centre ? 'eager' : 'lazy'} />
          </div>
        ))}
      </div>
      <div className="wall__shade" />
      <div className="wall__copy">
        <p className="label">(02) Selected work</p>
        <p className="wall__title display">
          Selected <em>work</em>
          <sup>({pad(projects.length)})</sup>
        </p>
        <p className="wall__hint label">Scroll to enter ↓</p>
      </div>
    </div>
  )
}
