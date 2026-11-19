import { useEffect, useMemo, useState } from 'react'
import { ago, getCommits, getFile, getRepo, getTree } from '../../lib/github'
import { tokenize } from '../../utils/highlight'
import { cx } from '../../utils'
import './CodeViewer.css'

// Files worth opening first, in this order. They show how the project fits together.
const PREFERRED = ['package.json', 'server/index.js', 'server/app.js', 'src/App.jsx', 'src/main.jsx', 'prisma/schema.prisma', 'README.md']

/*
  Reads a public GitHub repo directly: file tree, file contents, recent commits. So a reviewer can
  read the real code without leaving the case study.
*/
export default function CodeViewer({ owner, repo }) {
  const [meta, setMeta] = useState(null)
  const [tree, setTree] = useState([])
  const [commits, setCommits] = useState([])
  const [path, setPath] = useState(null)
  const [source, setSource] = useState('')
  const [filter, setFilter] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    getRepo(owner, repo)
      .then(async (m) => {
        if (!alive) return
        setMeta(m)
        const [t, c] = await Promise.all([getTree(owner, repo, m.default_branch), getCommits(owner, repo).catch(() => [])])
        if (!alive) return
        setTree(t)
        setCommits(c)
        setPath(PREFERRED.find((p) => t.some((n) => n.path === p)) ?? t[0]?.path ?? null)
      })
      .catch((e) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [owner, repo])

  useEffect(() => {
    if (!meta || !path) return
    let alive = true
    setSource('')
    getFile(owner, repo, meta.default_branch, path)
      .then((s) => alive && setSource(s.length > 120000 ? s.slice(0, 120000) + '\n… (truncated)' : s))
      .catch((e) => alive && setSource(`// ${e.message}`))
    return () => {
      alive = false
    }
  }, [owner, repo, meta, path])

  const files = useMemo(() => tree.filter((n) => n.path.toLowerCase().includes(filter.toLowerCase())), [tree, filter])
  const lines = useMemo(() => source.split('\n').map((l) => tokenize(l)), [source])

  if (error) {
    return (
      <p className="cv__error label">
        Couldn’t read {owner}/{repo} — {error}. Is the repo public?
      </p>
    )
  }

  return (
    <div className="cv">
      <div className="cv__bar">
        <a href={`https://github.com/${owner}/${repo}`} target="_blank" rel="noreferrer">
          {owner}/<b>{repo}</b> ↗
        </a>
        {meta && (
          <span className="label">
            {meta.default_branch} · ★ {meta.stargazers_count} · updated {ago(meta.pushed_at)}
          </span>
        )}
      </div>
      <div className="cv__body">
        <nav className="cv__tree" aria-label="Files">
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter files…" aria-label="Filter files" />
          <ul>
            {files.map((f) => (
              <li key={f.path}>
                <button type="button" className={cx(f.path === path && 'is-on')} onClick={() => setPath(f.path)} title={f.path}>
                  <span className="cv__dir">{f.path.includes('/') ? f.path.slice(0, f.path.lastIndexOf('/') + 1) : ''}</span>
                  {f.path.split('/').pop()}
                </button>
              </li>
            ))}
            {tree.length === 0 && <li className="cv__empty label">Loading files…</li>}
          </ul>
        </nav>
        <div className="cv__file">
          <p className="cv__path label">{path ?? '—'}</p>
          <pre className="code cv__code">
            {source
              ? lines.map((tokens, i) => (
                  <span className="code__ln" key={i}>
                    <span className="code__no">{i + 1}</span>
                    {tokens.map(([t, c], j) => (
                      <span key={j} className={c ? `t-${c}` : undefined}>
                        {t}
                      </span>
                    ))}
                  </span>
                ))
              : 'Loading…'}
          </pre>
        </div>
      </div>
      {commits.length > 0 && (
        <ul className="cv__commits">
          {commits.map((c) => (
            <li key={c.sha}>
              <a href={c.html_url} target="_blank" rel="noreferrer">
                <code>{c.sha.slice(0, 7)}</code> {c.commit.message.split('\n')[0]}
                <small>{ago(c.commit.author.date)}</small>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
