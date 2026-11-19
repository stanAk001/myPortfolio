/*
  Splits text into words and letters for per-letter animation. Screen readers get the plain
  sentence; the spans are hidden from them. Takes a string or rich() output (strings and <em>s).
*/
function splitString(text, keyBase, charClass) {
  return text.split(/(\s+)/).map((word, w) => {
    if (/^\s+$/.test(word)) return ' '
    if (!word) return null
    return (
      <span className="split__word" key={`${keyBase}-${w}`}>
        {[...word].map((ch, c) => (
          <span className={charClass} key={c}>
            {ch}
          </span>
        ))}
      </span>
    )
  })
}

const plain = (node) => (typeof node === 'string' ? node : node?.props?.children ?? '')

export default function Split({ children, className = 'split__char' }) {
  const parts = Array.isArray(children) ? children : [children]
  const label = parts.map(plain).join('')
  return (
    <>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">
        {parts.map((part, i) =>
          typeof part === 'string' ? (
            splitString(part, i, className)
          ) : (
            <em key={i}>{splitString(plain(part), `em${i}`, className)}</em>
          ),
        )}
      </span>
    </>
  )
}
