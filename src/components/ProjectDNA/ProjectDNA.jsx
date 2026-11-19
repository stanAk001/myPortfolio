import { useMemo } from 'react'
import { statusLabel } from '../../data/projects'
import { cx, seeded } from '../../utils'
import './ProjectDNA.css'

// A barcode made from the project id, so the same project always gets the same pattern.
function Strand({ id }) {
  const bars = useMemo(() => {
    const rand = seeded(id)
    return Array.from({ length: 34 }, () => ({ w: 1 + Math.round(rand() * 3), h: 0.45 + rand() * 0.55 }))
  }, [id])
  let x = 0
  return (
    <svg className="dna__strand" viewBox="0 0 120 24" preserveAspectRatio="none" aria-hidden="true">
      {bars.map((b, i) => {
        const rect = <rect key={i} x={x} y={24 - b.h * 24} width={b.w * 0.7} height={b.h * 24} />
        x += b.w * 0.7 + 1.6
        return rect
      })}
    </svg>
  )
}

export default function ProjectDNA({ project, fields = ['product', 'stack', 'focus', 'status'], className }) {
  const values = {
    product: project.dna.product ?? project.category,
    stack: project.dna.stack ?? project.technologies.join(' / '),
    focus: project.dna.focus,
    status: statusLabel(project),
    role: project.role,
  }
  const rows = fields.filter((f) => values[f])

  return (
    <div className={cx('dna', className)}>
      <div className="dna__head label">
        <span>Project DNA</span>
        <Strand id={project.id} />
      </div>
      <dl>
        {rows.map((f) => (
          <div className="dna__row" key={f}>
            <dt className="label">{f}</dt>
            <dd>
              {values[f]}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
