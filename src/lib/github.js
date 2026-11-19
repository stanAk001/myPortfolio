// Small cached wrappers around GitHub's public REST API (60 requests/hour per visitor, no token).
const TTL = 10 * 60 * 1000

async function cached(key, load) {
  try {
    const hit = JSON.parse(sessionStorage.getItem(key) ?? 'null')
    if (hit && Date.now() - hit.t < TTL) return hit.v
  } catch {
    /* storage unavailable, just fetch */
  }
  const v = await load()
  try {
    sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v }))
  } catch {
    /* over quota, that's fine */
  }
  return v
}

async function json(url) {
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
  if (!res.ok) throw new Error(res.status === 403 ? 'GitHub rate limit reached — try again in a bit' : `GitHub ${res.status}`)
  return res.json()
}

export const getUser = (u) => cached(`gh:user:${u}`, () => json(`https://api.github.com/users/${u}`))

export const getRepos = (u) =>
  cached(`gh:repos:${u}`, () => json(`https://api.github.com/users/${u}/repos?sort=pushed&per_page=8`))

export const getEvents = (u) =>
  cached(`gh:events:${u}`, async () => {
    const events = await json(`https://api.github.com/users/${u}/events/public?per_page=40`)
    return events
      .filter((e) => e.type === 'PushEvent')
      .flatMap((e) => (e.payload.commits ?? []).map((c) => ({ repo: e.repo.name, message: c.message.split('\n')[0], sha: c.sha, at: e.created_at })))
      .slice(0, 8)
  })

// Public contribution calendar (GitHub's own needs a token).
export const getContributions = (u) =>
  cached(`gh:contrib:${u}`, () => json(`https://github-contributions-api.jogruber.de/v4/${u}?y=last`))

export const getRepo = (o, r) => cached(`gh:repo:${o}/${r}`, () => json(`https://api.github.com/repos/${o}/${r}`))

export const getTree = (o, r, branch) =>
  cached(`gh:tree:${o}/${r}@${branch}`, async () => {
    const t = await json(`https://api.github.com/repos/${o}/${r}/git/trees/${branch}?recursive=1`)
    return t.tree
      .filter((n) => n.type === 'blob' && !/(^|\/)(node_modules|dist|build|\.next|coverage)\//.test(n.path) && !/\.(png|jpe?g|webp|gif|ico|mp4|woff2?|lock)$/i.test(n.path))
      .slice(0, 400)
      .map((n) => ({ path: n.path, size: n.size }))
  })

export const getCommits = (o, r) =>
  cached(`gh:commits:${o}/${r}`, () => json(`https://api.github.com/repos/${o}/${r}/commits?per_page=6`))

export async function getFile(o, r, branch, path) {
  const res = await fetch(`https://raw.githubusercontent.com/${o}/${r}/${branch}/${path}`)
  if (!res.ok) throw new Error(`Couldn’t load ${path}`)
  return res.text()
}

export function ago(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  const units = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [30, 'day'],
    [12, 'month'],
    [Infinity, 'year'],
  ]
  let v = s
  for (const [n, unit] of units) {
    if (v < n) return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-Math.round(v), unit)
    v /= n
  }
  return ''
}
