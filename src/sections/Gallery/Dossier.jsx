import { Link } from '../../router'
import { hostOf } from '../../utils'
import Headline from './Headline'
import { Here } from './Human'
import Timeline from './Timeline'
import './Dossier.css'

/*
  Left side of the first screen: the availability line (where he is, local time), one headline
  whose verbs act themselves out (see Headline), the work as an edit you can play and cut (see
  Timeline), and under it the current product in one sentence with links.
*/
const Status = () => <Here className="ds__status" />

export default function Dossier({ projects, index, onPick, onAdvance, onRoll, running, slide }) {
  const q = projects[index]
  return (
    <div className="ds">
      <p className="ds__top label">
        <Status />
      </p>

      <Headline project={q} />

      <Timeline projects={projects} index={index} onPick={onPick} onAdvance={onAdvance} onRoll={onRoll} running={running} slide={slide} />

      <div className="tl__more">
        <p>
          <span key={q.id}>{q.plain}</span>
        </p>
        <div className="ds__actions">
          <Link to={`/work/${q.id}`} className="ds__go is-main" data-cursor="explore">
            Explore {q.title} <span aria-hidden="true">↗</span>
          </Link>
          {q.liveUrl && (
            <a href={q.liveUrl} target="_blank" rel="noreferrer" className="ds__go">
              Visit live <span aria-hidden="true">↗</span>
              <span className="sr-only"> — {hostOf(q.liveUrl)}, new tab</span>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
