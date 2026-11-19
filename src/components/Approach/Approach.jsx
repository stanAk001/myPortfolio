
import { Reveal } from '../Motion/Reveal'
import './Approach.css'

/*
  How a project gets made, as four stops on one line. The line draws in when it scrolls into view.
*/
const STAGES = [
  ['idea', 'Idea', 'A real problem, written down'],
  ['design', 'Design', 'Screens before code'],
  ['eng', 'Engineering', 'PERN, end to end'],
  ['live', 'Live product', 'On a real URL'],
]

export default function Approach() {
  return (
    <Reveal as="ol" className="appr" aria-label="How I build a product">
      <i className="appr__line" aria-hidden="true" />
      {STAGES.map(([id, name, note], i) => (
        <li key={id} style={{ '--i': i }}>
          <span className={`appr__mark is-${id}`} aria-hidden="true" />
          <b>{name}</b>
          <small>{note}</small>
        </li>
      ))}
    </Reveal>
  )
}





