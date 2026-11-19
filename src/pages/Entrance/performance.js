/*
  The welcome can be performed by a real person instead of the drawn figure.

  Film it like this and it drops straight into the doorway, no editing or keying needed:
  - A plain white or very light wall behind you, evenly lit. The clip is multiplied onto the
    room's light, so white disappears and only you remain.
  - Camera fixed on a tripod at doorway height, framing a doorway about 2.3 times taller than wide.
  - Your performance: you peek round the right-hand side of the frame, notice the viewer, nod,
    step into the doorway, push the door open with your right hand, then gesture "come in".
  - 8–10 seconds, no sound needed, 1080x2340 (portrait, matches the doorway) H.264 MP4, under 4 MB.

  Put the file in /public/welcome/ and fill in `src`. Then set `door`: the door's angle in degrees
  at moments in your clip, so the drawn door moves exactly when your hand pushes it.
*/
export const filmed = {
  src: null, // '/welcome/akeem.mp4'
  poster: null, // '/welcome/akeem.jpg' — first frame, shown while the clip loads
  door: [
    [0, 1.5],
    [1.2, 16],
    [1.8, 13],
    [5.6, 13],
    [7.0, 78],
  ],
  invite: 7.2, // clip time when your gesture is complete and "Come in" lights up
}

// Door angle at clip time t, interpolated between the keyframes above.
export function doorAt(t) {
  const k = filmed.door
  if (t <= k[0][0]) return k[0][1]
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) {
      const [t0, a0] = k[i - 1]
      const [t1, a1] = k[i]
      const u = (t - t0) / (t1 - t0)
      return a0 + (a1 - a0) * (u * u * (3 - 2 * u))
    }
  }
  return k[k.length - 1][1]
}
