// The room, in screen pixels. Everything in the scene is drawn from these few numbers.
export function room(w, h) {
  const portrait = w < h * 0.9
  const W = portrait ? Math.min(w * 0.4, h * 0.155) : Math.min(w * 0.14, h * 0.25)
  const cx = portrait ? w * 0.5 : w * 0.585
  const T = portrait ? h * 0.4 : h * 0.17
  const B = portrait ? h * 0.74 : h * 0.69
  const H = B - T
  // Eye height (the horizon) sits a little below the middle of the doorway.
  const eye = T + H * 0.46
  return { w, h, portrait, W, H, cx, eye, L: cx - W / 2, R: cx + W / 2, T, B, casing: W * 0.085 }
}

// The door is hinged on the left and swings away from us into the room. Where its free edge
// appears after `degrees`, with perspective: the further it swings, the smaller it reads.
export function leaf(r, degrees) {
  const a = (degrees * Math.PI) / 180
  const f = r.W * 3
  const s = f / (f + r.W * Math.sin(a))
  return {
    x: r.cx + (r.L + r.W * Math.cos(a) - r.cx) * s,
    top: r.eye + (r.T - r.eye) * s,
    bottom: r.eye + (r.B - r.eye) * s,
  }
}

// A point on the door's face: u across from hinge to free edge, v down from top to bottom.
export function onLeaf(r, e, u, v) {
  const top = r.T + (e.top - r.T) * u
  const bottom = r.B + (e.bottom - r.B) * u
  return [r.L + (e.x - r.L) * u, top + (bottom - top) * v]
}

// The far wall of the room behind the doorway; the side wall and floor run back to it.
export function interior(r) {
  const k = 0.6
  const at = (x, y) => [r.cx + (x - r.cx) * k, r.eye + (y - r.eye) * k]
  return { tl: at(r.L, r.T), tr: at(r.R, r.T), br: at(r.R, r.B), bl: at(r.L, r.B) }
}

// Throw a point on the threshold forward across the floor, away from a lamp inside the room.
export function cast(r, x, lamp, reach = 1) {
  const spread = ((r.h - r.B) / (r.B - r.T)) * (r.portrait ? 3 : 6)
  return [x + (x - lamp) * spread * reach, r.B + (r.h - r.B) * reach]
}

// The wedge of light on the floor, fanning out through the gap between door and jamb.
export function spill(r, edgeX, lamp, reach = 1) {
  return [[edgeX, r.B], [r.R, r.B], cast(r, r.R, lamp, reach), cast(r, edgeX, lamp, reach)]
}
