// Layout probe: reports each section's top/bottom and flags any overlap between consecutive sections.
import { chromium } from 'playwright-core'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const p = await ctx.newPage()
await p.goto('http://[::1]:5173/work')
await wait(3000)
// Scroll the whole page slowly so lazy media loads, then measure.
const H = await p.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < H; y += 700) {
  await p.evaluate((y) => window.scrollTo(0, y), y)
  await wait(150)
}
await wait(1500)
const report = await p.evaluate(() => {
  const top = (el) => el.getBoundingClientRect().top + scrollY
  return [...document.querySelectorAll('main > *')].map((el) => {
    const t = top(el)
    return { el: (el.id || el.className || el.tagName).toString().slice(0, 40), top: Math.round(t), bottom: Math.round(t + el.offsetHeight) }
  })
})
report.forEach((r, i) => {
  const prev = report[i - 1]
  console.log(`${r.el.padEnd(42)} ${String(r.top).padStart(7)} → ${String(r.bottom).padStart(7)}${prev && r.top < prev.bottom - 1 ? '   ⚠ overlaps previous by ' + (prev.bottom - r.top) : ''}`)
})
await browser.close()
