import { useEffect, useRef, useState } from 'react'
import { site } from '../../data/site'
import { Reveal } from '../../components/Motion/Reveal'
import { cx } from '../../utils'
import Phone from './Phone'
import { useVisitorName } from '../../lib/visitor'
import Scribble from '../../components/Scribble/Scribble'
import './Contact.css'

const KINDS = ['Website', 'Web app', 'Online store', 'Something else']
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/*
  The contact section. Headline and email on the left; on the right, Akeem's phone. Its apps are the
  ways to reach him and its Mail app is the brief. If a form service is set in content.json
  (site.contact.formEndpoint, e.g. a Formspree URL) the brief sends from the page. Otherwise Send
  opens the visitor's email app with the message already written, so nothing gets lost or faked.
*/
// compact: just the brief and the direct contact links, for the old desktop's Mail window.
export default function Contact({ compact = false }) {
  const endpoint = site.contact?.formEndpoint
  const [copied, setCopied] = useState(false)
  // Pre-fill the name they typed on the welcome page.
  const visitor = useVisitorName()
  const [form, setForm] = useState(() => ({ kind: KINDS[0], name: visitor, email: '', message: '' }))
  const [errors, setErrors] = useState({})
  const [state, setState] = useState('idle') // idle → sending → sent | opened | failed
  const formRef = useRef(null)
  const [composing, setComposing] = useState(false) // the phone's Mail app is open
  // "I need this" from a before/after: the phone opens a new message that's already started.
  useEffect(() => {
    const fill = (e) => {
      const { kind, message } = e.detail ?? {}
      setForm((f) => ({ ...f, kind: KINDS.includes(kind) ? kind : f.kind, message: message ?? f.message }))
      setState('idle')
      setComposing(true)
      setTimeout(() => formRef.current?.querySelector('[name="name"]')?.focus({ preventScroll: true }), 900)
    }
    window.addEventListener('brief:prefill', fill)
    return () => window.removeEventListener('brief:prefill', fill)
  }, [])
  const socials = site.socials.filter((s) => s.url)
  const headline = site.contact.headline.map((l) => l.replaceAll('*', ''))

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      window.location.href = `mailto:${site.email}`
    }
  }

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }))
  }

  const check = () => {
    const x = {}
    if (!form.name.trim()) x.name = 'Tell me who you are.'
    if (!EMAIL.test(form.email.trim())) x.email = 'I need a working email to reply to.'
    if (form.message.trim().length < 10) x.message = 'A sentence or two about the project, please.'
    setErrors(x)
    const first = Object.keys(x)[0]
    if (first) formRef.current?.querySelector(`[name="${first}"]`)?.focus()
    return !first
  }

  const submit = async (e) => {
    e.preventDefault()
    if (state === 'sending' || !check()) return
    const subject = `New project: ${form.kind} — ${form.name.trim()}`
    if (!endpoint) {
      const body = `${form.message.trim()}\n\n— ${form.name.trim()} (${form.email.trim()})\nType of project: ${form.kind}`
      window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      setState('opened')
      return
    }
    setState('sending')
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...form, _subject: subject, _replyto: form.email }),
      })
      setState(res.ok ? 'sent' : 'failed')
    } catch {
      setState('failed')
    }
  }

  const reset = () => {
    setForm({ kind: KINDS[0], name: visitor, email: '', message: '' })
    setState('idle')
  }

  const field = (key, label, props = {}) => (
    <div className={cx('ct__field', errors[key] && 'has-error')}>
      {props.rows ? (
        <textarea id={`ct-${key}`} name={key} value={form[key]} onChange={set(key)} placeholder=" " aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `ct-${key}-err` : undefined} {...props} />
      ) : (
        <input id={`ct-${key}`} name={key} value={form[key]} onChange={set(key)} placeholder=" " aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `ct-${key}-err` : undefined} {...props} />
      )}
      <label htmlFor={`ct-${key}`}>{label}</label>
      <span className="ct__bar" aria-hidden="true" />
      {errors[key] && (
        <p id={`ct-${key}-err`} className="ct__err">
          {errors[key]}
        </p>
      )}
    </div>
  )

  const done = state === 'sent' || state === 'opened'

  // The brief, as the phone's Mail app: a new message to Akeem.
  const err = (key) =>
    errors[key] && (
      <p id={`pc-${key}-err`} className="pc__err">
        {errors[key]}
      </p>
    )
  const composeScreen = done ? (
    <div className="pc pc--sent" role="status">
      <span className="pc__tick" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M5 12.5l4.2 4.2L19 7" />
        </svg>
      </span>
      <h3>{state === 'sent' ? 'Sent.' : 'Ready in your email app.'}</h3>
      <p>{state === 'sent' ? `I’ll reply to ${form.email.trim()} soon.` : `It’s written and addressed to me. Press send there and it’s on its way.`}</p>
      <button
        type="button"
        className="pc__done"
        onClick={() => {
          reset()
          setComposing(false)
        }}
      >
        Done
      </button>
    </div>
  ) : (
    <form ref={formRef} className="pc" onSubmit={submit} noValidate aria-label="A new message to Akeem">
      <div className="pc__head">
        <button type="button" className="pc__cancel" onClick={() => setComposing(false)}>
          Cancel
        </button>
        <b>New Message</b>
        <button type="submit" className={cx('pc__send', state === 'sending' && 'is-sending')} disabled={state === 'sending'} aria-label="Send the message">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 19V5M6 11l6-6 6 6" />
          </svg>
        </button>
      </div>
      <p className="pc__row">
        <span>To:</span>
        <b className="pc__to">Akeem</b>
      </p>
      <div className="pc__row pc__kinds" role="radiogroup" aria-label="What are we building?">
        {KINDS.map((k) => (
          <label key={k} className={cx('pc__kind', form.kind === k && 'is-on')}>
            <input type="radio" name="kind" value={k} checked={form.kind === k} onChange={set('kind')} />
            {k}
          </label>
        ))}
      </div>
      <label className={cx('pc__row', errors.name && 'has-error')}>
        <span>From:</span>
        <input name="name" value={form.name} onChange={set('name')} placeholder="Your name" autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'pc-name-err' : undefined} />
      </label>
      {err('name')}
      <label className={cx('pc__row', errors.email && 'has-error')}>
        <span>Reply to:</span>
        <input name="email" type="email" inputMode="email" value={form.email} onChange={set('email')} placeholder="you@company.com" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'pc-email-err' : undefined} />
      </label>
      {err('email')}
      <textarea
        name="message"
        className={cx('pc__body', errors.message && 'has-error')}
        value={form.message}
        onChange={set('message')}
        placeholder="Tell me about it…"
        aria-label="Tell me about it"
        aria-invalid={Boolean(errors.message)}
        aria-describedby={errors.message ? 'pc-message-err' : undefined}
      />
      {err('message')}
      <p className="pc__foot">
        {state === 'failed' ? `Couldn’t send just now. Email ${site.email} and I’ll pick it up.` : endpoint ? 'Goes straight to my inbox.' : 'Send opens your email app with this written.'}
      </p>
    </form>
  )

  return (
    <section
      id={compact ? undefined : 'contact'}
      className={cx('ct tone-ink', compact && 'ct--compact')}
      data-component="Contact"
      aria-labelledby={compact ? undefined : 'ct-title'}
      aria-label={compact ? 'Contact Akeem' : undefined}
    >
      {!compact && <span className="ct__tear" aria-hidden="true" />}
      {!compact && <span className="bgword" aria-hidden="true">CREATE</span>}
      <div className="ct__grid">
        <div className="ct__left">
          {!compact && (
            <>
              <p className="g-meta label">
                <span className="g-square" aria-hidden="true" />
                Contact
              </p>
              <Reveal as="h2" lines id="ct-title" className="ct__title ap-title">
                {headline.map((l, i) => (
                  <span className="line" key={l}>
                    <span className={cx(i > 0 && 'g-thin')}>{l}</span>
                  </span>
                ))}
              </Reveal>
              <p className="ct__lede">Tap Mail on my phone to send me a brief, or message me anywhere I am.</p>
              <p className="ct__mailline">
                <a href={`mailto:${site.email}`}>{site.email}</a>
                <button type="button" onClick={copy}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </p>
            </>
          )}
          {compact && (
          <Reveal className="ct__direct" delay={200}>
            <a href={`mailto:${site.email}`} className="ct__email">
              {site.email}
              <span aria-hidden="true"> ↗</span>
            </a>
            <div className="ct__row">
              <button type="button" className="ct__copy" onClick={copy}>
                {copied ? '✓ Copied' : 'Copy address'}
              </button>
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className="ct__social">
                  {s.label} <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </Reveal>
          )}
          <span className="sr-only" aria-live="polite">
            {copied ? 'Email address copied' : ''}
          </span>
        </div>

        {/* The phone is the only object in the section. Its Mail app is the brief. */}
        {!compact && (
          <div className="ct__phone">
            <Scribble to="right" className="ct__scr">
              go on, tap Mail
            </Scribble>
            <Phone
              composing={composing}
              onCompose={setComposing}
              compose={composeScreen}
              lock={
                <>
                  <span className="ph__lock-k" aria-hidden="true">Contact</span>
                  <span className="ph__lock-t" aria-hidden="true">
                    {headline[0]}
                    <br />
                    <em>{headline[1]}</em>
                  </span>
                </>
              }
              mail={
                <>
                  <a href={`mailto:${site.email}`}>{site.email}</a>
                  <button type="button" onClick={copy}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </>
              }
            />
          </div>
        )}

        {compact && (
        <Reveal className={cx('ct__card reveal-hinge', done && 'is-done')} delay={150}>
          {done ? (
            <div className="ct__thanks" role="status">
              <span className="ct__tick" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M5 12.5l4.2 4.2L19 7" />
                </svg>
              </span>
              <h3>{state === 'sent' ? 'Sent. Thank you.' : 'Your email app has it.'}</h3>
              <p>
                {state === 'sent'
                  ? `I’ll reply to ${form.email.trim()} soon.`
                  : `Your message is written and addressed to ${site.email}. Press send there and it’s on its way.`}
              </p>
              <button type="button" className="ct__again" onClick={reset}>
                Write another
              </button>
            </div>
          ) : (
            <form
              ref={formRef}
              className="ct__form"
              onSubmit={submit}
              noValidate
            >
              <fieldset className="ct__kinds">
                <legend className="label">What are we building?</legend>
                <div>
                  {KINDS.map((k) => (
                    <label key={k} className={cx('ct__kind', form.kind === k && 'is-on')}>
                      <input type="radio" name="kind" value={k} checked={form.kind === k} onChange={set('kind')} />
                      {k}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="ct__pair">
                {field('name', 'Your name', { autoComplete: 'name' })}
                {field('email', 'Email', { type: 'email', autoComplete: 'email', inputMode: 'email' })}
              </div>
              {field('message', 'Tell me about it', { rows: 5 })}

              <div className="ct__send">
                <button type="submit" className={cx('ct__submit', state === 'sending' && 'is-sending')} disabled={state === 'sending'}>
                  <span>{state === 'sending' ? 'Sending…' : 'Send message'}</span>
                  <i aria-hidden="true">→</i>
                </button>
                <p className="ct__small">
                  {state === 'failed' ? (
                    <span className="ct__err">Couldn’t send just now. Email {site.email} directly and I’ll pick it up.</span>
                  ) : endpoint ? (
                    'Goes straight to my inbox.'
                  ) : (
                    'Opens your email app with this message ready to send.'
                  )}
                </p>
              </div>
            </form>
          )}
        </Reveal>
        )}
      </div>
    </section>
  )
}
