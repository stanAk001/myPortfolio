import { useEffect, useRef, useState } from 'react'
import { projects, statusLabel } from '../../data/projects'
import { site } from '../../data/site'
import { technologies } from '../../data/stack'
import { useReducedMotion } from '../../hooks/useMedia'
import { hostOf } from '../../utils'
import { ping } from '../../lib/uptime'
import './Terminal.css'

const PROMPT = 'akeem@portfolio:~$'

const find = (name = '') => projects.find((p) => p.id === name.toLowerCase() || p.title.toLowerCase() === name.toLowerCase())

// Each command returns lines; a line is a string or { text, tone, href }.
const COMMANDS = {
  help: () => [
    'Available commands:',
    { text: '  whoami          who you are talking to', tone: 'dim' },
    { text: '  projects        what I have shipped', tone: 'dim' },
    { text: '  stack           what I build with', tone: 'dim' },
    { text: '  ping <project>  check a live site from your browser', tone: 'dim' },
    { text: '  open <project>  open a live site in a new tab', tone: 'dim' },
    { text: '  contact         how to reach me', tone: 'dim' },
    { text: '  clear           clear the screen', tone: 'dim' },
  ],
  whoami: () => [`${site.name} — ${site.role.toLowerCase()}.`, 'React on the front, Node on the back, PostgreSQL underneath, Vercel on top.'],
  projects: () =>
    projects.flatMap((p) => [
      { text: `${p.number}  ${p.title.padEnd(15)}${statusLabel(p).padEnd(10)}${p.liveUrl ? hostOf(p.liveUrl) : ''}`, href: p.liveUrl },
    ]),
  ls: () => COMMANDS.projects(),
  stack: () => [...new Set(technologies.map((t) => t.group))].map((g) => `${g.padEnd(10)}${technologies.filter((t) => t.group === g).map((t) => t.name).join(', ')}`),
  contact: () => [{ text: site.email, href: `mailto:${site.email}` }, ...site.socials.filter((s) => s.url).map((s) => ({ text: `${s.label.padEnd(10)}${s.url}`, href: s.url }))],
  date: () => [new Date().toString()],
  echo: (args) => [args.join(' ')],
  open: (args) => {
    const p = find(args[0])
    if (!p?.liveUrl) return [{ text: `open: no live site called “${args[0] ?? ''}”. Try: ${projects.map((x) => x.id).join(', ')}`, tone: 'err' }]
    window.open(p.liveUrl, '_blank', 'noopener')
    return [`Opening ${hostOf(p.liveUrl)} …`]
  },
  sudo: (args) =>
    args.join(' ') === 'hire akeem'
      ? [{ text: 'Permission granted. Opening your mail client…', tone: 'ok' }, () => (window.location.href = `mailto:${site.email}`)]
      : [{ text: 'Nice try. (Try: sudo hire akeem)', tone: 'err' }],
}

// `extra` adds or overrides commands, e.g. a version of `open` that opens a window instead of a tab.
export default function Terminal({ extra }) {
  const reduced = useReducedMotion()
  const [lines, setLines] = useState([{ text: `Last login: ${new Date().toDateString()} — type “help” to look around.`, tone: 'dim' }])
  const [value, setValue] = useState('')
  const [history, setHistory] = useState([])
  const [cursor, setCursor] = useState(-1)
  const [busy, setBusy] = useState(false)
  const root = useRef(null)
  const screen = useRef(null)
  const inputRef = useRef(null)
  const greeted = useRef(false)

  const print = (out) =>
    setLines((l) => [...l, ...out.filter((o) => typeof o !== 'function').map((o) => (typeof o === 'string' ? { text: o } : o))])

  const execute = async (raw) => {
    const [cmd, ...args] = raw.trim().split(/\s+/)
    setLines((l) => [...l, { text: `${PROMPT} ${raw}`, tone: 'cmd' }])
    if (!cmd) return
    setHistory((h) => [raw, ...h].slice(0, 30))
    if (cmd === 'clear') return setLines([])
    if (cmd === 'ping') {
      const p = find(args[0])
      if (!p?.liveUrl) return print([{ text: `ping: unknown project “${args[0] ?? ''}”. Try: ${projects.map((x) => x.id).join(', ')}`, tone: 'err' }])
      setBusy(true)
      print([`PING ${hostOf(p.liveUrl)} …`])
      const res = await ping(p.liveUrl)
      print([
        res.ok
          ? { text: `reply from ${hostOf(p.liveUrl)}: time=${res.ms}ms — live`, tone: 'ok' }
          : { text: `${hostOf(p.liveUrl)}: no reply within 8s`, tone: 'err' },
      ])
      return setBusy(false)
    }
    const fn = extra?.[cmd] ?? COMMANDS[cmd]
    if (!fn) return print([{ text: `command not found: ${cmd}. Type “help”.`, tone: 'err' }])
    const out = fn(args)
    print(out)
    out.filter((o) => typeof o === 'function').forEach((f) => setTimeout(f, 700))
  }

  // Types `whoami` on its own the first time the terminal scrolls into view.
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || greeted.current) return
        greeted.current = true
        io.disconnect()
        if (reduced) return execute('whoami')
        const word = 'whoami'
        let i = 0
        const id = setInterval(() => {
          i++
          setValue(word.slice(0, i))
          if (i === word.length) {
            clearInterval(id)
            setTimeout(() => {
              setValue('')
              execute(word)
            }, 350)
          }
        }, 110)
      },
      { threshold: 0.5 },
    )
    io.observe(root.current)
    return () => io.disconnect()
  }, [reduced]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    screen.current?.scrollTo({ top: screen.current.scrollHeight })
  }, [lines])

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (busy) return
      const raw = value
      setValue('')
      setCursor(-1)
      execute(raw)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(cursor + 1, history.length - 1)
      if (history[next] !== undefined) {
        setCursor(next)
        setValue(history[next])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = cursor - 1
      setCursor(Math.max(next, -1))
      setValue(next < 0 ? '' : history[next])
    } else if (e.key === 'Tab') {
      // Tab-complete commands first, then project names.
      const parts = value.split(' ')
      const pool = parts.length === 1 ? [...new Set([...Object.keys(extra ?? {}), ...Object.keys(COMMANDS), 'ping', 'clear'])] : projects.map((p) => p.id)
      const hit = pool.find((c) => c.startsWith(parts.at(-1)) && parts.at(-1))
      if (hit) {
        e.preventDefault()
        parts[parts.length - 1] = hit
        setValue(parts.join(' ') + (parts.length === 1 ? ' ' : ''))
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setLines([])
    }
  }

  return (
    <div ref={root} className="term" data-component="Terminal" onClick={() => inputRef.current?.focus({ preventScroll: true })}>
      <div className="term__bar">
        <span className="term__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>zsh — akeem@portfolio</span>
        <span className="label">try: help</span>
      </div>
      <div ref={screen} className="term__screen" role="log" aria-live="polite" aria-label="Terminal output">
        {lines.map((l, i) => (
          <p key={i} className={`term__line term__line--${l.tone ?? 'out'}`}>
            {l.href ? (
              <a href={l.href} target={l.href.startsWith('mailto') ? undefined : '_blank'} rel="noreferrer">
                {l.text}
              </a>
            ) : (
              l.text
            )}
          </p>
        ))}
        <label className="term__input">
          <span className="term__prompt">{PROMPT}</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck="false"
            autoComplete="off"
            autoCapitalize="off"
            aria-label="Terminal command"
          />
        </label>
      </div>
    </div>
  )
}
