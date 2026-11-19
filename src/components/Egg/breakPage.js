/*
  How the bug "wrecks" the page without really touching it. The falling and tilting are Web
  Animations layered on the elements (cancel one and it's gone), and the "Hire Akeem" text swap
  keeps the original of every text node. `repair()` undoes all of it at any point. Only what's on
  screen gets touched, so scrolling away shows the rest of the site untouched.
*/
let running = []
let swapped = []

const onScreen = (r) => r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && r.width > 0 && r.height > 0

// Grab chunks small enough that the page breaks apart instead of dropping as one slab.
function pieces() {
  const out = []
  const walk = (el) => {
    for (const c of el.children) {
      if (c.closest('.egg__perch')) continue
      const r = c.getBoundingClientRect()
      if (!onScreen(r)) continue
      const big = r.height > innerHeight * 0.34 || r.width > innerWidth * 0.8
      if (big && c.children.length) walk(c)
      else out.push(c)
    }
  }
  for (const s of ['#main', 'footer']) {
    const el = document.querySelector(s)
    if (el) walk(el)
  }
  const nav = document.querySelector('header.nav')
  if (nav) out.push(nav)
  return out.slice(0, 90)
}

export function collapse(reduced) {
  repair()
  if (reduced) return
  pieces().forEach((el, i) => {
    const r = el.getBoundingClientRect()
    const side = i % 2 ? 1 : -1
    const fall = innerHeight - r.top + r.height + 60
    running.push(
      el.animate(
        [
          { transform: 'none', offset: 0 },
          { transform: `translate(${side * 3}px, 1px)`, offset: 0.1 },
          { transform: `translate(${-side * 3}px, -1px)`, offset: 0.2 },
          { transform: `translate(${side * 2}px, 0) rotate(${side * 0.6}deg)`, offset: 0.3, easing: 'cubic-bezier(0.5, 0, 0.9, 0.6)' },
          { transform: `translate(${side * (20 + (i % 5) * 16)}px, ${fall}px) rotate(${side * (6 + (i % 7) * 4)}deg)`, offset: 1 },
        ],
        { duration: 1250 + (i % 6) * 70, delay: (i % 9) * 40, fill: 'both' },
      ),
    )
  })
}

/* The repair: everything comes back slightly crooked, and every word says the same thing. */
export function rebuildWrong(reduced) {
  repair()
  if (!reduced) {
    pieces().forEach((el, i) => {
      const a = ((i * 37) % 7) - 3
      const y = ((i * 53) % 9) - 4
      running.push(el.animate([{ transform: `translateY(${y}px) rotate(${a * 0.5}deg)` }], { duration: 1, fill: 'forwards' }))
    })
  }
  for (const root of [document.querySelector('header.nav'), document.querySelector('#main'), document.querySelector('footer')]) {
    if (!root) continue
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    const nodes = []
    while (w.nextNode()) nodes.push(w.currentNode)
    for (const n of nodes) {
      const text = n.nodeValue.trim()
      const host = n.parentElement
      if (text.length < 2 || host.closest('.egg__perch, .sr-only, script, style, .footer__name')) continue
      if (!onScreen(host.getBoundingClientRect())) continue
      swapped.push([n, n.nodeValue])
      n.nodeValue = text.length < 22 ? 'Hire Akeem' : 'Hire Akeem. '.repeat(Math.max(1, Math.round(text.length / 12))).trim()
    }
  }
}

export function repair() {
  running.forEach((a) => a.cancel())
  running = []
  swapped.forEach(([n, v]) => (n.nodeValue = v))
  swapped = []
}
