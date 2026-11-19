import { useState } from 'react'
import { Reveal } from '../../components/Motion/Reveal'
import Lattice from '../../components/Lattice/Lattice'
import { projects } from '../../data/projects'
import { cx, pad } from '../../utils'
import './Skills.css'

/*
  The skills laid out as the stack itself: six layers from the screen down to the server, each its own
  colour band. Every technology shows where it's actually used, from the projects' own data plus
  TheBox Lounge and this site. Hover a project and everything it's built with lights up through the
  layers; hover a technology and the projects using it light up.
*/
const WORKS = [
  ...projects.map((p, i) => ({ id: p.id, short: pad(i + 1), name: p.title, uses: p.technologies })),
  { id: 'thebox', short: 'TB', name: 'TheBox Lounge', uses: ['React', 'Node.js', 'Express', 'PostgreSQL', 'Paystack Split Payments', 'Puppeteer', 'Python', 'FFmpeg'] },
  { id: 'site', short: 'AK', name: 'This site', uses: ['React', 'Vite', 'GSAP', 'FFmpeg', 'Vercel'] },
]

const LAYERS = [
  { id: 'front', name: 'Frontend', line: 'What people touch', tech: ['React', 'Vite', 'GSAP'] },
  { id: 'back', name: 'Backend', line: 'The rules, on the server', tech: ['Node.js', 'Express'] },
  { id: 'data', name: 'Data', line: 'What has to be remembered', tech: ['PostgreSQL', 'Prisma'] },
  { id: 'auth', name: 'Auth & integrations', line: 'Who you are, how you pay', tech: ['Google sign-in', 'Paystack Split Payments'] },
  { id: 'product', name: 'Product & media', line: 'Showing it to the world', tech: ['Puppeteer', 'Python', 'FFmpeg'] },
  { id: 'ship', name: 'Deploy', line: 'Live on a real URL', tech: ['Vercel', 'Render'] },
]
const usedBy = (t) => WORKS.filter((w) => w.uses.includes(t))

export default function Skills() {
  const [work, setWork] = useState(null)
  const [tech, setTech] = useState(null)
  const lit = (t) => (work ? WORKS.find((w) => w.id === work).uses.includes(t) : tech === t)
  const workLit = (w) => (tech ? w.uses.includes(tech) : work === w.id)

  return (
    <section id="skills" className="sk tone-night" aria-labelledby="sk-title" data-focus={work || tech ? 'on' : undefined}>
      <span className="bgword" aria-hidden="true">
        STACK
      </span>
      <header className="sk__head">
        <div>
          <p className="g-meta label">
            <span className="g-square" aria-hidden="true" />
            Skills — the whole stack
          </p>
          <Reveal as="h2" lines id="sk-title" className="sk__title">
            <span className="line">
              <span>Six layers.</span>
            </span>
            <span className="line">
              <span className="g-thin">One person across all of them.</span>
            </span>
          </Reveal>
          <p className="sk__intro">Every product here runs on the same stack, from the screen down to the server. Point at a piece of work to see what it’s built with.</p>
        </div>
        <div className="sk__object">
          <Lattice />
        </div>
      </header>

      <ul className="sk__works" aria-label="Work">
        {WORKS.map((w) => (
          <li key={w.id}>
            <button type="button" className={cx(workLit(w) && 'is-lit')} aria-pressed={work === w.id} onMouseEnter={() => setWork(w.id)} onMouseLeave={() => setWork(null)} onFocus={() => setWork(w.id)} onBlur={() => setWork(null)} onClick={() => setWork(work === w.id ? null : w.id)}>
              <span>{w.short}</span>
              {w.name}
            </button>
          </li>
        ))}
      </ul>

      <ol className="sk__layers">
        {LAYERS.map((l, i) => (
          <Reveal as="li" key={l.id} className={`sk__layer is-${l.id}`} delay={i * 70}>
            <div className="sk__label">
              <span className="sk__n">{pad(i + 1)}</span>
              <h3>{l.name}</h3>
              <p>{l.line}</p>
            </div>
            <ul className="sk__tech">
              {l.tech.map((t) => {
                const by = usedBy(t)
                return (
                  <li key={t} className={cx(lit(t) && 'is-lit')} onMouseEnter={() => setTech(t)} onMouseLeave={() => setTech(null)}>
                    <b>{t}</b>
                    <span className="sk__by" aria-label={`Used in ${by.map((w) => w.name).join(', ')}`}>
                      {by.map((w) => (
                        <i key={w.id} title={w.name}>
                          {w.short}
                        </i>
                      ))}
                    </span>
                  </li>
                )
              })}
            </ul>
          </Reveal>
        ))}
      </ol>
    </section>
  )
}
