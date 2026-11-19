/*
  Full-page QA screenshots: walks the home page one screen at a time and saves each frame.
  Needs `npm run dev` running.   node scripts/screenshot.mjs [width] [height] [outDir]
*/
import { chromium } from 'playwright-core'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const W = Number(process.argv[2] ?? 1440)
const H = Number(process.argv[3] ?? 900)
const OUT = process.argv[4] ?? join(tmpdir(), 'portfolio-qa')
const BASE = process.env.BASE ?? 'http://[::1]:5173'
mkdirSync(OUT, { recursive: true })

const CHROME = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find((p) => p && existsSync(p))
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const tag = W < 600 ? 'm' : 'd'

const browser = await chromium.launch({ executablePath: CHROME })
const ctx = await browser.newContext(W < 600 ? { viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: W, height: H } })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => m.type() === 'error' && !/ERR_|401/.test(m.text()) && errors.push(m.text()))
await page.goto(`${BASE}/work`)
await wait(3500)
const total = await page.evaluate(() => document.documentElement.scrollHeight)
let i = 0
for (let y = 0; y < total; y += Math.round(H * 0.9)) {
  await page.evaluate((y) => window.scrollTo(0, y), y)
  await wait(1300)
  await page.screenshot({ path: join(OUT, `${tag}-${String(i++).padStart(3, '0')}.png`) })
}
console.log(JSON.stringify({ frames: i, out: OUT, errors }))
await browser.close()
