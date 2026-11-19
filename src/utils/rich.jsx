// Copy lives in plain .js data files, so emphasis is written as *word* and turned into <em> here.
export function rich(text) {
  return text.split(/(\*[^*]+\*)/g).map((part, i) =>
    part.length > 2 && part.startsWith('*') && part.endsWith('*') ? <em key={i}>{part.slice(1, -1)}</em> : part,
  )
}
