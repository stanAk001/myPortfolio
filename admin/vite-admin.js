/*
  The admin's backend: a handful of endpoints on the *local* dev server only (`apply: 'serve'`).
  They never exist in the production build, so there's nothing on the public site to attack.

  GET  /__admin/content            → src/content/content.json
  PUT  /__admin/content            → validate + write it (the dev server then reloads the page)
  POST /__admin/upload?id=&name=   → raw file body into public/projects/<id>/<name>
  POST /__admin/capture            → { id, url } → runs scripts/capture.mjs, returns its result
*/
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, extname, basename } from 'node:path'
import { spawn } from 'node:child_process'

const CONTENT = join(process.cwd(), 'src', 'content', 'content.json')
const PUBLIC_PROJECTS = join(process.cwd(), 'public', 'projects')
const ALLOWED = new Set(['.webp', '.jpg', '.jpeg', '.png', '.avif', '.gif', '.svg', '.mp4', '.webm'])
const MAX_UPLOAD = 60 * 1024 * 1024

const readBody = (req, limit = MAX_UPLOAD) =>
  new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > limit) {
        reject(new Error('File too large'))
        req.destroy()
      } else chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })

const send = (res, status, data) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

export function validate(content) {
  const errors = []
  if (!content || typeof content !== 'object') return ['Content must be an object']
  if (!content.site?.name) errors.push('Site name is required')
  if (!Array.isArray(content.projects)) return [...errors, 'Projects must be a list']
  const ids = new Set()
  content.projects.forEach((p, i) => {
    const where = `Project ${i + 1}${p?.title ? ` (${p.title})` : ''}`
    if (!p.id || !/^[a-z0-9-]+$/.test(p.id)) errors.push(`${where}: id must be lowercase letters, numbers and dashes`)
    if (ids.has(p.id)) errors.push(`${where}: id “${p.id}” is used twice`)
    ids.add(p.id)
    if (!p.title) errors.push(`${where}: title is required`)
    for (const key of ['liveUrl', 'repoUrl']) {
      if (p[key] && !/^https?:\/\//.test(p[key])) errors.push(`${where}: ${key} must start with https://`)
    }
  })
  return errors
}

const safeId = (s) => /^[a-z0-9-]+$/.test(s ?? '')
const safeName = (s) => {
  const name = basename(s ?? '').replace(/[^a-zA-Z0-9._-]/g, '-')
  return ALLOWED.has(extname(name).toLowerCase()) ? name : null
}

export default function adminPlugin() {
  return {
    name: 'portfolio-admin',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/__admin/')) return next()
        const url = new URL(req.url, 'http://local')
        try {
          if (url.pathname === '/__admin/content' && req.method === 'GET') {
            return send(res, 200, JSON.parse(await readFile(CONTENT, 'utf8')))
          }

          if (url.pathname === '/__admin/content' && req.method === 'PUT') {
            const content = JSON.parse((await readBody(req, 5 * 1024 * 1024)).toString('utf8'))
            const errors = validate(content)
            if (errors.length) return send(res, 400, { errors })
            await writeFile(CONTENT, JSON.stringify(content, null, 2) + '\n')
            return send(res, 200, { ok: true })
          }

          if (url.pathname === '/__admin/upload' && req.method === 'POST') {
            const id = url.searchParams.get('id')
            const name = safeName(url.searchParams.get('name'))
            if (!safeId(id)) return send(res, 400, { errors: ['Save the project with a valid id first'] })
            if (!name) return send(res, 400, { errors: ['Only images (webp, jpg, png, avif, gif, svg) and videos (mp4, webm)'] })
            const dir = join(PUBLIC_PROJECTS, id)
            await mkdir(dir, { recursive: true })
            await writeFile(join(dir, name), await readBody(req))
            return send(res, 200, { path: `/projects/${id}/${name}` })
          }

          if (url.pathname === '/__admin/capture' && req.method === 'POST') {
            const { id, url: site } = JSON.parse((await readBody(req, 10_000)).toString('utf8'))
            if (!safeId(id) || !/^https?:\/\//.test(site ?? '')) return send(res, 400, { errors: ['Needs a valid id and a https:// URL'] })
            const out = await new Promise((resolve) => {
              const child = spawn(process.execPath, ['scripts/capture.mjs', id, site], { cwd: process.cwd() })
              let stdout = ''
              let stderr = ''
              child.stdout.on('data', (d) => (stdout += d))
              child.stderr.on('data', (d) => (stderr += d))
              child.on('close', () => resolve({ stdout, stderr }))
            })
            const line = out.stdout.trim().split('\n').pop()
            try {
              return send(res, 200, JSON.parse(line))
            } catch {
              return send(res, 500, { errors: [out.stderr.trim() || 'Capture failed'] })
            }
          }

          return send(res, 404, { errors: ['Unknown admin endpoint'] })
        } catch (err) {
          return send(res, 500, { errors: [String(err.message ?? err)] })
        }
      })
    },
  }
}
