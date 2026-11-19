import { useId, useRef, useState } from 'react'

export function Field({ label, hint, children }) {
  const id = useId()
  return (
    <div className="af">
      <label className="af__label" htmlFor={id}>
        {label}
        {hint && <span className="af__hint">{hint}</span>}
      </label>
      {typeof children === 'function' ? children(id) : children}
    </div>
  )
}

export function Text({ label, hint, value, onChange, placeholder, type = 'text' }) {
  return (
    <Field label={label} hint={hint}>
      {(id) => <input id={id} type={type} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)} />}
    </Field>
  )
}

export function Area({ label, hint, value, onChange, rows = 3 }) {
  return (
    <Field label={label} hint={hint}>
      {(id) => <textarea id={id} rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)} />}
    </Field>
  )
}

// A list of strings edited as one line per item.
export function Lines({ label, hint = 'One per line', value, onChange, rows = 4 }) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <textarea
          id={id}
          rows={rows}
          value={(value ?? []).join('\n')}
          onChange={(e) => onChange(e.target.value.split('\n').map((s) => s.trimStart()).filter((s, i, all) => s || i < all.length - 1))}
          onBlur={(e) => onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
        />
      )}
    </Field>
  )
}

export function Csv({ label, hint = 'Comma separated', value, onChange }) {
  const [draft, setDraft] = useState(null)
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <input
          id={id}
          value={draft ?? (value ?? []).join(', ')}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft === null) return
            onChange(draft.split(',').map((s) => s.trim()).filter(Boolean))
            setDraft(null)
          }}
        />
      )}
    </Field>
  )
}

export function Toggle({ label, hint, value, onChange }) {
  return (
    <label className="af af--toggle">
      <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
      <span className="af__switch" aria-hidden="true" />
      <span>
        {label}
        {hint && <span className="af__hint">{hint}</span>}
      </span>
    </label>
  )
}

export function Select({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      {(id) => (
        <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
          {options.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      )}
    </Field>
  )
}

export function Color({ label, value, onChange }) {
  return (
    <Field label={label}>
      {(id) => (
        <div className="af__color">
          <input id={id} type="color" value={value ?? '#000000'} onChange={(e) => onChange(e.target.value)} />
          <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} aria-label={`${label} hex`} />
        </div>
      )}
    </Field>
  )
}

// A path field with an upload button that saves the file into public/projects/<id>/.
export function Media({ label, hint, value, onChange, projectId, accept = 'image/*', upload }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const isVideo = /\.(mp4|webm)$/i.test(value ?? '')
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <div className="af__media">
          {value && (isVideo ? <video src={value} muted loop autoPlay playsInline /> : <img src={value} alt="" />)}
          <div className="af__media-row">
            <input id={id} value={value ?? ''} placeholder="/projects/…" onChange={(e) => onChange(e.target.value || null)} />
            <button type="button" className="ab ab--ghost" disabled={busy || !projectId} onClick={() => input.current.click()}>
              {busy ? 'Uploading…' : 'Upload'}
            </button>
            <input
              ref={input}
              type="file"
              accept={accept}
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setBusy(true)
                const path = await upload(projectId, file).catch((err) => alert(err.message))
                setBusy(false)
                e.target.value = ''
                if (path) onChange(path)
              }}
            />
          </div>
        </div>
      )}
    </Field>
  )
}
