// A tiny syntax highlighter, enough for JS, JSX, Prisma and shell lines, with no dependency.
const RULES = [
  [/\/\/.*/y, 'cm'],
  [/(['"`])(?:\\.|(?!\1).)*\1/y, 'st'],
  [/@[\w.]+(\([^)]*\))?/y, 'at'],
  [/\b(export|function|return|const|let|async|await|import|from|model|new|if|else)\b/y, 'kw'],
  [/\b(Int|String|Float|Boolean|DateTime)\b(\[\])?/y, 'ty'],
  [/<\/?[A-Za-z][\w.]*|(?<!=)\/?>/y, 'tg'],
  [/\b\d+(\.\d+)?\b/y, 'nu'],
  [/^\$|✔|→/y, 'pr'],
]

export function tokenize(line) {
  const out = []
  let plain = ''
  let i = 0
  while (i < line.length) {
    let hit = null
    for (const [re, cls] of RULES) {
      re.lastIndex = i
      const m = re.exec(line)
      if (m && m[0].length) {
        hit = [m[0], cls]
        break
      }
    }
    if (hit) {
      if (plain) out.push([plain, null])
      plain = ''
      out.push(hit)
      i += hit[0].length
    } else {
      plain += line[i++]
    }
  }
  if (plain) out.push([plain, null])
  return out
}
