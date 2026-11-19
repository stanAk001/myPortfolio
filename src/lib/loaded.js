// Resolves once the welcome is gone, so the hero animation starts on a clean frame instead of
// playing hidden behind it.
let resolve
export const pageReady = new Promise((r) => (resolve = r))
export const markReady = () => resolve()

// Set when the welcome's exit already landed the visitor on the hero. The hero then skips its own
// entrance, since that transition was the entrance.
let handoff = false
export const setHandoff = () => (handoff = true)
export const takeHandoff = () => {
  const h = handoff
  handoff = false
  return h
}
