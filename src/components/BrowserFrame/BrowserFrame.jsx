import { hostOf } from '../../utils'
import './BrowserFrame.css'

export default function BrowserFrame({ url, label, children }) {
  const host = url ? hostOf(url) : null
  return (
    <div className="browser">
      <div className="browser__bar">
        <span className="browser__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="browser__url">
          <span className="browser__lock" aria-hidden="true" />
          {host ?? label}
        </span>
        {url ? (
          <a className="browser__open" href={url} target="_blank" rel="noreferrer">
            Open full site ↗
          </a>
        ) : (
          <span className="browser__open" aria-hidden="true" />
        )}
      </div>
      <div className="browser__view">{children}</div>
    </div>
  )
}
