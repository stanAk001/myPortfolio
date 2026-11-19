import { useEffect, useRef, useState } from 'react'
import { site } from '../../data/site'
import { cx } from '../../utils'

/*
  The studio's call to action, styled like a video editor's export dialog. Tick the launch pieces
  you want, name the project, hit Render and it's sent to me as a brief. If a form service is set
  (site.contact.formEndpoint) it posts from the page; if not, it opens the visitor's email app with
  the brief filled in, same as the contact form. The render bar only fills while it's actually sending.
*/

const ITEMS = [
  { id: 'site', track: 'ui', name: 'Website or web app', spec: 'Designed and built, live on your domain' },
  { id: 'ad', track: 'motion', name: 'Product ad film · 16:9', spec: '30–60s, recorded on your real product' },
  { id: 'vertical', track: 'social', name: 'Vertical cut · 9:16', spec: 'For Reels, TikTok and Shorts' },
  { id: 'flyers', track: 'social', name: 'Flyer pack', spec: 'Pinterest and Instagram, one look' },
  { id: 'score', track: 'score', name: 'Original score', spec: 'Composed and mixed for your film' },
  { id: 'voice', track: 'voice', name: 'Script & voiceover', spec: 'Written to picture, voiced and timed' },
]
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const slug = (s) => s.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'your-project'

export default function LaunchKit({ cut, wanted }) {
  const endpoint = site.contact?.formEndpoint
  const [picked, setPicked] = useState(() => new Set(['site', 'ad']))
  const [form, setForm] = useState({ project: cut?.name ?? '', name: '', email: '', notes: '' })
  const [errors, setErrors] = useState({})
  const [state, setState] = useState('idle') // idle → rendering → sent | opened | failed
  const [progress, setProgress] = useState(0)
  const ref = useRef(null)

  // A track picked in the edit suite comes in already ticked.
  useEffect(() => {
    if (!wanted) return
    setPicked((p) => new Set([...p, ...ITEMS.filter((i) => i.track === wanted.track).map((i) => i.id)]))
  }, [wanted])

  const toggle = (id) =>
    setPicked((p) => {
      const n = new Set(p)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }))
  }

  const render = async (e) => {
    e.preventDefault()
    if (state === 'rendering') return
    const x = {}
    if (!picked.size) x.items = 'Pick at least one layer.'
    if (!form.name.trim()) x.name = 'Who should I reply to?'
    if (!EMAIL.test(form.email.trim())) x.email = 'I need a working email to reply to.'
    setErrors(x)
    const first = Object.keys(x)[0]
    if (first) {
      ref.current?.querySelector(`[name="${first}"]`)?.focus()
      return
    }

    const list = ITEMS.filter((i) => picked.has(i.id))
    const project = form.project.trim() || 'a new project'
    const subject = `Launch kit: ${project} — ${form.name.trim()}`
    const body = [
      `Project: ${project}`,
      '',
      'Layers wanted:',
      ...list.map((i) => `• ${i.name} — ${i.spec}`),
      '',
      form.notes.trim() || '(no notes)',
      '',
      `— ${form.name.trim()} (${form.email.trim()})`,
    ].join('\n')

    setState('rendering')
    setProgress(0)
    const fill = setInterval(() => setProgress((p) => Math.min(endpoint ? 0.9 : 1, p + 0.08)), 60)
    const done = (s) => {
      clearInterval(fill)
      setProgress(1)
      setTimeout(() => setState(s), 250)
    }
    if (!endpoint) {
      setTimeout(() => {
        window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        done('opened')
      }, 800)
      return
    }
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, kind: 'Launch kit', message: body, _subject: subject, _replyto: form.email }),
      })
      done(res.ok ? 'sent' : 'failed')
    } catch {
      done('failed')
    }
  }

  const file = `${slug(form.project)}_launch-kit_v1`

  return (
    <form ref={ref} className="lk" onSubmit={render} noValidate>
      <div className="lk__bar">
        <span className="lk__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="label">Export — {file}</span>
      </div>

      <div className="lk__body">
        <fieldset className="lk__formats">
          <legend className="label">Layers</legend>
          {ITEMS.map((i) => (
            <label key={i.id} className={cx('lk__item', picked.has(i.id) && 'is-on')}>
              <input type="checkbox" name="items" checked={picked.has(i.id)} onChange={() => toggle(i.id)} />
              <span className="lk__box" aria-hidden="true" />
              <span>
                <b>{i.name}</b>
                <small>{i.spec}</small>
              </span>
            </label>
          ))}
          {errors.items && <p className="lk__err">{errors.items}</p>}
        </fieldset>

        <div className="lk__output">
          <p className="label">Output</p>
          <label className="lk__field">
            <span>Project name</span>
            <input name="project" value={form.project} onChange={set('project')} placeholder="e.g. Mama’s Kitchen" autoComplete="off" />
          </label>
          <div className="lk__pair">
            <label className="lk__field">
              <span>Your name</span>
              <input name="name" value={form.name} onChange={set('name')} autoComplete="name" aria-invalid={!!errors.name} />
              {errors.name && <em className="lk__err">{errors.name}</em>}
            </label>
            <label className="lk__field">
              <span>Email</span>
              <input name="email" type="email" value={form.email} onChange={set('email')} autoComplete="email" aria-invalid={!!errors.email} />
              {errors.email && <em className="lk__err">{errors.email}</em>}
            </label>
          </div>
          <label className="lk__field">
            <span>Notes for the edit</span>
            <textarea name="notes" rows={3} value={form.notes} onChange={set('notes')} placeholder="What it is, who it’s for, when you’re launching." />
          </label>
          <p className="lk__dest label">Destination — {site.email}</p>

          <div className="lk__render">
            <div className="lk__meter" aria-hidden="true">
              <i style={{ transform: `scaleX(${progress})` }} />
            </div>
            <button type="submit" className="g-btn g-btn--solid" disabled={state === 'rendering'}>
              {state === 'rendering' ? `Rendering… ${Math.round(progress * 100)}%` : `Render · ${picked.size} layer${picked.size === 1 ? '' : 's'}`}
            </button>
          </div>
          <p className="lk__status" role="status">
            {state === 'sent' && 'Rendered and sent. I’ll reply within a day with a plan.'}
            {state === 'opened' && 'Your email app has the brief ready — press send there and it’s with me.'}
            {state === 'failed' && `That didn’t send. Email me directly at ${site.email}.`}
          </p>
        </div>
      </div>
    </form>
  )
}
