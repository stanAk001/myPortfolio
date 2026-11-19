import { useCallback, useEffect, useMemo, useState } from 'react'
import { Area, Color, Csv, Lines, Media, Select, Text, Toggle } from './fields'
import './Admin.css'

/*
  Local content editor. Only runs on the dev server (npm run dev → /admin). Saves straight into
  src/content/content.json and puts uploads in public/projects/<id>/.
  To publish, commit and push. Vercel redeploys with the new content.
*/

const api = async (path, options) => {
  const res = await fetch(`/__admin/${path}`, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data.errors ?? ['Request failed']).join('\n'))
  return data
}

const upload = (id, file) =>
  api(`upload?id=${encodeURIComponent(id)}&name=${encodeURIComponent(file.name)}`, { method: 'POST', body: file }).then((d) => d.path)

const slug = (s) =>
  (s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

const blankProject = () => ({
  id: '',
  title: 'New project',
  url: null,
  liveUrl: null,
  repoUrl: null,
  featured: false,
  lab: true,
  status: 'live',
  category: null,
  year: null,
  role: 'Full-stack development',
  tagline: [],
  headline: null,
  description: null,
  why: null,
  whatIBuilt: null,
  features: [],
  technologies: [],
  dna: {},
  theme: { accent: '#c56a3d', bg: '#13171a', treatment: 'editorial' },
  embed: false,
  image: null,
  video: null,
  gallery: [],
})

const PAGES = [
  ['profile', 'Profile & links'],
  ['welcome', 'Welcome, hero & story'],
  ['copy', 'Page copy'],
  ['github', 'GitHub'],
]

export default function Admin() {
  const [content, setContent] = useState(null)
  const [saved, setSaved] = useState(null)
  const [view, setView] = useState('profile')
  const [errors, setErrors] = useState([])
  const [status, setStatus] = useState('')

  useEffect(() => {
    document.title = 'Admin — portfolio'
    api('content')
      .then((c) => {
        setContent(c)
        setSaved(JSON.stringify(c))
      })
      .catch((e) => setErrors([e.message]))
  }, [])

  const dirty = content && JSON.stringify(content) !== saved

  const save = useCallback(async () => {
    if (!content) return
    setErrors([])
    setStatus('Saving…')
    try {
      await api('content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(content) })
      setSaved(JSON.stringify(content))
      setStatus('Saved — the site has updated')
    } catch (e) {
      setErrors(e.message.split('\n'))
      setStatus('')
    }
  }, [content])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        save()
      }
    }
    const beforeUnload = (e) => dirty && e.preventDefault()
    window.addEventListener('keydown', onKey)
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [save, dirty])

  useEffect(() => {
    if (!status || status === 'Saving…') return
    const id = setTimeout(() => setStatus(''), 3000)
    return () => clearTimeout(id)
  }, [status])

  if (!content) {
    return (
      <div className="admin admin--loading">
        <p>{errors[0] ?? 'Loading content…'}</p>
      </div>
    )
  }

  const setSite = (patch) => setContent((c) => ({ ...c, site: { ...c.site, ...patch } }))
  // Projects are selected by position, so renaming an id or reordering doesn't lose your place.
  const selected = view.startsWith('project:') ? Number(view.slice(8)) : -1
  const projectIndex = selected >= 0 && selected < content.projects.length ? selected : -1

  const setProject = (i, patch) =>
    setContent((c) => ({ ...c, projects: c.projects.map((p, j) => (j === i ? { ...p, ...patch } : p)) }))

  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= content.projects.length) return
    setContent((c) => {
      const list = [...c.projects]
      ;[list[i], list[j]] = [list[j], list[i]]
      return { ...c, projects: list }
    })
    if (view === `project:${i}`) setView(`project:${j}`)
    else if (view === `project:${j}`) setView(`project:${i}`)
  }

  const addProject = () => {
    setContent((c) => ({ ...c, projects: [...c.projects, blankProject()] }))
    setView(`project:${content.projects.length}`)
  }

  const removeProject = (i) => {
    const p = content.projects[i]
    if (!window.confirm(`Delete “${p.title}”? Its media files stay in public/projects/${p.id}/.`)) return
    setContent((c) => ({ ...c, projects: c.projects.filter((_, j) => j !== i) }))
    setView('profile')
  }

  return (
    <div className="admin">
      <header className="admin__bar">
        <a href="/" className="admin__brand">
          <b>{content.site.name}</b> — admin
        </a>
        <span className="admin__status" role="status">
          {status || (dirty ? 'Unsaved changes' : 'All changes saved')}
        </span>
        <a href="/" target="_blank" rel="noreferrer" className="ab ab--ghost">
          View site ↗
        </a>
        <button type="button" className="ab" onClick={save} disabled={!dirty}>
          Save <kbd>⌘S</kbd>
        </button>
      </header>

      <aside className="admin__side">
        <p className="admin__group">Site</p>
        {PAGES.map(([id, label]) => (
          <button key={id} type="button" className={view === id ? 'is-on' : undefined} onClick={() => setView(id)}>
            {label}
          </button>
        ))}
        <p className="admin__group">Projects</p>
        {content.projects.map((p, i) => {
          return (
            <div key={i} className={`admin__proj ${view === `project:${i}` ? 'is-on' : ''}`}>
              <button type="button" onClick={() => setView(`project:${i}`)}>
                <span>{p.title || 'Untitled'}</span>
                <small>{p.featured ? 'Main reel' : 'Lab'}</small>
              </button>
              <span className="admin__order">
                <button type="button" aria-label={`Move ${p.title} up`} onClick={() => move(i, -1)} disabled={i === 0}>
                  ↑
                </button>
                <button type="button" aria-label={`Move ${p.title} down`} onClick={() => move(i, 1)} disabled={i === content.projects.length - 1}>
                  ↓
                </button>
              </span>
            </div>
          )
        })}
        <button type="button" className="admin__add" onClick={addProject}>
          + Add project
        </button>
      </aside>

      <main className="admin__main">
        {errors.length > 0 && (
          <div className="admin__errors" role="alert">
            <b>Couldn’t save:</b>
            <ul>
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {view === 'profile' && <ProfileEditor site={content.site} setSite={setSite} />}
        {view === 'welcome' && <WelcomeEditor site={content.site} setSite={setSite} projects={content.projects} />}
        {view === 'copy' && <CopyEditor site={content.site} setSite={setSite} />}
        {view === 'github' && (
          <section className="admin__panel">
            <h1>GitHub</h1>
            <p className="admin__lede">With a username set, the site shows your live GitHub activity, and case studies with a repo link get a code viewer.</p>
            <Text
              label="GitHub username"
              value={content.github?.username}
              placeholder="e.g. akeem-dev"
              onChange={(v) => setContent((c) => ({ ...c, github: { ...c.github, username: v } }))}
            />
          </section>
        )}
        {projectIndex >= 0 && (
          <ProjectEditor
            key={projectIndex}
            project={content.projects[projectIndex]}
            set={(patch) => setProject(projectIndex, patch)}
            remove={() => removeProject(projectIndex)}
          />
        )}
        {view.startsWith('project:') && projectIndex < 0 && <p className="admin__lede">Pick a project on the left.</p>}
      </main>
    </div>
  )
}

function ProfileEditor({ site, setSite }) {
  const socials = site.socials ?? []
  const setSocial = (i, patch) => setSite({ socials: socials.map((s, j) => (j === i ? { ...s, ...patch } : s)) })
  return (
    <section className="admin__panel">
      <h1>Profile & links</h1>
      <div className="admin__cols">
        <Text label="Name" value={site.name} onChange={(v) => setSite({ name: v })} />
        <Text label="Role" value={site.role} onChange={(v) => setSite({ role: v })} />
      </div>
      <Text label="Email" type="email" hint="Every email link and the ‘sudo hire akeem’ command use this" value={site.email} onChange={(v) => setSite({ email: v })} />
      <h2>Social links</h2>
      {socials.map((s, i) => (
        <div className="admin__cols admin__cols--row" key={i}>
          <Text label="Label" value={s.label} onChange={(v) => setSocial(i, { label: v })} />
          <Text label="URL" value={s.url} placeholder="https://…" onChange={(v) => setSocial(i, { url: v })} />
          <button type="button" className="ab ab--danger" onClick={() => setSite({ socials: socials.filter((_, j) => j !== i) })}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="ab ab--ghost" onClick={() => setSite({ socials: [...socials, { label: 'Link', url: null }] })}>
        + Add link
      </button>
    </section>
  )
}

function WelcomeEditor({ site, setSite, projects }) {
  const story = site.story ?? { chapters: [] }
  const setChapter = (i, patch) => setSite({ story: { ...story, chapters: story.chapters.map((a, j) => (j === i ? { ...a, ...patch } : a)) } })
  const steps = ['Idea', 'Design', 'Build', 'Launch', 'Use']
  return (
    <section className="admin__panel">
      <h1>Welcome, hero & story</h1>
      <p className="admin__lede">Wrap words in *asterisks* to set them in the italic serif. Write for someone who has never written code.</p>
      <h2>Welcome screen</h2>
      <Text label="The line the hands type" hint="Keep it short and lowercase — it’s typed as a code comment" value={site.welcome?.line} onChange={(v) => setSite({ welcome: { ...site.welcome, line: v } })} />
      <h2>Hero</h2>
      <Area label="Headline" value={site.hero?.headline} onChange={(v) => setSite({ hero: { ...site.hero, headline: v } })} rows={2} />
      <Area label="Sentence under it" value={site.hero?.sub} onChange={(v) => setSite({ hero: { ...site.hero, sub: v } })} />
      <h2>“How an idea becomes a real website”</h2>
      <Select
        label="Project the story follows"
        value={story.projectId}
        onChange={(v) => setSite({ story: { ...story, projectId: v } })}
        options={projects.filter((p) => p.id).map((p) => [p.id, p.title])}
      />
      <Text label="The idea, on the sticky note" value={story.idea} onChange={(v) => setSite({ story: { ...story, idea: v } })} />
      {story.chapters.map((c, i) => (
        <div className="admin__cols" key={i}>
          <Text label={`${steps[i]} — headline`} value={c.title} onChange={(v) => setChapter(i, { title: v })} />
          <Area label={`${steps[i]} — text`} value={c.text} onChange={(v) => setChapter(i, { text: v })} />
        </div>
      ))}
    </section>
  )
}

function CopyEditor({ site, setSite }) {
  const blocks = site.about?.blocks ?? []
  return (
    <section className="admin__panel">
      <h1>Page copy</h1>
      <Area label="Introduction paragraph" value={site.statement} onChange={(v) => setSite({ statement: v })} rows={4} />
      <Text label="Work intro" value={site.workIntro} onChange={(v) => setSite({ workIntro: v })} />
      <h2>Engineering</h2>
      <Text label="Headline" value={site.engineering?.headline} onChange={(v) => setSite({ engineering: { ...site.engineering, headline: v } })} />
      <Area label="Intro" value={site.engineering?.intro} onChange={(v) => setSite({ engineering: { ...site.engineering, intro: v } })} />
      <h2>About</h2>
      <Text label="Headline" value={site.about?.headline} onChange={(v) => setSite({ about: { ...site.about, headline: v } })} />
      {blocks.map((b, i) => (
        <div className="admin__cols" key={i}>
          <Text label={`Block ${i + 1} label`} value={b.label} onChange={(v) => setSite({ about: { ...site.about, blocks: blocks.map((x, j) => (j === i ? { ...x, label: v } : x)) } })} />
          <Area label={`Block ${i + 1} text`} value={b.text} onChange={(v) => setSite({ about: { ...site.about, blocks: blocks.map((x, j) => (j === i ? { ...x, text: v } : x)) } })} />
        </div>
      ))}
      <h2>Contact</h2>
      <Lines label="Headline" hint="One line per row" value={site.contact?.headline} onChange={(v) => setSite({ contact: { ...site.contact, headline: v } })} rows={2} />
      <Text label="Note" value={site.contact?.note} onChange={(v) => setSite({ contact: { ...site.contact, note: v } })} />
    </section>
  )
}

function ProjectEditor({ project: p, set, remove }) {
  const [capture, setCapture] = useState({ state: 'idle' })
  const id = p.id
  const gallery = p.gallery ?? []
  const setGallery = (list) => set({ gallery: list })
  const ready = useMemo(() => /^[a-z0-9-]+$/.test(id ?? ''), [id])

  const runCapture = async () => {
    if (!ready || !p.liveUrl) return
    setCapture({ state: 'running' })
    try {
      const r = await api('capture', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, url: p.liveUrl }) })
      if (!r.ok) throw new Error(r.error ?? 'Capture failed')
      set({
        image: { src: r.files.cover, alt: p.image?.alt ?? `${p.title} home page.`, width: 1440, height: 900 },
        video: r.files.video ? { mp4: r.files.video, mobile: r.files.videoMobile, phone: r.files.phone } : p.video,
        gallery: r.gallery.map((g) => ({ ...g, alt: `${p.title}: ${g.caption}` })),
        embed: Boolean(r.frameable),
        headline: p.headline ?? r.h1 ?? null,
        description: p.description ?? r.description ?? null,
      })
      setCapture({ state: 'done', note: `Captured ${r.title ?? p.liveUrl}. Save to publish it.` })
    } catch (e) {
      setCapture({ state: 'error', note: e.message })
    }
  }

  return (
    <section className="admin__panel">
      <div className="admin__head">
        <h1>{p.title || 'Untitled project'}</h1>
        <button type="button" className="ab ab--danger" onClick={remove}>
          Delete project
        </button>
      </div>

      <h2>Basics</h2>
      <div className="admin__cols">
        <Text label="Title" value={p.title} onChange={(v) => set({ title: v })} />
        <Text
          label="Id"
          hint="Used in the URL: /work/<id>. Lowercase and dashes."
          value={p.id}
          placeholder={slug(p.title)}
          // Loose while typing (so "my-" can turn into "my-site"). slug() is only used for the suggestion.
          onChange={(v) => set({ id: (v ?? '').toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
        />
      </div>
      {!p.id && (
        <button type="button" className="ab ab--ghost" onClick={() => set({ id: slug(p.title) })}>
          Use “{slug(p.title)}” as the id
        </button>
      )}
      <div className="admin__cols">
        <Text label="Live URL" placeholder="https://…" value={p.liveUrl} onChange={(v) => set({ liveUrl: v })} />
        <Text label="Display URL" hint="Shown in the browser bar" placeholder="example.com" value={p.url} onChange={(v) => set({ url: v })} />
      </div>
      <Text label="GitHub repo" hint="Adds ‘View the code’ and the live code viewer" placeholder="https://github.com/you/repo" value={p.repoUrl} onChange={(v) => set({ repoUrl: v })} />
      <div className="admin__cols">
        <Select
          label="Status"
          value={p.status}
          onChange={(v) => set({ status: v })}
          options={[
            ['live', 'Live'],
            ['evolving', 'Evolving'],
            ['development', 'In development'],
            ['exploring', 'Exploring'],
          ]}
        />
        <Text label="Category" value={p.category} onChange={(v) => set({ category: v })} />
        <Text label="Year" value={p.year} onChange={(v) => set({ year: v })} />
      </div>
      <Toggle label="Feature in the main reel" hint="Off = shown in the Lab grid" value={p.featured} onChange={(v) => set({ featured: v, lab: !v })} />

      <h2>Media</h2>
      <div className="admin__capture">
        <div>
          <b>Capture from the live site</b>
          <p>Records a trailer, takes the hero, three section shots and a phone view. Takes about a minute.</p>
          {capture.note && <p className={capture.state === 'error' ? 'is-err' : 'is-ok'}>{capture.note}</p>}
        </div>
        <button type="button" className="ab" disabled={!ready || !p.liveUrl || capture.state === 'running'} onClick={runCapture}>
          {capture.state === 'running' ? 'Recording…' : 'Capture'}
        </button>
      </div>
      <Media
        label="Cover image"
        hint="1440×900 works best"
        value={p.image?.src}
        projectId={ready ? id : null}
        upload={upload}
        onChange={(src) => set({ image: src ? { width: 1440, height: 900, ...p.image, src } : null })}
      />
      <Text label="Cover alt text" value={p.image?.alt} onChange={(alt) => set({ image: { ...p.image, alt } })} />
      <div className="admin__cols">
        <Media label="Trailer (mp4)" value={p.video?.mp4} accept="video/mp4,video/webm" projectId={ready ? id : null} upload={upload} onChange={(mp4) => set({ video: mp4 ? { ...p.video, mp4 } : null })} />
        <Media label="Mobile trailer" hint="optional" value={p.video?.mobile} accept="video/mp4" projectId={ready ? id : null} upload={upload} onChange={(mobile) => set({ video: { ...p.video, mobile } })} />
        <Media label="Phone screen video" hint="Plays on the phone mockup" value={p.video?.phone} accept="video/mp4" projectId={ready ? id : null} upload={upload} onChange={(phone) => set({ video: { ...p.video, phone } })} />
      </div>
      <Toggle label="Embed the live site on the case study" hint="Only if the site allows framing — Capture checks this" value={p.embed} onChange={(v) => set({ embed: v })} />

      <h3>Gallery</h3>
      {gallery.map((g, i) => (
        <div className="admin__gallery" key={i}>
          <Media
            label={`Image ${i + 1}`}
            value={g.src}
            projectId={ready ? id : null}
            upload={upload}
            onChange={(src) => setGallery(gallery.map((x, j) => (j === i ? { ...x, src } : x)))}
          />
          <Text label="Caption" value={g.caption} onChange={(caption) => setGallery(gallery.map((x, j) => (j === i ? { ...x, caption } : x)))} />
          <button type="button" className="ab ab--danger" onClick={() => setGallery(gallery.filter((_, j) => j !== i))}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="ab ab--ghost" onClick={() => setGallery([...gallery, { src: null, caption: null, width: 1440, height: 900 }])}>
        + Add image
      </button>

      <h2>The problem it solved</h2>
      <p className="admin__lede">Shown in “Every product started as a frustration”. Leave the headline empty to hide this project there.</p>
      <Select
        label="Problem picture"
        value={p.problem?.visual}
        onChange={(v) => set({ problem: { ...p.problem, visual: v } })}
        options={[
          ['tabs', 'Too many tabs / sponsored reviews'],
          ['jargon', 'Confusing jargon'],
          ['scroll', 'Endless scrolling'],
          ['dms', 'Flood of messages'],
        ]}
      />
      <Text label="Problem headline" value={p.problem?.headline} onChange={(v) => set({ problem: { ...p.problem, headline: v } })} />
      <Area label="The problem, in a sentence or two" value={p.problem?.text} onChange={(v) => set({ problem: { ...p.problem, text: v } })} />
      <Text label="Address bar before the fix" hint="e.g. what someone would search" value={p.problem?.search} onChange={(v) => set({ problem: { ...p.problem, search: v } })} />
      <Area label="What I built" value={p.problem?.solution} onChange={(v) => set({ problem: { ...p.problem, solution: v } })} />
      <Lines label="What it fixed" hint="Short ticks, one per line" value={p.problem?.fixes} onChange={(v) => set({ problem: { ...p.problem, fixes: v } })} rows={3} />

      <h2>Story</h2>
      <Text label="In plain words" hint="One sentence anyone understands — shown under the video on the landing page" value={p.plain} onChange={(v) => set({ plain: v })} />
      <Lines label="Tagline" hint="Short lines, one per row" value={p.tagline} onChange={(v) => set({ tagline: v })} rows={3} />
      <Text label="Headline" value={p.headline} onChange={(v) => set({ headline: v })} />
      <Area label="What it is" value={p.description} onChange={(v) => set({ description: v })} rows={4} />
      <Area label="Why I built it" value={p.why} onChange={(v) => set({ why: v })} />
      <Area label="What I built" value={p.whatIBuilt} onChange={(v) => set({ whatIBuilt: v })} />
      <Text label="My role" value={p.role} onChange={(v) => set({ role: v })} />
      <Lines label="Key features" value={p.features} onChange={(v) => set({ features: v })} rows={6} />

      <h2>Stack & DNA</h2>
      <Csv label="Technologies" value={p.technologies} onChange={(v) => set({ technologies: v })} />
      <div className="admin__cols">
        <Text label="Product" value={p.dna?.product} onChange={(v) => set({ dna: { ...p.dna, product: v } })} />
        <Text label="Stack line" value={p.dna?.stack} onChange={(v) => set({ dna: { ...p.dna, stack: v } })} />
        <Text label="Focus" value={p.dna?.focus} onChange={(v) => set({ dna: { ...p.dna, focus: v } })} />
      </div>

      <h2>Look</h2>
      <div className="admin__cols">
        <Color label="Accent" value={p.theme?.accent} onChange={(v) => set({ theme: { ...p.theme, accent: v } })} />
        <Color label="Scene background" value={p.theme?.bg} onChange={(v) => set({ theme: { ...p.theme, bg: v } })} />
        <Select
          label="Backdrop"
          value={p.theme?.treatment}
          onChange={(v) => set({ theme: { ...p.theme, treatment: v } })}
          options={[
            ['directory', 'Directory index'],
            ['data', 'Data line'],
            ['commerce', 'Barcode'],
            ['editorial', 'Outlined title'],
            ['', 'None'],
          ]}
        />
      </div>
    </section>
  )
}
