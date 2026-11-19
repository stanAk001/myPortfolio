import { useEffect, useRef, useState } from 'react'
import { Link } from '../../router'
import Chapter from '../../components/Chapter/Chapter'
import { Lines, Reveal } from '../../components/Motion/Reveal'
import { confetti } from '../../lib/confetti'
import { tokenize } from '../../utils/highlight'
import { cx } from '../../utils'
import './BugHunt.css'

/*
  "Spot the bug": five small, real PERN mistakes. Click the broken line.
  Shows the kind of thing that gets caught before it ships.
*/
const ROUNDS = [
  {
    title: 'React — the counter only ever adds 1',
    lines: ['function Likes() {', '  const [likes, setLikes] = useState(0)', '  const likeTwice = () => {', '    setLikes(likes + 1)', '    setLikes(likes + 1)', '  }', '  return <button onClick={likeTwice}>{likes}</button>', '}'],
    bug: 4,
    fix: 'setLikes(n => n + 1) — use the updater form, or the second call reads the same stale value.',
  },
  {
    title: 'Express — anyone can delete any user',
    lines: ["router.delete('/users/:id', async (req, res) => {", '  await prisma.user.delete({', '    where: { id: Number(req.params.id) },', '  })', '  res.sendStatus(204)', '})'],
    bug: 0,
    fix: 'The route has no auth check. Add requireAuth (and an admin check) before the handler.',
  },
  {
    title: 'SQL — the search box is a security hole',
    lines: ['app.get("/search", async (req, res) => {', '  const q = req.query.q', '  const rows = await db.query(', "    `SELECT * FROM tools WHERE name LIKE '%${q}%'`", '  )', '  res.json(rows)', '})'],
    bug: 3,
    fix: 'SQL injection. Pass q as a parameter ($1) instead of pasting it into the query string.',
  },
  {
    title: 'React — the list flickers and loses input focus',
    lines: ['function Todos({ items }) {', '  return (', '    <ul>', '      {items.map((item) => (', '        <Todo key={Math.random()} item={item} />', '      ))}', '    </ul>', '  )', '}'],
    bug: 4,
    fix: 'A random key remounts every row on every render. Use a stable id: key={item.id}.',
  },
  {
    title: 'Node — the page never loads',
    lines: ['app.get("/profile", async (req, res) => {', '  const user = await getUser(req.user.id)', '  if (!user) {', '    res.status(404).json({ error: "Not found" })', '  }', '  res.json(user)', '})'],
    bug: 3,
    fix: 'Missing return — it sends the 404 then tries to send again ("headers already sent"). Use return res.status(404)…',
  },
]

const VERDICTS = [
  [5, 'Flawless. You should be reviewing my pull requests.'],
  [4, 'Sharp eyes — that’s production-ready reviewing.'],
  [3, 'Solid. Those last ones are sneaky.'],
  [1, 'Good start — these are the bugs that hide in real code.'],
  [0, 'Tricky, right? That’s why I test before I ship.'],
]

export default function BugHunt() {
  const [round, setRound] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [started, setStarted] = useState(false)
  const [time, setTime] = useState(0)
  const board = useRef(null)
  const r = ROUNDS[round]

  useEffect(() => {
    if (!started || done) return
    const id = setInterval(() => setTime((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [started, done])

  const pick = (i) => {
    if (picked !== null || done) return
    setStarted(true)
    setPicked(i)
    if (i === r.bug) setScore((s) => s + 1)
  }

  const next = () => {
    if (round === ROUNDS.length - 1) {
      setDone(true)
      if (score === ROUNDS.length) {
        const b = board.current.getBoundingClientRect()
        confetti(b.left + b.width / 2, b.top + b.height / 3, 120)
      }
      return
    }
    setRound(round + 1)
    setPicked(null)
  }

  const restart = () => {
    setRound(0)
    setPicked(null)
    setScore(0)
    setDone(false)
    setStarted(false)
    setTime(0)
  }

  const verdict = VERDICTS.find(([min]) => score >= min)[1]

  return (
    <section id="play" className="bh section theme-dark" data-component="BugHunt" aria-labelledby="bh-title">
      <Chapter number="play">Take a break</Chapter>
      <div className="bh__head">
        <Reveal as="h2" lines id="bh-title" className="bh__title display">
          <Lines lines={['Spot the', <em key="b">bug.</em>]} />
        </Reveal>
        <Reveal as="p" className="bh__intro lead" delay={150}>
          Five real mistakes I watch for before anything ships. Click the line you think is broken.
        </Reveal>
      </div>

      <Reveal className="bh__board">
        <div ref={board} className="bh__frame">
          <div className="bh__bar">
            <span className="bh__dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="bh__progress" aria-label={`Round ${round + 1} of ${ROUNDS.length}`}>
              {ROUNDS.map((_, i) => (
                <i key={i} className={cx(i < round && 'is-done', i === round && !done && 'is-on')} />
              ))}
            </span>
            <span className="bh__score label">
              Score <b>{score}</b>/{ROUNDS.length} · {time}s
            </span>
          </div>

          {!done ? (
            <div className="bh__round" key={round}>
              <p className="bh__task">
                <span className="label">Bug {round + 1}</span> {r.title}
              </p>
              <pre className="bh__code" role="list" aria-label="Code — choose the buggy line">
                {r.lines.map((line, i) => {
                  const state = picked === null ? null : i === r.bug ? 'bug' : i === picked ? 'wrong' : null
                  return (
                    <button key={i} type="button" role="listitem" className={cx('bh__line', state && `is-${state}`)} onClick={() => pick(i)} disabled={picked !== null}>
                      <span className="bh__no">{i + 1}</span>
                      <span className="bh__src">
                        {tokenize(line).map(([t, c], j) => (
                          <span key={j} className={c ? `t-${c}` : undefined}>
                            {t}
                          </span>
                        ))}
                      </span>
                      {state === 'bug' && <span className="bh__tag">🐞 bug</span>}
                    </button>
                  )
                })}
              </pre>
              <div className={cx('bh__result', picked !== null && 'is-on')} aria-live="polite">
                {picked !== null && (
                  <>
                    <p className={picked === r.bug ? 'is-right' : 'is-wrong'}>{picked === r.bug ? '✓ Got it.' : '✗ Not quite — it’s highlighted.'}</p>
                    <p className="bh__fix">
                      <b>Fix:</b> {r.fix}
                    </p>
                    <button type="button" className="btn btn--solid" onClick={next}>
                      {round === ROUNDS.length - 1 ? 'See my score' : 'Next bug →'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bh__end">
              <p className="bh__big display">
                {score}
                <span>/{ROUNDS.length}</span>
              </p>
              <p className="bh__verdict">{verdict}</p>
              <p className="label">Finished in {time} seconds</p>
              <div className="bh__end-ctas">
                <button type="button" className="btn" onClick={restart}>
                  Play again
                </button>
                <Link className="btn btn--solid" to="/work#plan">
                  Let’s build something bug-free →
                </Link>
              </div>
            </div>
          )}
        </div>
      </Reveal>
    </section>
  )
}
