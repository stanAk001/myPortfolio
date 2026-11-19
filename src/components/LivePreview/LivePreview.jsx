import { useState } from 'react'
import BrowserFrame from '../BrowserFrame/BrowserFrame'
import { hostOf } from '../../utils'
import './LivePreview.css'

// Only load the live site when asked. An iframe is a whole second website's worth of JS.
export default function LivePreview({ project }) {
  const [state, setState] = useState('idle') // idle → loading → ready
  const host = hostOf(project.liveUrl)

  return (
    <div className="live">
      <div className="live__head">
        <p className="label">Live — the real site, running inside this page</p>
        <p className="label live__hint">Scroll, click, search. It’s production.</p>
      </div>
      <BrowserFrame url={project.liveUrl} label={project.title}>
        <div className="live__view" data-state={state}>
          {state !== 'idle' && (
            <iframe
              src={project.liveUrl}
              title={`${project.title} — live site`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => setTimeout(() => setState('ready'), 600)}
            />
          )}
          {state !== 'ready' && (
            <button type="button" className="live__start" onClick={() => setState('loading')} disabled={state === 'loading'} data-cursor="open">
              {state === 'idle' ? (
                <>
                  <span className="live__poster" style={{ backgroundImage: `url(${project.image.src})` }} aria-hidden="true" />
                  <span className="live__badge label">
                    The real site
                  </span>
                  <span className="live__cta">Load {host} here</span>
                </>
              ) : (
                <span className="live__connecting label">
                  Opening {host}…
                </span>
              )}
            </button>
          )}
        </div>
      </BrowserFrame>
    </div>
  )
}
