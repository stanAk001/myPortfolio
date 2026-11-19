import { useCallback, useState } from 'react'
import { cx } from '../../utils'

// One observer for the whole page instead of one per element.
let observer
const onShown = new WeakMap()
function getObserver() {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-in')
        onShown.get(entry.target)?.()
        observer.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  )
  return observer
}

// `shown` (optional) is called once the element is revealed, so the component can keep `is-in`
// in its own className. Otherwise any re-render that changes className would drop it.
export function useReveal(shown) {
  return useCallback(
    (node) => {
      if (!node) return
      if (shown) onShown.set(node, shown)
      getObserver().observe(node)
      return () => getObserver().unobserve(node)
    },
    [shown],
  )
}

export function Reveal({ as: Tag = 'div', className, delay = 0, lines = false, style, children, ...rest }) {
  const [shown, setShown] = useState(false)
  const show = useCallback(() => setShown(true), [])
  const ref = useReveal(show)
  return (
    <Tag
      ref={ref}
      className={cx(lines ? 'reveal-lines' : 'reveal', className, shown && 'is-in')}
      style={delay ? { '--d': `${delay}ms`, ...style } : style}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export function Lines({ lines }) {
  return lines.map((line, i) => (
    <span className="line" key={i}>
      <span style={{ '--i': i }}>{line}</span>
    </span>
  ))
}
