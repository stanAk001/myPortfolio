import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useMedia'
import { cx } from '../../utils'
import './DistortImage.css'

/*
  A photo drawn through a small WebGL shader. At rest it's a warm duotone; under the cursor it
  ripples, splits into RGB based on cursor speed, then settles back to full colour.
  Plain WebGL, no three.js: it's one quad and one texture, not worth 150KB.
  The <img> underneath covers no WebGL, reduced motion and screen readers.
*/

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  v_uv.y = 1.0 - v_uv.y;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`

const FRAG = `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform vec2 u_img;
uniform vec2 u_mouse;
uniform vec2 u_vel;
uniform float u_hover;
uniform float u_time;
uniform float u_reveal;
varying vec2 v_uv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  // object-fit: cover
  float rs = u_res.x / u_res.y;
  float ri = u_img.x / u_img.y;
  vec2 scale = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  vec2 uv = (v_uv - 0.5) * scale + 0.5;

  vec2 aspect = vec2(rs, 1.0);
  float d = distance(v_uv * aspect, u_mouse * aspect);
  float lens = smoothstep(0.42, 0.0, d) * u_hover;

  vec2 wave = vec2(sin(v_uv.y * 18.0 + u_time * 2.2), cos(v_uv.x * 14.0 + u_time * 1.7)) * 0.004 * lens;
  vec2 shift = u_vel * lens * 0.06;
  vec2 p = uv + wave - shift * 0.5;

  vec3 col;
  col.r = texture2D(u_tex, p + shift).r;
  col.g = texture2D(u_tex, p).g;
  col.b = texture2D(u_tex, p - shift).b;

  float gray = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 ink = vec3(0.043, 0.043, 0.039);
  vec3 bone = vec3(0.925, 0.906, 0.871);
  vec3 duo = mix(ink, bone, smoothstep(0.02, 0.95, gray));
  duo = mix(duo, duo * vec3(1.06, 0.98, 0.9), 0.5);

  float colour = clamp(u_hover * 0.55 + lens * 0.6, 0.0, 1.0);
  vec3 outc = mix(duo, col, colour);

  float vig = smoothstep(1.15, 0.35, distance(v_uv, vec2(0.5)));
  outc *= mix(0.72, 1.0, vig);
  outc += (hash(v_uv * u_res + u_time) - 0.5) * 0.06;

  // Intro reveal: wipes up from the bottom (u_reveal 0 → 1).
  float r = u_reveal * 1.04;
  float hidden = smoothstep(r - 0.04, r, 1.0 - v_uv.y);
  gl_FragColor = vec4(outc, 1.0 - hidden);
}`

function compile(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
  return s
}

export default function DistortImage({ src, alt, width, height, className, revealRef }) {
  const wrap = useRef(null)
  const canvas = useRef(null)
  const reduced = useReducedMotion()
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (reduced || failed) return
    const el = wrap.current
    const cv = canvas.current
    const gl = cv.getContext('webgl', { premultipliedAlpha: false, alpha: true, antialias: false })
    if (!gl) return

    let prog
    try {
      prog = gl.createProgram()
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
      gl.linkProgram(prog)
      gl.useProgram(prog)
    } catch {
      return
    }

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const u = Object.fromEntries(
      ['u_res', 'u_img', 'u_mouse', 'u_vel', 'u_hover', 'u_time', 'u_reveal', 'u_tex'].map((n) => [n, gl.getUniformLocation(prog, n)]),
    )

    const state = { mx: 0.5, my: 0.5, tx: 0.5, ty: 0.5, vx: 0, vy: 0, hover: 0, target: 0, visible: true }
    // The intro can drive the reveal through this ref. Without it the photo just shows.
    const reveal = revealRef ?? { current: 1 }
    let raf = 0
    let loaded = false
    let tex = null

    const img = new Image()
    img.src = src
    img.onload = () => {
      tex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.uniform2f(u.u_img, img.naturalWidth, img.naturalHeight)
      gl.uniform1i(u.u_tex, 0)
      loaded = true
      setReady(true)
    }
    img.onerror = () => setFailed(true)

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const { width: w, height: h } = el.getBoundingClientRect()
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)
      gl.viewport(0, 0, cv.width, cv.height)
      gl.uniform2f(u.u_res, cv.width, cv.height)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    const io = new IntersectionObserver(([e]) => (state.visible = e.isIntersecting))
    io.observe(el)

    const move = (e) => {
      const b = el.getBoundingClientRect()
      state.tx = (e.clientX - b.left) / b.width
      state.ty = (e.clientY - b.top) / b.height
    }
    const enter = () => (state.target = 1)
    const leave = () => (state.target = 0)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointerleave', leave)

    const start = performance.now()
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      if (!loaded || !state.visible) return
      const px = state.mx
      const py = state.my
      state.mx += (state.tx - state.mx) * 0.12
      state.my += (state.ty - state.my) * 0.12
      state.vx += ((state.mx - px) * 40 - state.vx) * 0.15
      state.vy += ((state.my - py) * 40 - state.vy) * 0.15
      state.hover += (state.target - state.hover) * 0.06
      gl.uniform2f(u.u_mouse, state.mx, state.my)
      gl.uniform2f(u.u_vel, state.vx, state.vy)
      gl.uniform1f(u.u_hover, state.hover)
      gl.uniform1f(u.u_time, (now - start) / 1000)
      gl.uniform1f(u.u_reveal, reveal.current)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    raf = requestAnimationFrame(frame)

    // If the GPU drops the context (driver reset, too many tabs), fall back to the plain <img>.
    const onLost = (e) => {
      e.preventDefault()
      setReady(false)
    }
    cv.addEventListener('webglcontextlost', onLost)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointerleave', leave)
      cv.removeEventListener('webglcontextlost', onLost)
      img.onload = null
      // Free the GL objects but don't call loseContext(). A canvas only ever gets one context, so
      // killing it leaves a dead canvas (Chrome's sad face) when the effect runs again, which
      // StrictMode does in dev.
      if (tex) gl.deleteTexture(tex)
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
      setReady(false)
    }
  }, [src, reduced, revealRef, failed])

  // If the photo fails to load, show a monogram instead of the broken-image icon.
  if (failed) {
    return (
      <div ref={wrap} className={cx('distort distort--failed', className)} role="img" aria-label={alt}>
        <span aria-hidden="true">{alt?.[0] ?? '·'}</span>
      </div>
    )
  }

  return (
    <div ref={wrap} className={cx('distort', ready && 'is-gl', className)}>
      <img src={src} alt={alt} width={width} height={height} decoding="async" fetchPriority="high" onError={() => setFailed(true)} />
      <canvas ref={canvas} aria-hidden="true" />
    </div>
  )
}
