/*
  Records a live site into public/projects/<id>/:
    cover.webp, section-1..3.webp, mobile.webp, trailer.mp4, trailer-mobile.mp4

  node scripts/capture.mjs <id> <url>
  Used by the admin page's "Capture from live site" button. Needs Chrome or Edge installed
  (set CHROME_PATH if it lives somewhere unusual). Prints one JSON line with the results.
*/
import { chromium } from 'playwright-core'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import ffmpeg from 'ffmpeg-static'
import sharp from 'sharp'

const [id, url] = process.argv.slice(2)
if (!id || !/^[a-z0-9-]+$/.test(id) || !/^https?:\/\//.test(url ?? '')) {
  console.error('Usage: node scripts/capture.mjs <id> <https://url>')
  process.exit(1)
}

const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => p && existsSync(p))
if (!CHROME) {
  console.error('No Chrome or Edge found. Set CHROME_PATH to your browser executable.')
  process.exit(1)
}

const OUT = join(process.cwd(), 'public', 'projects', id)
const TMP = join(tmpdir(), `capture-${id}-${Date.now()}`)
mkdirSync(OUT, { recursive: true })
mkdirSync(TMP, { recursive: true })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch({ executablePath: CHROME })
const result = { id, url, files: {} }

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => page.waitForLoadState('load'))
  await wait(2000)

  result.title = await page.title()
  result.description = await page.evaluate(() => document.querySelector('meta[name="description"]')?.content ?? null)
  result.h1 = await page.evaluate(() => document.querySelector('h1')?.innerText.replace(/\s+/g, ' ').trim() ?? null)
  result.frameable = !/sameorigin|deny/i.test((await page.evaluate(() => '')) || '')

  // Headings to stop on: the first few section titles below the fold.
  const stops = await page.evaluate(() =>
    [...document.querySelectorAll('h2')]
      .map((h) => ({ text: h.innerText.replace(/\s+/g, ' ').trim(), y: h.getBoundingClientRect().top + scrollY - 110 }))
      .filter((h) => h.text && h.y > innerHeight * 0.6)
      .slice(0, 3),
  )

  await sharp(await page.screenshot()).webp({ quality: 84 }).toFile(join(OUT, 'cover.webp'))
  result.files.cover = `/projects/${id}/cover.webp`
  result.gallery = []
  for (let i = 0; i < stops.length; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), stops[i].y)
    await wait(1300)
    await sharp(await page.screenshot()).webp({ quality: 84 }).toFile(join(OUT, `section-${i + 1}.webp`))
    result.gallery.push({ src: `/projects/${id}/section-${i + 1}.webp`, caption: stops[i].text, width: 1440, height: 900 })
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await wait(1200)

  // Trailer: CDP screencast frames → H.264. Sharper than Playwright's built-in recorder.
  const cdp = await context.newCDPSession(page)
  const frames = []
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const file = `f${String(frames.length).padStart(5, '0')}.jpg`
    writeFileSync(join(TMP, file), Buffer.from(data, 'base64'))
    frames.push({ file, t: metadata.timestamp })
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
  })
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1440, maxHeight: 900 })
  const keepalive = setInterval(() => page.mouse.move(700 + Math.random(), 450).catch(() => {}), 40)
  const glide = (y, ms) =>
    page.evaluate(
      ({ y, ms }) =>
        new Promise((done) => {
          const from = scrollY
          const start = performance.now()
          const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
          const step = (now) => {
            const t = Math.min(1, (now - start) / ms)
            window.scrollTo(0, from + (y - from) * ease(t))
            t < 1 ? requestAnimationFrame(step) : done()
          }
          requestAnimationFrame(step)
        }),
      { y, ms },
    )
  await wait(2600)
  await glide(stops[1]?.y ?? stops[0]?.y ?? 1600, 5200)
  await wait(1500)
  await glide(0, 2200)
  await wait(700)
  clearInterval(keepalive)
  await cdp.send('Page.stopScreencast')
  await wait(300)

  if (frames.length > 10) {
    const list = []
    frames.forEach((f, i) => list.push(`file '${f.file}'`, `duration ${Math.max(0.001, (frames[i + 1]?.t ?? f.t + 1 / 30) - f.t).toFixed(4)}`))
    list.push(`file '${frames.at(-1).file}'`)
    writeFileSync(join(TMP, 'list.txt'), list.join('\n'))
    const encode = (file, width, crf) =>
      execFileSync(ffmpeg, ['-y', '-f', 'concat', '-safe', '0', '-i', join(TMP, 'list.txt'), '-vf', `fps=30,scale=${width}:-2:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-movflags', '+faststart', '-an', join(OUT, file)], { stdio: 'pipe' })
    encode('trailer.mp4', 1440, 23)
    encode('trailer-mobile.mp4', 960, 27)
    result.files.video = `/projects/${id}/trailer.mp4`
    result.files.videoMobile = `/projects/${id}/trailer-mobile.mp4`
  }
  await context.close()

  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  const pp = await phone.newPage()
  await pp.goto(url, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
  await wait(2000)
  await sharp(await pp.screenshot()).resize({ width: 780 }).webp({ quality: 84 }).toFile(join(OUT, 'mobile.webp'))
  result.gallery.push({ src: `/projects/${id}/mobile.webp`, caption: 'On a phone', width: 780, height: 1688 })

  // Phone trailer: the same slow scroll, at phone size, for the device mockups.
  const PHONE_TMP = join(TMP, 'phone')
  mkdirSync(PHONE_TMP, { recursive: true })
  const pcdp = await phone.newCDPSession(pp)
  const pframes = []
  pcdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const file = `p${String(pframes.length).padStart(5, '0')}.jpg`
    writeFileSync(join(PHONE_TMP, file), Buffer.from(data, 'base64'))
    pframes.push({ file, t: metadata.timestamp })
    await pcdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
  })
  await pcdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 780, maxHeight: 1688 })
  const pkeep = setInterval(() => pp.mouse.move(200 + Math.random(), 400).catch(() => {}), 40)
  const pglide = (y, ms) =>
    pp.evaluate(
      ({ y, ms }) =>
        new Promise((done) => {
          const from = scrollY
          const start = performance.now()
          const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
          const step = (now) => {
            const t = Math.min(1, (now - start) / ms)
            window.scrollTo(0, from + (y - from) * ease(t))
            t < 1 ? requestAnimationFrame(step) : done()
          }
          requestAnimationFrame(step)
        }),
      { y, ms },
    )
  await wait(2200)
  await pglide(844 * 2.6, 5600)
  await wait(1300)
  await pglide(0, 2400)
  await wait(600)
  clearInterval(pkeep)
  await pcdp.send('Page.stopScreencast')
  await wait(300)
  if (pframes.length > 10) {
    const list = []
    pframes.forEach((f, i) => list.push(`file '${f.file}'`, `duration ${Math.max(0.001, (pframes[i + 1]?.t ?? f.t + 1 / 30) - f.t).toFixed(4)}`))
    list.push(`file '${pframes.at(-1).file}'`)
    writeFileSync(join(PHONE_TMP, 'list.txt'), list.join('\n'))
    execFileSync(ffmpeg, ['-y', '-f', 'concat', '-safe', '0', '-i', join(PHONE_TMP, 'list.txt'), '-vf', 'fps=30,scale=600:-2:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-movflags', '+faststart', '-an', join(OUT, 'phone.mp4')], { stdio: 'pipe' })
    result.files.phone = `/projects/${id}/phone.mp4`
  }
  await phone.close()

  // Whether the case study can embed the site live.
  const res = await fetch(url, { method: 'GET', redirect: 'follow' }).catch(() => null)
  const xfo = res?.headers.get('x-frame-options') ?? ''
  const csp = res?.headers.get('content-security-policy') ?? ''
  result.frameable = !/deny|sameorigin/i.test(xfo) && !/frame-ancestors\s+('none'|'self')/i.test(csp)
  result.ok = true
} catch (err) {
  result.ok = false
  result.error = String(err?.message ?? err)
} finally {
  await browser.close()
  rmSync(TMP, { recursive: true, force: true })
}

console.log(JSON.stringify(result))
