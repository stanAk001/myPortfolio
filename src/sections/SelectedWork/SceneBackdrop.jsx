import { useMemo } from 'react'
import { seeded } from '../../utils'

/*
  One quiet background layer per project, based on what the product is. Same layout system
  everywhere; the backdrop gives each scene its own feel.
*/

function Directory({ project }) {
  const initial = project.title[0].toUpperCase()
  return (
    <div className="bd bd--directory">
      <ol className="bd__index">
        {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => (
          <li key={l} className={l === initial ? 'is-on' : undefined}>
            {l}
          </li>
        ))}
      </ol>
    </div>
  )
}

function Data({ project }) {
  const path = useMemo(() => {
    const rand = seeded(project.id)
    let y = 200
    const points = Array.from({ length: 64 }, (_, i) => {
      y = Math.min(280, Math.max(30, y + (rand() - 0.47) * 34))
      return `${(i / 63) * 1000},${y.toFixed(1)}`
    })
    return `M${points.join(' L')}`
  }, [project.id])
  return (
    <div className="bd bd--data">
      <svg viewBox="0 0 1000 300" preserveAspectRatio="none">
        {[60, 130, 200, 270].map((y) => (
          <line key={y} x1="0" x2="1000" y1={y} y2={y} className="bd__grid" />
        ))}
        <path d={path} className="bd__line" pathLength="1" />
      </svg>
    </div>
  )
}

function Commerce({ project }) {
  const bars = useMemo(() => {
    const rand = seeded(project.id + '-sku')
    return Array.from({ length: 42 }, () => 1 + Math.round(rand() * 3))
  }, [project.id])
  return (
    <div className="bd bd--commerce">
      <div className="bd__tag">
        <div className="bd__barcode">
          {bars.map((w, i) => (
            <i key={i} style={{ width: w }} />
          ))}
        </div>
        <span>SKU {project.id.toUpperCase()}-{project.number}</span>
      </div>
    </div>
  )
}

function Editorial({ project }) {
  return (
    <div className="bd bd--editorial">
      <span className="bd__word">{project.title}</span>
      <span className="bd__reel">
        {project.title} — Reel {project.number}
      </span>
    </div>
  )
}

const TREATMENTS = { directory: Directory, data: Data, commerce: Commerce, editorial: Editorial }

export default function SceneBackdrop({ project }) {
  const Treatment = TREATMENTS[project.theme.treatment]
  if (!Treatment) return null
  return (
    <div className="scene__backdrop" aria-hidden="true">
      <Treatment project={project} />
    </div>
  )
}
