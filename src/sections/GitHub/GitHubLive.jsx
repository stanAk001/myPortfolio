import { useEffect, useRef, useState } from 'react'
import { github } from '../../data/site'
import { ago, getContributions, getEvents, getRepos, getUser } from '../../lib/github'
import Chapter from '../../components/Chapter/Chapter'
import { Lines, Reveal } from '../../components/Motion/Reveal'
import { useInView } from '../../hooks/useInView'
import './GitHubLive.css'

// Only renders once a GitHub username is set in admin. Everything here is fetched live.
export default function GitHubLive() {
  const username = github?.username
  const root = useRef(null)
  const near = useInView(root, '600px 0px')
  const [data, setData] = useState({})
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!username || !near || data.user) return
    Promise.allSettled([getUser(username), getRepos(username), getEvents(username), getContributions(username)]).then(([u, r, e, c]) => {
      if (u.status === 'rejected') return setError(u.reason.message)
      setData({
        user: u.value,
        repos: r.status === 'fulfilled' ? r.value.filter((x) => !x.fork).slice(0, 6) : [],
        commits: e.status === 'fulfilled' ? e.value : [],
        days: c.status === 'fulfilled' ? c.value.contributions : null,
        total: c.status === 'fulfilled' ? Object.values(c.value.total ?? {})[0] : null,
      })
    })
  }, [username, near, data.user])

  if (!username) return null

  const weeks = []
  if (data.days) {
    const days = data.days.slice(-371)
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  }

  return (
    <section ref={root} id="code" className="gh section theme-dark" data-component="GitHubLive" aria-labelledby="gh-title">
      <Chapter number="live">Live from GitHub</Chapter>
      <div className="gh__head grid">
        <Reveal as="h2" lines id="gh-title" className="gh__title display">
          <Lines lines={['Don’t take my', <em key="w">word for it.</em>]} />
        </Reveal>
        <Reveal className="gh__who" delay={150}>
          {data.user ? (
            <a href={data.user.html_url} target="_blank" rel="noreferrer" className="gh__profile">
              <img src={data.user.avatar_url} alt="" width="56" height="56" />
              <span>
                <b>@{data.user.login}</b>
                <small>
                  {data.user.public_repos} public repos · {data.user.followers} followers
                </small>
              </span>
            </a>
          ) : (
            <p className="label">{error ?? 'Loading from GitHub…'}</p>
          )}
        </Reveal>
      </div>

      {weeks.length > 0 && (
        <Reveal className="gh__cal">
          <div className="gh__grid" role="img" aria-label={`${data.total ?? 'Many'} contributions in the last year`}>
            {weeks.map((w, i) => (
              <span className="gh__week" key={i}>
                {w.map((d) => (
                  <i key={d.date} data-level={d.level} title={`${d.count} on ${d.date}`} />
                ))}
              </span>
            ))}
          </div>
          {data.total != null && <p className="label gh__total">{data.total} contributions in the last year</p>}
        </Reveal>
      )}

      <div className="gh__cols">
        {data.commits?.length > 0 && (
          <Reveal className="gh__commits">
            <p className="label">Latest commits</p>
            <ul>
              {data.commits.map((c) => (
                <li key={c.sha}>
                  <a href={`https://github.com/${c.repo}/commit/${c.sha}`} target="_blank" rel="noreferrer">
                    <code>{c.sha.slice(0, 7)}</code>
                    <span>{c.message}</span>
                    <small>
                      {c.repo.split('/')[1]} · {ago(c.at)}
                    </small>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
        {data.repos?.length > 0 && (
          <Reveal className="gh__repos" delay={120}>
            <p className="label">Recently pushed</p>
            <ul>
              {data.repos.map((r) => (
                <li key={r.id}>
                  <a href={r.html_url} target="_blank" rel="noreferrer">
                    <b>{r.name}</b>
                    {r.description && <span>{r.description}</span>}
                    <small>
                      {r.language && <em>{r.language}</em>} ★ {r.stargazers_count} · updated {ago(r.pushed_at)}
                    </small>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>
    </section>
  )
}
