import { Reveal } from '../Motion/Reveal'
import './Chapter.css'

export default function Chapter({ number, children }) {
  return (
    <Reveal className="chapter label">
      <span className="chapter__no">({number})</span>
      <span>{children}</span>
      <span className="chapter__rule" aria-hidden="true" />
    </Reveal>
  )
}






