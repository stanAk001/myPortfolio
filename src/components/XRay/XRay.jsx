import { useEffect, useState } from 'react'
import { useXRay, xray } from './store'
import './XRay.css'

/*
  Press X and the page shows its own skeleton: the grid, every component's outline and name.
  The point of the site ("I build the system behind the interface"), shown literally.
*/
export default function XRay() {
  const on = useXRay()
  const [count, setCount] = useState(0)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key?.toLowerCase() !== 'x' || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return
      xray.toggle()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (on) setCount(document.querySelectorAll('[data-component]').length)
  }, [on])

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {on ? 'X-ray on: showing the layout grid and component outlines. Press X to turn it off.' : ''}
      </p>
      {on && (
        <div className="xray" aria-hidden="true">
          <div className="xray__cols">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} />
            ))}
          </div>
          <div className="xray__scan" />
          <p className="xray__readout">
            X-ray · {count} components · 12-col grid · press X to exit
          </p>
        </div>
      )}
    </>
  )
}
